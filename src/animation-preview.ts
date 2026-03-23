import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyframeStop {
	offset: number;
	props: Record<string, string>;
}

interface ParsedKeyframe {
	name: string;
	stops: KeyframeStop[];
	sourceFile: string; // absolute path of the file where this was found
}

// ─── Module state ─────────────────────────────────────────────────────────────

let svgCacheDir = "";
let extensionContext: vscode.ExtensionContext | null = null;

// SVG file cache: cacheKey → absolute path on disk
const svgFileCache = new Map<string, string>();

// Decoration type cache: cacheKey → TextEditorDecorationType
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

// Keyframe cache per source file: fsPath → Map<lowerName, ParsedKeyframe>
const keyframeFileCache = new Map<string, Map<string, ParsedKeyframe>>();

// File watcher to invalidate stale cache entries
let fileWatcher: vscode.FileSystemWatcher | undefined;

// Gutter warning decoration (one shared instance for all "not found" lines)
let gutterWarningDecoration: vscode.TextEditorDecorationType | undefined;

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
const DEBOUNCE_MS = 300;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initAnimationPreview(context: vscode.ExtensionContext) {
	extensionContext = context;

	svgCacheDir = path.join(context.globalStorageUri.fsPath, "animation-svgs");
	if (!fs.existsSync(svgCacheDir)) {
		fs.mkdirSync(svgCacheDir, { recursive: true });
	}

	// Write the gutter warning SVG to disk
	const warningIconPath = path.join(svgCacheDir, "_warning.svg");
	fs.writeFileSync(warningIconPath, generateWarningSVG(), "utf8");

	gutterWarningDecoration = vscode.window.createTextEditorDecorationType({
		gutterIconPath: vscode.Uri.file(warningIconPath),
		gutterIconSize: "14px",
	});
	context.subscriptions.push(gutterWarningDecoration);

	// Watch CSS/SCSS/LESS/SASS/Vue/Astro/HTML for changes → invalidate cache
	fileWatcher = vscode.workspace.createFileSystemWatcher(
		"**/*.{css,scss,less,sass,vue,astro,html}",
	);
	fileWatcher.onDidChange((uri) => keyframeFileCache.delete(uri.fsPath));
	fileWatcher.onDidCreate((uri) => keyframeFileCache.delete(uri.fsPath));
	fileWatcher.onDidDelete((uri) => keyframeFileCache.delete(uri.fsPath));
	context.subscriptions.push(fileWatcher);

	console.log(`[animation-preview] init complete. SVG cache: ${svgCacheDir}`);
}

// ─── Public debounced entry point ─────────────────────────────────────────────

/**
 * Call this from extension.ts on every relevant editor/document change.
 * Internally debounced so rapid keystrokes don't re-scan 300 files.
 */
export function scheduleAnimationPreviewUpdate(editor: vscode.TextEditor) {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(
		() => updateAnimationPreviews(editor),
		DEBOUNCE_MS,
	);
}

// ─── Core update ──────────────────────────────────────────────────────────────

async function updateAnimationPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor || !svgCacheDir) return;

		const doc = editor.document;
		const text = doc.getText();

		// animation name → ranges where that name appears
		const nameRanges = new Map<string, vscode.Range[]>();
		const seenOffsets = new Set<number>();

		function record(absStart: number, len: number, animName: string) {
			if (seenOffsets.has(absStart)) return;
			seenOffsets.add(absStart);
			const range = new vscode.Range(
				doc.positionAt(absStart),
				doc.positionAt(absStart + len),
			);
			if (!nameRanges.has(animName)) nameRanges.set(animName, []);
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			nameRanges.get(animName)!.push(range);
		}

		scanForAnimationNames(doc, text, record);

		// Clear all decorations first
		for (const dt of decorationTypeCache.values()) {
			editor.setDecorations(dt, []);
		}
		if (gutterWarningDecoration) {
			editor.setDecorations(gutterWarningDecoration, []);
		}

		if (nameRanges.size === 0) return;

		// Collect keyframes with per-file caching
		const allKeyframes = await collectAllKeyframes(doc);

		// Separate found vs not-found names
		const notFoundRanges: vscode.DecorationOptions[] = [];
		let total = 0;

		for (const [animName, ranges] of nameRanges) {
			const kf = allKeyframes.get(animName.toLowerCase());

			if (!kf) {
				// Show gutter warning on each line where this name appears
				for (const range of ranges) {
					notFoundRanges.push({
						range,
						hoverMessage: new vscode.MarkdownString(
							`⚠️ No \`@keyframes ${animName}\` found in workspace`,
						),
					});
				}
				continue;
			}

			// Build hover message showing source file
			const relPath = vscode.workspace.asRelativePath(kf.sourceFile);
			const hoverMsg = new vscode.MarkdownString(
				`**@keyframes ${kf.name}**  \n📄 \`${relPath}\``,
			);
			hoverMsg.isTrusted = true;

			// Build decoration options WITH hoverMessage for each range
			const decorOptions: vscode.DecorationOptions[] = ranges.map((range) => ({
				range,
				hoverMessage: hoverMsg,
			}));

			const dt = getOrCreateDecorationType(animName, kf);
			editor.setDecorations(dt, decorOptions);
			total += ranges.length;
		}

		// Apply gutter warnings for unresolved animation names
		if (gutterWarningDecoration && notFoundRanges.length > 0) {
			editor.setDecorations(gutterWarningDecoration, notFoundRanges);
		}

		console.log(
			`[animation-preview] ${total} previews, ${notFoundRanges.length} warnings in ${doc.fileName}`,
		);
	} catch (err) {
		console.error("[animation-preview] ERROR:", err);
	}
}

