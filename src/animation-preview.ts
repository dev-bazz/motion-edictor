import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

interface KeyframeStop {
	offset: number;
	props: Record<string, string>;
}

interface ParsedKeyframe {
	name: string;
	stops: KeyframeStop[];
	sourceFile: string;
}

// Bump this whenever preview generation logic changes
const CACHE_VERSION = "v6";

let svgCacheDir = "";
let extensionContext: vscode.ExtensionContext | null = null;
const svgFileCache = new Map<string, string>();
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();
const keyframeFileCache = new Map<string, Map<string, ParsedKeyframe>>();
let fileWatcher: vscode.FileSystemWatcher | undefined;
let gutterWarningDecoration: vscode.TextEditorDecorationType | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
const DEBOUNCE_MS = 300;

export function initAnimationPreview(context: vscode.ExtensionContext) {
	extensionContext = context;
	svgCacheDir = path.join(context.globalStorageUri.fsPath, "animation-svgs");
	if (!fs.existsSync(svgCacheDir))
		fs.mkdirSync(svgCacheDir, { recursive: true });

	try {
		for (const file of fs.readdirSync(svgCacheDir)) {
			if (file.endsWith(".svg")) fs.unlinkSync(path.join(svgCacheDir, file));
		}
	} catch {
		// non-fatal
	}

	svgFileCache.clear();
	for (const dt of decorationTypeCache.values()) dt.dispose();
	decorationTypeCache.clear();

	const warningIconPath = path.join(svgCacheDir, "_warning.svg");
	fs.writeFileSync(warningIconPath, generateWarningSVG(), "utf8");
	gutterWarningDecoration = vscode.window.createTextEditorDecorationType({
		gutterIconPath: vscode.Uri.file(warningIconPath),
		gutterIconSize: "14px",
	});
	context.subscriptions.push(gutterWarningDecoration);

	fileWatcher = vscode.workspace.createFileSystemWatcher(
		"**/*.{css,scss,less,sass,vue,astro,html}",
	);
	fileWatcher.onDidChange((uri) => keyframeFileCache.delete(uri.fsPath));
	fileWatcher.onDidCreate((uri) => keyframeFileCache.delete(uri.fsPath));
	fileWatcher.onDidDelete((uri) => keyframeFileCache.delete(uri.fsPath));
	context.subscriptions.push(fileWatcher);

	console.log(`[animation-preview] init complete. SVG cache: ${svgCacheDir}`);
}

export function scheduleAnimationPreviewUpdate(editor: vscode.TextEditor) {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		void updateAnimationPreviews(editor);
	}, DEBOUNCE_MS);
}

async function updateAnimationPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor || !svgCacheDir) return;

		const doc = editor.document;
		const text = doc.getText();
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

		scanForAnimationNames(text, record);

		for (const dt of decorationTypeCache.values()) {
			editor.setDecorations(dt, []);
		}
		if (gutterWarningDecoration) {
			editor.setDecorations(gutterWarningDecoration, []);
		}

		if (nameRanges.size === 0) return;

		const allKeyframes = await collectAllKeyframes(doc);
		const notFoundRanges: vscode.DecorationOptions[] = [];
		let total = 0;

		for (const [animName, ranges] of nameRanges) {
			const kf = allKeyframes.get(animName.toLowerCase());

			if (!kf) {
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

			const relPath = vscode.workspace.asRelativePath(kf.sourceFile);
			const hoverMsg = new vscode.MarkdownString(
				`**@keyframes ${kf.name}**  \n📄 \`${relPath}\``,
			);
			hoverMsg.isTrusted = true;

			const decorOptions: vscode.DecorationOptions[] = ranges.map((range) => ({
				range,
				hoverMessage: hoverMsg,
			}));

			const dt = getOrCreateDecorationType(animName, kf);
			editor.setDecorations(dt, decorOptions);
			total += ranges.length;
		}

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

function scanForAnimationNames(
	text: string,
	record: (absStart: number, len: number, name: string) => void,
) {
	const propRe = /\banimation(?:-name)?\s*:\s*([\s\S]*?);/gi;
	let propMatch: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	while ((propMatch = propRe.exec(text)) !== null) {
		const fullMatch = propMatch[0];
		const valueStr = propMatch[1];

		const valueStartInFullMatch = fullMatch.indexOf(valueStr);
		if (valueStartInFullMatch === -1) continue;

		const absoluteValueStart = propMatch.index + valueStartInFullMatch;
		const entries = splitAnimationList(valueStr);

		let searchFrom = 0;

		for (const entry of entries) {
			const rawEntry = entry;
			const trimmedEntry = rawEntry.trim();
			if (!trimmedEntry) continue;

			const name = extractAnimationName(trimmedEntry);
			if (!name) continue;

			const entryIdx = valueStr.indexOf(rawEntry, searchFrom);
			if (entryIdx === -1) continue;

			const leadingWhitespace = rawEntry.length - rawEntry.trimStart().length;
			const nameIdxInEntry = trimmedEntry.indexOf(name);
			if (nameIdxInEntry === -1) continue;

			const absoluteNameStart =
				absoluteValueStart + entryIdx + leadingWhitespace + nameIdxInEntry;

			record(absoluteNameStart, name.length, name);
			searchFrom = entryIdx + rawEntry.length;
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
			result.push(current);
			current = "";
			continue;
		}
		current += ch;
	}

	if (current.trim()) result.push(current);
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

		if (TIME_RE.test(t) || NUMBER_RE.test(t) || ANIMATION_KEYWORDS.has(t)) {
			continue;
		}
		if (t.startsWith("cubic-bezier")) continue;
		if (t.startsWith("steps(")) continue;

		return token;
	}
	return null;
}