// ─── Animation name scanning ──────────────────────────────────────────────────

function scanForAnimationNames(
	doc: vscode.TextDocument,
	text: string,
	record: (absStart: number, len: number, name: string) => void,
) {
	for (let lineIdx = 0; lineIdx < doc.lineCount; lineIdx++) {
		const lineText = doc.lineAt(lineIdx).text;
		const lineOffset = doc.offsetAt(new vscode.Position(lineIdx, 0));

		const propMatch = lineText.match(/animation(?:-name)?\s*:\s*(.+)/i);
		if (!propMatch) continue;

		const valueStr = propMatch[1].replace(/;.*$/, "").trim();
		const valueOffset = lineText.indexOf(propMatch[1]);

		const entries = splitAnimationList(valueStr);
		for (const entry of entries) {
			const name = extractAnimationName(entry);
			if (!name) continue;

			const nameIdx = findNameIndex(valueStr, entries, entry, name);
			if (nameIdx === -1) continue;

			record(lineOffset + valueOffset + nameIdx, name.length, name);
		}
	}
}

function splitAnimationList(value: string): string[] {
	const result: string[] = [];
	let depth = 0;
	let current = "";
	for (const ch of value) {
		if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (ch === "," && depth === 0) {
			result.push(current.trim());
			current = "";
			continue;
		}
		current += ch;
	}
	if (current.trim()) result.push(current.trim());
	return result;
}

const ANIMATION_KEYWORDS = new Set([
	"none",
	"infinite",
	"normal",
	"reverse",
	"alternate",
	"alternate-reverse",
	"forwards",
	"backwards",
	"both",
	"running",
	"paused",
	"ease",
	"ease-in",
	"ease-out",
	"ease-in-out",
	"linear",
	"step-start",
	"step-end",
]);
const TIME_RE = /^\d*\.?\d+(ms|s)$/i;
const NUMBER_RE = /^\d*\.?\d+$/;

function extractAnimationName(entry: string): string | null {
	for (const token of entry.trim().split(/\s+/)) {
		const t = token.toLowerCase();
		if (TIME_RE.test(t)) continue;
		if (NUMBER_RE.test(t)) continue;
		if (ANIMATION_KEYWORDS.has(t)) continue;
		if (t.startsWith("cubic-bezier") || t.startsWith("steps(")) continue;
		return token;
	}
	return null;
}

function findNameIndex(
	fullValue: string,
	entries: string[],
	entry: string,
	name: string,
): number {
	let searchFrom = 0;
	for (const e of entries) {
		const entryIdx = fullValue.indexOf(e, searchFrom);
		if (e === entry) {
			const nameInEntry = e.indexOf(name);
			return nameInEntry === -1 ? -1 : entryIdx + nameInEntry;
		}
		searchFrom = entryIdx + e.length;
	}
	return -1;
}

// ─── Keyframe collection with per-file cache ──────────────────────────────────

async function collectAllKeyframes(
	currentDoc: vscode.TextDocument,
): Promise<Map<string, ParsedKeyframe>> {
	const result = new Map<string, ParsedKeyframe>();

	// Helper: get or parse keyframes for a file, using the cache
	function getForFile(
		fsPath: string,
		getText: () => string,
	): Map<string, ParsedKeyframe> {
		if (!keyframeFileCache.has(fsPath)) {
			const fileResult = new Map<string, ParsedKeyframe>();
			parseKeyframesFromText(getText(), fsPath, fileResult);
			keyframeFileCache.set(fsPath, fileResult);
		}
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return keyframeFileCache.get(fsPath)!;
	}

	// Current file first (highest priority — don't cache, it changes as user types)
	const currentPath = currentDoc.uri.fsPath;
	const currentKfs = new Map<string, ParsedKeyframe>();
	parseKeyframesFromText(currentDoc.getText(), currentPath, currentKfs);
	for (const [k, v] of currentKfs) result.set(k, v);

	// Workspace files — cached per file, invalidated by file watcher
	const uris = await vscode.workspace.findFiles(
		"**/*.{css,scss,less,sass,vue,astro,html}",
		"**/node_modules/**",
		300,
	);

	for (const uri of uris) {
		if (uri.fsPath === currentPath) continue;
		const fileKfs = getForFile(uri.fsPath, () => {
			try {
				return fs.readFileSync(uri.fsPath, "utf8");
			} catch {
				return "";
			}
		});
		// Only add names not already found (current file wins)
		for (const [k, v] of fileKfs) {
			if (!result.has(k)) result.set(k, v);
		}
	}

	return result;
}

function parseKeyframesFromText(
	text: string,
	sourceFile: string,
	out: Map<string, ParsedKeyframe>,
) {
	// Try to extract <style> blocks first (HTML/Vue/Astro)
	const styleBlockRe = /<style(\s[^>]*)?>[\s\S]*?<\/style>/gim;
	const openTagRe = /^<style(\s[^>]*)?>/i;
	const cssChunks: string[] = [];

	styleBlockRe.lastIndex = 0;
	let sm = styleBlockRe.exec(text);
	if (sm) {
		while (sm !== null) {
			const openM = openTagRe.exec(sm[0]);
			if (openM) {
				cssChunks.push(
					sm[0].slice(openM[0].length, sm[0].length - "</style>".length),
				);
			}
			sm = styleBlockRe.exec(text);
		}
	} else {
		cssChunks.push(text);
	}

	for (const css of cssChunks) {
		extractKeyframesFromCSS(css, sourceFile, out);
	}
}

function extractKeyframesFromCSS(
	css: string,
	sourceFile: string,
	out: Map<string, ParsedKeyframe>,
) {
	const kfRe = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/gi;
	let m = kfRe.exec(css);
	while (m !== null) {
		const name = m[1];
		const blockContent = extractBlock(css, m.index + m[0].length - 1);
		if (blockContent !== null && !out.has(name.toLowerCase())) {
			out.set(name.toLowerCase(), {
				name,
				stops: parseKeyframeStops(blockContent),
				sourceFile,
			});
		}
		m = kfRe.exec(css);
	}
}

function extractBlock(text: string, openBraceIdx: number): string | null {
	let depth = 0;
	let start = -1;
	for (let i = openBraceIdx; i < text.length; i++) {
		if (text[i] === "{") {
			depth++;
			if (depth === 1) start = i + 1;
		} else if (text[i] === "}") {
			depth--;
			if (depth === 0) return text.slice(start, i);
		}
	}
	return null;
}

function parseKeyframeStops(blockContent: string): KeyframeStop[] {
	const stops: KeyframeStop[] = [];
	const stopRe = /((?:(?:\d+(?:\.\d+)?%|from|to)\s*,?\s*)+)\s*\{([^}]*)\}/gi;
	let m = stopRe.exec(blockContent);
	while (m !== null) {
		const props = parseProps(m[2]);
		for (const sel of m[1].trim().split(/\s*,\s*/)) {
			const s = sel.trim().toLowerCase();
			const offset = s === "from" ? 0 : s === "to" ? 1 : Number.parseFloat(s) / 100;
			stops.push({ offset, props });
		}
		m = stopRe.exec(blockContent);
	}
	return stops.sort((a, b) => a.offset - b.offset);
}

function parseProps(propsText: string): Record<string, string> {
	const result: Record<string, string> = {};
	const propRe = /([\w-]+)\s*:\s*([^;]+)/g;
	let m = propRe.exec(propsText);
	while (m !== null) {
		result[m[1].trim().toLowerCase()] = m[2].trim();
		m = propRe.exec(propsText);
	}
	return result;
}

// ─── Decoration type management ───────────────────────────────────────────────