async function collectAllKeyframes(
	currentDoc: vscode.TextDocument,
): Promise<Map<string, ParsedKeyframe>> {
	const result = new Map<string, ParsedKeyframe>();

	function getForFile(
		fsPath: string,
		getText: () => string,
	): Map<string, ParsedKeyframe> {
		if (!keyframeFileCache.has(fsPath)) {
			const fr = new Map<string, ParsedKeyframe>();
			parseKeyframesFromText(getText(), fsPath, fr);
			keyframeFileCache.set(fsPath, fr);
		}
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return keyframeFileCache.get(fsPath)!;
	}

	const currentPath = currentDoc.uri.fsPath;
	const currentKfs = new Map<string, ParsedKeyframe>();
	parseKeyframesFromText(currentDoc.getText(), currentPath, currentKfs);

	for (const [k, v] of currentKfs) result.set(k, v);

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
			stops.push({
				offset: s === "from" ? 0 : s === "to" ? 1 : Number.parseFloat(s) / 100,
				props,
			});
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

function normaliseStops(stops: KeyframeStop[]): KeyframeStop[] {
	if (stops.length >= 2) return stops;
	if (stops.length === 0) return stops;

	const only = stops[0];

	if (only.offset === 1) {
		const fromProps: Record<string, string> = {};
		for (const [prop, val] of Object.entries(only.props)) {
			fromProps[prop] = implicitInitialValue(prop, val);
		}
		return [{ offset: 0, props: fromProps }, only];
	}

	if (only.offset === 0) {
		const toProps: Record<string, string> = {};
		for (const [prop, val] of Object.entries(only.props)) {
			toProps[prop] = implicitTerminalValue(prop, val);
		}
		return [only, { offset: 1, props: toProps }];
	}

	return [{ offset: 0, props: { ...only.props } }, only];
}

function implicitInitialValue(prop: string, toValue: string): string {
	if (prop === "opacity") return "0";

	if (prop === "transform") {
		if (/translateX/.test(toValue)) return "translateX(-16px)";
		if (/translateY/.test(toValue)) return "translateY(16px)";
		if (/translate\b/.test(toValue)) return "translate(0px, 16px)";
		if (/scaleX/.test(toValue)) return "scaleX(0.92)";
		if (/scaleY/.test(toValue)) return "scaleY(0.92)";
		if (/scale/.test(toValue)) return "scale(0.92)";
		if (/rotate/.test(toValue)) return "rotate(-12deg)";
		if (/skewX/.test(toValue)) return "skewX(-8deg)";
		if (/skewY/.test(toValue)) return "skewY(-8deg)";
		return "none";
	}

	return toValue;
}

function implicitTerminalValue(prop: string, fromValue: string): string {
	if (prop === "opacity") return "1";

	if (prop === "transform") {
		if (/translateX/.test(fromValue)) return "translateX(0px)";
		if (/translateY/.test(fromValue)) return "translateY(0px)";
		if (/translate\b/.test(fromValue)) return "translate(0px, 0px)";
		if (/scaleX/.test(fromValue)) return "scaleX(1)";
		if (/scaleY/.test(fromValue)) return "scaleY(1)";
		if (/scale/.test(fromValue)) return "scale(1)";
		if (/rotate/.test(fromValue)) return "rotate(0deg)";
		if (/skewX/.test(fromValue)) return "skewX(0deg)";
		if (/skewY/.test(fromValue)) return "skewY(0deg)";
		return "none";
	}

	return fromValue;
}

function getOrCreateDecorationType(
	animName: string,
	kf: ParsedKeyframe,
): vscode.TextEditorDecorationType {
	const cacheKey = CACHE_VERSION + animName + JSON.stringify(kf.stops);

	if (decorationTypeCache.has(cacheKey)) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return decorationTypeCache.get(cacheKey)!;
	}

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

const W = 80;
const H = 32;
const DOT = 8;
const DURATION = "1.6s";

function generateAnimatedSVG(kf: ParsedKeyframe): string {
	const stops = normaliseStops(kf.stops);
	if (stops.length < 2) return fallbackSVG();

	const allProps = new Set(stops.flatMap((s) => Object.keys(s.props)));
	const tx = (s: KeyframeStop) => s.props.transform ?? "";

	const hasTranslateX = stops.some((s) => /translateX\s*\(/i.test(tx(s)));
	const hasTranslateY = stops.some((s) => /translateY\s*\(/i.test(tx(s)));
	const hasRotate = stops.some((s) => /rotate\s*\(/i.test(tx(s)));
	const hasScale = stops.some((s) => /scale\s*\(/i.test(tx(s)));
	const hasOpacity = allProps.has("opacity");

	if (hasOpacity && (hasTranslateX || hasTranslateY || hasRotate || hasScale)) {
		return combinedSVG(stops, {
			hasTranslateX,
			hasTranslateY,
			hasRotate,
			hasScale,
		});
	}

	if (hasTranslateX) return translateXSVG(stops);
	if (hasTranslateY) return translateYSVG(stops);
	if (hasRotate) return rotateSVG(stops);
	if (hasScale) return scaleSVG(stops);
	if (hasOpacity) return opacitySVG(stops);

	return fallbackSVG();
}

function svgWrapper(inner: string): string {
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" ry="6" fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  ${inner}
</svg>`;
}

function keyTimes(stops: KeyframeStop[]): string {
	return stops.map((s) => s.offset.toFixed(3)).join(";");
}

function splines(stops: KeyframeStop[]): string {
	return Array(Math.max(stops.length - 1, 1))
		.fill("0.4 0 0.2 1")
		.join(";");
}

function parsePx(val: string): number {
	const m = val.match(/([-\d.]+)\s*px/i);
	if (m) return Number.parseFloat(m[1]);

	const bare = val.match(/^([-\d.]+)$/);
	return bare ? Number.parseFloat(bare[1]) : 0;
}

function parseDeg(val: string): number {
	const deg = val.match(/([-\d.]+)\s*deg/i);
	if (deg) return Number.parseFloat(deg[1]);

	const turn = val.match(/([-\d.]+)\s*turn/i);
	if (turn) return Number.parseFloat(turn[1]) * 360;

	const bare = val.match(/rotate\s*\(\s*([-\d.]+)\s*\)/i);
	if (bare) return Number.parseFloat(bare[1]);

	return 0;
}

function parseScale(val: string): number {
	const m = val.match(/scale\s*\(\s*([-\d.]+)/i);
	return m ? Number.parseFloat(m[1]) : 1;
}

function parseOpacityVals(stops: KeyframeStop[]): string {
	return stops
		.map((s) =>
			Math.min(
				1,
				Math.max(0, Number.parseFloat(s.props.opacity ?? "1")),
			).toFixed(3),
		)
		.join(";");
}

function getTranslateYRawVals(stops: KeyframeStop[]): number[] {
	return stops.map((s) => {
		const t = s.props.transform ?? "";
		const m = t.match(/translateY\s*\(\s*([-\d.]+(?:px|%)?)\s*\)/i);
		if (!m) return 0;
		return m[1].endsWith("%")
			? (Number.parseFloat(m[1]) / 100) * H
			: parsePx(m[1]);
	});
}

function getTranslateXRawVals(stops: KeyframeStop[]): number[] {
	return stops.map((s) => {
		const t = s.props.transform ?? "";
		const m = t.match(/translateX\s*\(\s*([-\d.]+(?:px|%)?)\s*\)/i);
		if (!m) return 0;
		return m[1].endsWith("%")
			? (Number.parseFloat(m[1]) / 100) * (W - DOT * 2)
			: parsePx(m[1]);
	});
}

function combinedSVG(
	stops: KeyframeStop[],
	flags: {
		hasTranslateX: boolean;
		hasTranslateY: boolean;
		hasRotate: boolean;
		hasScale: boolean;
	},
): string {
	const cx = W / 2;
	const cy = H / 2;
	const opVals = parseOpacityVals(stops);

	const opAnimate = `<animate attributeName="opacity" values="${opVals}" keyTimes="${keyTimes(
		stops,
	)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
		stops,
	)}"/>`;

	if (flags.hasTranslateY) {
		const rawVals = getTranslateYRawVals(stops);
		const minV = Math.min(...rawVals);
		const maxV = Math.max(...rawVals);
		const range = maxV - minV || 1;

		const trackH = H - DOT - 6;
		const startY = DOT / 2 + 3;
		const yValues = rawVals
			.map((v) => (startY + ((v - minV) / range) * trackH).toFixed(1))
			.join(";");

		return svgWrapper(`<circle r="${DOT / 2}" cx="${cx}" cy="${cy}" fill="#58b4f8">
    <animate attributeName="cy" values="${yValues}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
    ${opAnimate}
  </circle>`);
	}

	if (flags.hasTranslateX) {
		const rawVals = getTranslateXRawVals(stops);
		const minV = Math.min(...rawVals);
		const maxV = Math.max(...rawVals);
		const range = maxV - minV || 1;

		const trackW = W - DOT - 6;
		const startX = DOT / 2 + 3;

		const xValues = rawVals
			.map((v) => (startX + ((v - minV) / range) * trackW).toFixed(1))
			.join(";");

		return svgWrapper(`
  <line x1="${startX}" y1="${cy}" x2="${startX + trackW}" y2="${cy}" stroke="#2d3244" stroke-width="2" stroke-linecap="round"/>
  <circle r="${DOT / 2}" cy="${cy}" cx="${startX}" fill="#58b4f8">
    <animate attributeName="cx" values="${xValues}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
    ${opAnimate}
  </circle>`);
	}

	if (flags.hasRotate) {
		const degVals = stops.map((s) => parseDeg(s.props.transform ?? ""));
		const isFullSpin =
			Math.abs(degVals[degVals.length - 1] - degVals[0]) >= 360;

		return svgWrapper(`<g>
    <animateTransform attributeName="transform" type="rotate"
      values="${degVals.map((d) => `${d} ${cx} ${cy}`).join(";")}"
      keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite"
      calcMode="${isFullSpin ? "linear" : "spline"}" ${
				isFullSpin ? "" : `keySplines="${splines(stops)}"`
			}/>
    <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}" rx="2" fill="#58b4f8">
      ${opAnimate}
    </rect>
    <circle cx="${cx + DOT / 2 - 1}" cy="${cy - DOT / 2 + 1}" r="2" fill="#a78bfa"/>
  </g>`);
	}

	return opacitySVG(stops);
}

function translateXSVG(stops: KeyframeStop[]): string {
	const rawVals = getTranslateXRawVals(stops);
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
  <line x1="${startX}" y1="${cy}" x2="${startX + trackW}" y2="${cy}" stroke="#2d3244" stroke-width="2" stroke-linecap="round"/>
  <circle r="${DOT / 2}" cy="${cy}" cx="${startX}" fill="#58b4f8">
    <animate attributeName="cx" values="${xValues}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
  </circle>`);
}

function translateYSVG(stops: KeyframeStop[]): string {
	const rawVals = getTranslateYRawVals(stops);
	const minV = Math.min(...rawVals);
	const maxV = Math.max(...rawVals);
	const range = maxV - minV || 1;

	const trackH = H - DOT - 6;
	const startY = DOT / 2 + 3;
	const cx = W / 2;

	const yValues = rawVals
		.map((v) => (startY + ((v - minV) / range) * trackH).toFixed(1))
		.join(";");

	return svgWrapper(`<circle r="${DOT / 2}" cx="${cx}" cy="${startY}" fill="#58b4f8">
    <animate attributeName="cy" values="${yValues}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
  </circle>`);
}

function rotateSVG(stops: KeyframeStop[]): string {
	const cx = W / 2;
	const cy = H / 2;
	const degVals = stops.map((s) => parseDeg(s.props.transform ?? ""));
	const isFullSpin = Math.abs(degVals[degVals.length - 1] - degVals[0]) >= 360;

	return svgWrapper(`<g>
    <animateTransform attributeName="transform" type="rotate"
      values="${degVals.map((d) => `${d} ${cx} ${cy}`).join(";")}"
      keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite"
      calcMode="${isFullSpin ? "linear" : "spline"}" ${
				isFullSpin ? "" : `keySplines="${splines(stops)}"`
			}/>
    <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}" rx="2" fill="#58b4f8"/>
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

	return svgWrapper(`<rect rx="2" fill="#58b4f8" x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}">
    <animate attributeName="width"  values="${wVals}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
    <animate attributeName="height" values="${wVals}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
    <animate attributeName="x"      values="${xVals}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
    <animate attributeName="y"      values="${yVals}" keyTimes="${keyTimes(
			stops,
		)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
  </rect>`);
}

function opacitySVG(stops: KeyframeStop[]): string {
	const cx = W / 2;
	const cy = H / 2;

	return svgWrapper(`<rect x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}" rx="2" fill="#58b4f8">
    <animate attributeName="opacity" values="${parseOpacityVals(
			stops,
		)}" keyTimes="${keyTimes(stops)}" dur="${DURATION}" repeatCount="indefinite" calcMode="spline" keySplines="${splines(
			stops,
		)}"/>
  </rect>`);
}

function fallbackSVG(): string {
	return svgWrapper(`<circle cx="${W / 2}" cy="${H / 2}" r="${DOT / 2}" fill="#58b4f8">
    <animate attributeName="opacity" values="1;0.15;1" keyTimes="0;0.5;1" dur="${DURATION}" repeatCount="indefinite"/>
  </circle>`);
}

function generateWarningSVG(): string {
	return `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <polygon points="8,2 15,14 1,14" fill="#f59e0b" stroke="none"/>
  <text x="8" y="12.5" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#1a1a1a">!</text>
</svg>`;
}