function getOrCreateDecorationType(
	animName: string,
	kf: ParsedKeyframe,
): vscode.TextEditorDecorationType {
	const cacheKey = animName + JSON.stringify(kf.stops);
	if (decorationTypeCache.has(cacheKey))
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return decorationTypeCache.get(cacheKey)!;

	const svgUri = getOrWriteAnimSVG(cacheKey, kf);
	const dt = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: svgUri,
			margin: "0 0 0 6px",
			width: "80px",
			height: "32px",
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	decorationTypeCache.set(cacheKey, dt);
	extensionContext?.subscriptions.push(dt);
	return dt;
}

function getOrWriteAnimSVG(cacheKey: string, kf: ParsedKeyframe): vscode.Uri {
	if (!svgFileCache.has(cacheKey)) {
		const safeName = cacheKey.replace(/[^a-z0-9\-_.]/gi, "_").substring(0, 80);
		const filePath = path.join(svgCacheDir, `anim_${safeName}.svg`);
		fs.writeFileSync(filePath, generateAnimatedSVG(kf), "utf8");
		svgFileCache.set(cacheKey, filePath);
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	return vscode.Uri.file(svgFileCache.get(cacheKey)!);
}

// ─── SVG generation ───────────────────────────────────────────────────────────

const W = 80;
const H = 32;
const DOT = 10;
const DURATION = "1.6s";

function generateAnimatedSVG(kf: ParsedKeyframe): string {
	const stops = kf.stops;
	if (stops.length === 0) return fallbackSVG();

	const allProps = stops.flatMap((s) => Object.keys(s.props));
	const transform = (s: KeyframeStop) => s.props.transform ?? "";

	if (stops.some((s) => /translateX\s*\(/i.test(transform(s))))
		return translateXSVG(stops);
	if (stops.some((s) => /translateY\s*\(/i.test(transform(s))))
		return translateYSVG(stops);
	if (stops.some((s) => /rotate\s*\(/i.test(transform(s))))
		return rotateSVG(stops);
	if (stops.some((s) => /scale\s*\(/i.test(transform(s))))
		return scaleSVG(stops);
	if (allProps.includes("opacity")) return opacitySVG(stops);
	return fallbackSVG();
}

function svgWrapper(inner: string): string {
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" ry="6"
        fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  ${inner}
</svg>`;
}

function keyTimes(stops: KeyframeStop[]): string {
	return stops.map((s) => s.offset.toFixed(3)).join(";");
}

function splines(stops: KeyframeStop[]): string {
	return stops
		.slice(0, -1)
		.map(() => "0.4 0 0.2 1")
		.join(";");
}

function parsePx(val: string): number {
	const m = val.match(/([-\d.]+)\s*px/i);
	return m ? Number.parseFloat(m[1]) : 0;
}

function parseScale(val: string): number {
	const m = val.match(/scale\s*\(\s*([-\d.]+)/i);
	return m ? Number.parseFloat(m[1]) : 1;
}

function translateXSVG(stops: KeyframeStop[]): string {
	const rawVals = stops.map((s) => {
		const t = s.props.transform ?? "";
		const m = t.match(/translateX\s*\(\s*([-\d.]+(?:px|%))\s*\)/i);
		if (!m) return 0;
		return m[1].endsWith("%")
			? (Number.parseFloat(m[1]) / 100) * (W - DOT * 2)
			: parsePx(m[1]);
	});
	const minV = Math.min(...rawVals);
	const maxV = Math.max(...rawVals);
	const range = maxV - minV || 1;
	const trackW = W - DOT - 6;
	const startX = DOT / 2 + 3;
	const cy = H / 2;
	const xValues = rawVals
		.map((v) => (startX + ((v - minV) / range) * trackW).toFixed(1))
		.join(";");

	return svgWrapper(`
  <line x1="${startX}" y1="${cy}" x2="${startX + trackW}" y2="${cy}"
        stroke="#2d3244" stroke-width="2" stroke-linecap="round"/>
  <circle r="${DOT / 2}" cy="${cy}" cx="${startX}" fill="#58b4f8">
    <animate attributeName="cx" values="${xValues}" keyTimes="${keyTimes(stops)}"
             dur="${DURATION}" repeatCount="indefinite"
             calcMode="spline" keySplines="${splines(stops)}"/>
  </circle>`);
}

function translateYSVG(stops: KeyframeStop[]): string {
	const rawVals = stops.map((s) => {
		const t = s.props.transform ?? "";
		const m = t.match(/translateY\s*\(\s*([-\d.]+(?:px|%))\s*\)/i);
		if (!m) return 0;
		return m[1].endsWith("%") ? (Number.parseFloat(m[1]) / 100) * H : parsePx(m[1]);
	});
	const minV = Math.min(...rawVals);
	const maxV = Math.max(...rawVals);
	const range = maxV - minV || 1;
	const trackH = H - DOT - 6;
	const startY = DOT / 2 + 3;
	const cx = W / 2;
	const yValues = rawVals
		.map((v) => (startY + ((v - minV) / range) * trackH).toFixed(1))
		.join(";");

	return svgWrapper(`
  <circle r="${DOT / 2}" cx="${cx}" cy="${startY}" fill="#58b4f8">
    <animate attributeName="cy" values="${yValues}" keyTimes="${keyTimes(stops)}"
             dur="${DURATION}" repeatCount="indefinite"
             calcMode="spline" keySplines="${splines(stops)}"/>
  </circle>`);
}

function rotateSVG(stops: KeyframeStop[]): string {
	const cx = W / 2;
	const cy = H / 2;
	const degVals = stops.map((s) => {
		const m = (s.props.transform ?? "").match(/rotate\s*\(\s*([-\d.]+)/i);
		return m ? Number.parseFloat(m[1]) : 0;
	});
	return svgWrapper(`
  <g>
    <animateTransform attributeName="transform" type="rotate"
      values="${degVals.map((d) => `${d} ${cx} ${cy}`).join(";")}"
      keyTimes="${keyTimes(stops)}" dur="${DURATION}"
      repeatCount="indefinite" calcMode="spline" keySplines="${splines(stops)}"/>
    <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}"
          width="${DOT}" height="${DOT}" rx="2" fill="#58b4f8"/>
    <circle cx="${cx + DOT / 2 - 1}" cy="${cy - DOT / 2 + 1}" r="2" fill="#a78bfa"/>
  </g>`);
}

function scaleSVG(stops: KeyframeStop[]): string {
	const cx = W / 2;
	const cy = H / 2;
	const scaleVals = stops.map((s) => parseScale(s.props.transform ?? "1"));
	const maxS = Math.max(...scaleVals);
	const norm = (v: number) => ((v / maxS) * DOT).toFixed(2);
	const wVals = scaleVals.map(norm).join(";");
	const xVals = scaleVals
		.map((v) => (cx - Number.parseFloat(norm(v)) / 2).toFixed(2))
		.join(";");
	const yVals = scaleVals
		.map((v) => (cy - Number.parseFloat(norm(v)) / 2).toFixed(2))
		.join(";");

	return svgWrapper(`
  <rect rx="2" fill="#58b4f8"
        x="${cx - DOT / 2}" y="${cy - DOT / 2}"
        width="${DOT}" height="${DOT}">
    <animate attributeName="width"  values="${wVals}" keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(stops)}"/>
    <animate attributeName="height" values="${wVals}" keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(stops)}"/>
    <animate attributeName="x"      values="${xVals}" keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(stops)}"/>
    <animate attributeName="y"      values="${yVals}" keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(stops)}"/>
  </rect>`);
}

function opacitySVG(stops: KeyframeStop[]): string {
	const cx = W / 2;
	const cy = H / 2;
	const opVals = stops
		.map((s) =>
			Math.min(1, Math.max(0, Number.parseFloat(s.props.opacity ?? "1"))).toFixed(
				3,
			),
		)
		.join(";");
	return svgWrapper(`
  <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}"
        width="${DOT}" height="${DOT}" rx="2" fill="#58b4f8">
    <animate attributeName="opacity" values="${opVals}" keyTimes="${keyTimes(stops)}"
             dur="${DURATION}" repeatCount="indefinite"
             calcMode="spline" keySplines="${splines(stops)}"/>
  </rect>`);
}

function fallbackSVG(): string {
	return svgWrapper(`
  <circle cx="${W / 2}" cy="${H / 2}" r="${DOT / 2}" fill="#58b4f8">
    <animate attributeName="opacity" values="1;0.15;1"
             keyTimes="0;0.5;1" dur="${DURATION}" repeatCount="indefinite"/>
  </circle>`);
}

// ─── Gutter warning icon SVG ──────────────────────────────────────────────────

function generateWarningSVG(): string {
	// Simple amber triangle warning icon, 16×16
	return `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <polygon points="8,2 15,14 1,14" fill="#f59e0b" stroke="none"/>
  <text x="8" y="12.5" text-anchor="middle"
        font-family="sans-serif" font-size="8"
        font-weight="bold" fill="#1a1a1a">!</text>
</svg>`;
}
