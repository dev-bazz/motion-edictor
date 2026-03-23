import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyframeStop {
	offset: number; // 0–1  (0% → 0, 50% → 0.5, from → 0, to → 1)
	props: Record<string, string>; // e.g. { transform: "translateX(100px)", opacity: "0" }
}

interface ParsedKeyframe {
	name: string;
	stops: KeyframeStop[];
}

// ─── Module state ─────────────────────────────────────────────────────────────

let svgCacheDir = "";
const svgFileCache = new Map<string, string>(); // cacheKey → file path on disk
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

// ─── Init (call once from activate()) ────────────────────────────────────────

export function initAnimationPreview(context: vscode.ExtensionContext) {
	svgCacheDir = path.join(context.globalStorageUri.fsPath, "animation-svgs");
	if (!fs.existsSync(svgCacheDir)) {
		fs.mkdirSync(svgCacheDir, { recursive: true });
	}
	console.log(`[animation-preview] SVG cache dir: ${svgCacheDir}`);
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Scans the editor for `animation:` / `animation-name:` shorthand properties,
 * resolves matching @keyframes from the current file and all workspace CSS/SCSS files,
 * then writes animated SVGs to disk and decorates inline.
 */
export async function updateAnimationPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor || !svgCacheDir) {
			return;
		}

		const doc = editor.document;
		const text = doc.getText();

		// animation name → ranges in this document
		const nameRanges = new Map<string, vscode.Range[]>();
		const seenOffsets = new Set<number>();

		function record(absStart: number, len: number, animName: string) {
			if (seenOffsets.has(absStart)) {
				return;
			}
			seenOffsets.add(absStart);
			const range = new vscode.Range(
				doc.positionAt(absStart),
				doc.positionAt(absStart + len),
			);
			if (!nameRanges.has(animName)) {
				nameRanges.set(animName, []);
			}
			nameRanges.get(animName)!.push(range);
		}

		// ── Find animation shorthand / animation-name usages ─────────────────
		// Matches lines like:
		//   animation: slideIn 1s ease;
		//   animation-name: bounce;
		//   animation: fadeIn 0.3s, slideUp 0.5s ease-in;
		scanForAnimationNames(doc, text, record);

		if (nameRanges.size === 0) {
			// Nothing found — clear all and return
			for (const dt of decorationTypeCache.values()) {
				editor.setDecorations(dt, []);
			}
			return;
		}

		// ── Collect all @keyframes from the workspace ─────────────────────────
		const allKeyframes = await collectAllKeyframes(doc);

		// ── Clear existing decorations ────────────────────────────────────────
		for (const dt of decorationTypeCache.values()) {
			editor.setDecorations(dt, []);
		}

		// ── Apply decorations for each found animation name ───────────────────
		let total = 0;
		for (const [animName, ranges] of nameRanges) {
			const kf = allKeyframes.get(animName.toLowerCase());
			if (!kf) {
				continue;
			} // no matching @keyframes found — skip silently

			const dt = getOrCreateDecorationType(animName, kf);
			editor.setDecorations(dt, ranges);
			total += ranges.length;
		}

		console.log(
			`[animation-preview] ${total} animation decorations in ${doc.fileName}`,
		);
	} catch (err) {
		console.error("[animation-preview] ERROR:", err);
	}
}

// ─── Scan for animation names in document ────────────────────────────────────

function scanForAnimationNames(
	doc: vscode.TextDocument,
	text: string,
	record: (absStart: number, len: number, name: string) => void,
) {
	// We scan line by line. For each line that contains animation: or animation-name:
	// we extract the animation name(s).
	for (let lineIdx = 0; lineIdx < doc.lineCount; lineIdx++) {
		const lineText = doc.lineAt(lineIdx).text;
		const lineOffset = doc.offsetAt(new vscode.Position(lineIdx, 0));

		// Match `animation:` shorthand or `animation-name:`
		const propMatch = lineText.match(/animation(?:-name)?\s*:\s*(.+)/i);
		if (!propMatch) {
			continue;
		}

		const valueStr = propMatch[1].replace(/;.*$/, "").trim(); // strip trailing ; and comments
		const valueOffset = lineText.indexOf(propMatch[1]);

		// animation: can be a comma-separated list of animations
		// Each entry: <name> <duration> <easing> <delay> <...>
		// The name is the token that is NOT a time value, NOT a known keyword, NOT a number
		const entries = splitAnimationList(valueStr);

		for (const entry of entries) {
			const name = extractAnimationName(entry);
			if (!name) {
				continue;
			}

			// Find where this name appears in the value string
			const nameIdx = findNameIndex(valueStr, entries, entry, name);
			if (nameIdx === -1) {
				continue;
			}

			const absStart = lineOffset + valueOffset + nameIdx;
			record(absStart, name.length, name);
		}
	}
}

/**
 * Split `animation` value by commas, but NOT commas inside cubic-bezier()/steps()
 */
function splitAnimationList(value: string): string[] {
	const result: string[] = [];
	let depth = 0;
	let current = "";
	for (const ch of value) {
		if (ch === "(") {
			depth++;
		} else if (ch === ")") {
			depth--;
		} else if (ch === "," && depth === 0) {
			result.push(current.trim());
			current = "";
			continue;
		}
		current += ch;
	}
	if (current.trim()) {
		result.push(current.trim());
	}
	return result;
}

// Keywords that are NOT animation names
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
	const tokens = entry.trim().split(/\s+/);
	for (const token of tokens) {
		const t = token.toLowerCase();
		if (TIME_RE.test(t)) {
			continue;
		}
		if (NUMBER_RE.test(t)) {
			continue;
		}
		if (ANIMATION_KEYWORDS.has(t)) {
			continue;
		}
		if (t.startsWith("cubic-bezier") || t.startsWith("steps(")) {
			continue;
		}
		// What's left is the name
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
	// Find the entry's start in the full value string
	let searchFrom = 0;
	for (const e of entries) {
		const entryIdx = fullValue.indexOf(e, searchFrom);
		if (e === entry) {
			// Find the name within this entry
			const nameInEntry = e.indexOf(name);
			if (nameInEntry === -1) {
				return -1;
			}
			return entryIdx + nameInEntry;
		}
		searchFrom = fullValue.indexOf(e, searchFrom) + e.length;
	}
	return -1;
}

// ─── Keyframe collection ──────────────────────────────────────────────────────

/**
 * Collects all @keyframes definitions from:
 *  1. The current document
 *  2. All CSS / SCSS / LESS / SASS / Vue / Astro files in the workspace
 * Returns a map of lowercase name → ParsedKeyframe
 */
async function collectAllKeyframes(
	currentDoc: vscode.TextDocument,
): Promise<Map<string, ParsedKeyframe>> {
	const result = new Map<string, ParsedKeyframe>();

	// Current file first (higher priority)
	parseKeyframesFromText(currentDoc.getText(), result);

	// Workspace files
	const uris = await vscode.workspace.findFiles(
		"**/*.{css,scss,less,sass,vue,astro,html}",
		"**/node_modules/**",
		300,
	);

	for (const uri of uris) {
		if (uri.fsPath === currentDoc.uri.fsPath) {
			continue;
		}
		try {
			const bytes = fs.readFileSync(uri.fsPath, "utf8");
			parseKeyframesFromText(bytes, result);
		} catch {
			// unreadable file — skip
		}
	}

	return result;
}

/**
 * Parse all @keyframes blocks from a CSS/HTML text string.
 * Handles: @keyframes name { }, @-webkit-keyframes name { }
 * Also handles <style> blocks inside HTML/Vue/Astro.
 */
function parseKeyframesFromText(
	text: string,
	out: Map<string, ParsedKeyframe>,
) {
	// Extract style block contents for HTML files
	const styleBlockRe = /<style(\s[^>]*)?>[\s\S]*?<\/style>/gim;
	const openTagRe = /^<style(\s[^>]*)?>/i;
	let sm: RegExpExecArray | null;
	styleBlockRe.lastIndex = 0;
	sm = styleBlockRe.exec(text);
	const cssChunks: string[] = [];

	if (sm) {
		// HTML-like file — extract style blocks
		while (sm !== null) {
			const openM = openTagRe.exec(sm[0]);
			if (openM) {
				const content = sm[0].slice(
					openM[0].length,
					sm[0].length - "</style>".length,
				);
				cssChunks.push(content);
			}
			sm = styleBlockRe.exec(text);
		}
	} else {
		// Pure CSS file
		cssChunks.push(text);
	}

	for (const css of cssChunks) {
		extractKeyframesFromCSS(css, out);
	}
}

function extractKeyframesFromCSS(
	css: string,
	out: Map<string, ParsedKeyframe>,
) {
	// Match @keyframes or @-webkit-keyframes
	const kfRe = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/gi;
	let m: RegExpExecArray | null;
	kfRe.lastIndex = 0;
	m = kfRe.exec(css);
	while (m !== null) {
		const name = m[1];
		const blockStart = m.index + m[0].length - 1; // points to opening {
		const blockContent = extractBlock(css, blockStart);
		if (blockContent !== null) {
			const stops = parseKeyframeStops(blockContent);
			// Don't overwrite — first definition (current file) wins
			if (!out.has(name.toLowerCase())) {
				out.set(name.toLowerCase(), { name, stops });
			}
		}
		m = kfRe.exec(css);
	}
}

/**
 * Given text and the index of an opening `{`, returns the content inside
 * the matching `}` (not including braces). Returns null if unmatched.
 */
function extractBlock(text: string, openBraceIdx: number): string | null {
	let depth = 0;
	let start = -1;
	for (let i = openBraceIdx; i < text.length; i++) {
		if (text[i] === "{") {
			depth++;
			if (depth === 1) {
				start = i + 1;
			}
		} else if (text[i] === "}") {
			depth--;
			if (depth === 0) {
				return text.slice(start, i);
			}
		}
	}
	return null;
}

/**
 * Parse keyframe stops from the content inside @keyframes { ... }
 * e.g.:
 *   0%   { transform: translateX(0); opacity: 1; }
 *   100% { transform: translateX(200px); opacity: 0; }
 */
function parseKeyframeStops(blockContent: string): KeyframeStop[] {
	const stops: KeyframeStop[] = [];
	// Match: 0%, from, to, 50% etc. followed by { ... }
	const stopRe = /((?:(?:\d+(?:\.\d+)?%|from|to)\s*,?\s*)+)\s*\{([^}]*)\}/gi;
	let m: RegExpExecArray | null;
	stopRe.lastIndex = 0;
	m = stopRe.exec(blockContent);
	while (m !== null) {
		const selectors = m[1].trim().split(/\s*,\s*/);
		const propsText = m[2];
		const props = parseProps(propsText);

		for (const sel of selectors) {
			const s = sel.trim().toLowerCase();
			let offset = 0;
			if (s === "from") {
				offset = 0;
			} else if (s === "to") {
				offset = 1;
			} else {
				offset = Number.parseFloat(s) / 100;
			}
			stops.push({ offset, props });
		}
		m = stopRe.exec(blockContent);
	}
	stops.sort((a, b) => a.offset - b.offset);
	return stops;
}

function parseProps(propsText: string): Record<string, string> {
	const result: Record<string, string> = {};
	const propRe = /([\w-]+)\s*:\s*([^;]+)/g;
	let m: RegExpExecArray | null;
	propRe.lastIndex = 0;
	m = propRe.exec(propsText);
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
	// Cache key includes the keyframe content so it regenerates if keyframes change
	const cacheKey = animName + JSON.stringify(kf.stops);

	if (decorationTypeCache.has(cacheKey)) {
		return decorationTypeCache.get(cacheKey)!;
	}

	const svgUri = getOrWriteAnimSVG(cacheKey, kf);
	const dt = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: svgUri,
			margin: "0 0 0 6px",
			width: "64px",
			height: "24px",
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	decorationTypeCache.set(cacheKey, dt);
	return dt;
}

function getOrWriteAnimSVG(cacheKey: string, kf: ParsedKeyframe): vscode.Uri {
	if (!svgFileCache.has(cacheKey)) {
		const safeName = cacheKey.replace(/[^a-z0-9\-_.]/gi, "_").substring(0, 80);
		const filePath = path.join(svgCacheDir, `anim_${safeName}.svg`);
		const svgContent = generateAnimatedSVG(kf);
		fs.writeFileSync(filePath, svgContent, "utf8");
		svgFileCache.set(cacheKey, filePath);
	}
	return vscode.Uri.file(svgFileCache.get(cacheKey)!);
}

// ─── Animated SVG generation ──────────────────────────────────────────────────

/**
 * Generates an animated SVG showing a looping box/dot that plays the keyframe.
 *
 * Strategy:
 *  - If keyframes contain `transform: translateX(...)` → animate a dot sliding left/right
 *  - If keyframes contain `opacity` → animate opacity of a box
 *  - If keyframes contain `transform: translateY(...)` → animate a dot bouncing up/down
 *  - If keyframes contain `transform: scale(...)` → animate a box scaling
 *  - Fallback → animate a dot fading in/out
 *
 * The SVG uses SMIL animation (<animate>, <animateTransform>) which works in VS Code's
 * decoration renderer (Electron/Chromium) — CSS animations are stripped.
 */
function generateAnimatedSVG(kf: ParsedKeyframe): string {
	const W = 64;
	const H = 24;
	const DOT = 8; // dot/box size
	const DURATION = "1.6s";

	const stops = kf.stops;
	if (stops.length === 0) {
		return fallbackSVG(W, H, DOT, DURATION);
	}

	// Detect animation type from keyframe properties
	const firstStop = stops[0];
	const allProps = stops.flatMap((s) => Object.keys(s.props));

	const hasTranslateX = stops.some((s) =>
		/translateX\s*\(/i.test(s.props["transform"] ?? ""),
	);
	const hasTranslateY = stops.some((s) =>
		/translateY\s*\(/i.test(s.props["transform"] ?? ""),
	);
	const hasScale = stops.some((s) =>
		/scale\s*\(/i.test(s.props["transform"] ?? ""),
	);
	const hasOpacity = allProps.includes("opacity");
	const hasRotate = stops.some((s) =>
		/rotate\s*\(/i.test(s.props["transform"] ?? ""),
	);

	if (hasTranslateX) {
		return translateXSVG(W, H, DOT, DURATION, stops);
	}
	if (hasTranslateY) {
		return translateYSVG(W, H, DOT, DURATION, stops);
	}
	if (hasRotate) {
		return rotateSVG(W, H, DOT, DURATION, stops);
	}
	if (hasScale) {
		return scaleSVG(W, H, DOT, DURATION, stops);
	}
	if (hasOpacity) {
		return opacitySVG(W, H, DOT, DURATION, stops);
	}
	return fallbackSVG(W, H, DOT, DURATION);
}

// ── Parse helpers ──────────────────────────────────────────────────────────────

function parsePx(val: string): number {
	const m = val.match(/([-\d.]+)\s*px/i);
	return m ? Number.parseFloat(m[1]) : 0;
}

function parsePercent(val: string): number {
	const m = val.match(/([-\d.]+)\s*%/);
	return m ? Number.parseFloat(m[1]) / 100 : 0;
}

function parseOpacity(val: string): number {
	return Math.min(1, Math.max(0, Number.parseFloat(val) || 0));
}

function parseDeg(val: string): number {
	const m = val.match(/([-\d.]+)\s*deg/i);
	return m ? Number.parseFloat(m[1]) : 0;
}

function parseScale(val: string): number {
	const m = val.match(/scale\s*\(\s*([-\d.]+)/i);
	return m ? Number.parseFloat(m[1]) : 1;
}

// ── Key times / values helpers ─────────────────────────────────────────────────

function keyTimes(stops: KeyframeStop[]): string {
	return stops.map((s) => s.offset.toFixed(3)).join(";");
}

// ── SVG variants ───────────────────────────────────────────────────────────────

function svgWrapper(W: number, H: number, inner: string): string {
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="5" ry="5"
        fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  ${inner}
</svg>`;
}

function translateXSVG(
	W: number,
	H: number,
	DOT: number,
	dur: string,
	stops: KeyframeStop[],
): string {
	// Map translateX values to the available track width
	const rawVals = stops.map((s) => {
		const t = s.props["transform"] ?? "";
		const m = t.match(/translateX\s*\(\s*([-\d.]+(?:px|%))\s*\)/i);
		if (!m) {
			return 0;
		}
		return m[1].endsWith("%")
			? parsePercent(m[1]) * (W - DOT * 2)
			: parsePx(m[1]);
	});
	const minV = Math.min(...rawVals);
	const maxV = Math.max(...rawVals);
	const range = maxV - minV || 1;
	const trackW = W - DOT * 2 - 4;
	const cx = DOT / 2 + 2;
	const cy = H / 2;

	const xValues = rawVals
		.map((v) => (cx + ((v - minV) / range) * trackW).toFixed(1))
		.join(";");

	// Track line
	const trackX1 = cx;
	const trackX2 = cx + trackW;

	return svgWrapper(
		W,
		H,
		`
  <line x1="${trackX1}" y1="${cy}" x2="${trackX2}" y2="${cy}"
        stroke="#2d3244" stroke-width="2" stroke-linecap="round"/>
  <circle r="${DOT / 2}" cy="${cy}" fill="#58b4f8" cx="${cx}">
    <animate attributeName="cx" values="${xValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
  </circle>`,
	);
}

function translateYSVG(
	W: number,
	H: number,
	DOT: number,
	dur: string,
	stops: KeyframeStop[],
): string {
	const rawVals = stops.map((s) => {
		const t = s.props["transform"] ?? "";
		const m = t.match(/translateY\s*\(\s*([-\d.]+(?:px|%))\s*\)/i);
		if (!m) {
			return 0;
		}
		return m[1].endsWith("%") ? parsePercent(m[1]) * H : parsePx(m[1]);
	});
	const minV = Math.min(...rawVals);
	const maxV = Math.max(...rawVals);
	const range = maxV - minV || 1;
	const trackH = H - DOT - 4;
	const cx = W / 2;
	const cy0 = DOT / 2 + 2;

	const yValues = rawVals
		.map((v) => (cy0 + ((v - minV) / range) * trackH).toFixed(1))
		.join(";");

	return svgWrapper(
		W,
		H,
		`
  <circle r="${DOT / 2}" cx="${cx}" fill="#58b4f8" cy="${cy0}">
    <animate attributeName="cy" values="${yValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
  </circle>`,
	);
}

function rotateSVG(
	W: number,
	H: number,
	DOT: number,
	dur: string,
	stops: KeyframeStop[],
): string {
	const cx = W / 2;
	const cy = H / 2;
	const degVals = stops.map((s) => {
		const t = s.props["transform"] ?? "";
		const m = t.match(/rotate\s*\(\s*([-\d.]+)/i);
		return m ? Number.parseFloat(m[1]) : 0;
	});
	const rotValues = degVals.join(";");

	return svgWrapper(
		W,
		H,
		`
  <g>
    <animateTransform attributeName="transform" type="rotate"
      values="${degVals.map((d) => `${d} ${cx} ${cy}`).join(";")}"
      keyTimes="${keyTimes(stops)}"
      dur="${dur}" repeatCount="indefinite" calcMode="spline"
      keySplines="${stops
				.slice(0, -1)
				.map(() => "0.4 0 0.2 1")
				.join(";")}"/>
    <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}"
          rx="2" fill="#58b4f8"/>
    <circle cx="${cx + DOT / 2 - 1}" cy="${cy - DOT / 2 + 1}" r="1.5" fill="#a78bfa"/>
  </g>`,
	);
}

function scaleSVG(
	W: number,
	H: number,
	DOT: number,
	dur: string,
	stops: KeyframeStop[],
): string {
	const cx = W / 2;
	const cy = H / 2;
	const scaleVals = stops.map((s) => parseScale(s.props["transform"] ?? "1"));
	const maxS = Math.max(...scaleVals);
	// Normalise so the box fits within H
	const baseSize = DOT;
	const norm = (v: number) => ((v / maxS) * baseSize).toFixed(2);

	const wValues = scaleVals.map((v) => norm(v)).join(";");
	const xValues = scaleVals
		.map((v) => (cx - Number.parseFloat(norm(v)) / 2).toFixed(2))
		.join(";");
	const yValues = scaleVals
		.map((v) => (cy - Number.parseFloat(norm(v)) / 2).toFixed(2))
		.join(";");

	return svgWrapper(
		W,
		H,
		`
  <rect rx="2" fill="#58b4f8" x="${cx - baseSize / 2}" y="${cy - baseSize / 2}"
        width="${baseSize}" height="${baseSize}">
    <animate attributeName="width" values="${wValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
    <animate attributeName="height" values="${wValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
    <animate attributeName="x" values="${xValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
    <animate attributeName="y" values="${yValues}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
  </rect>`,
	);
}

function opacitySVG(
	W: number,
	H: number,
	DOT: number,
	dur: string,
	stops: KeyframeStop[],
): string {
	const cx = W / 2;
	const cy = H / 2;
	const opacityVals = stops
		.map((s) => parseOpacity(s.props["opacity"] ?? "1").toFixed(3))
		.join(";");

	return svgWrapper(
		W,
		H,
		`
  <rect x="${cx - DOT / 2}" y="${cy - DOT / 2}" width="${DOT}" height="${DOT}"
        rx="2" fill="#58b4f8">
    <animate attributeName="opacity" values="${opacityVals}" keyTimes="${keyTimes(stops)}"
             dur="${dur}" repeatCount="indefinite" calcMode="spline"
             keySplines="${stops
								.slice(0, -1)
								.map(() => "0.4 0 0.2 1")
								.join(";")}"/>
  </rect>`,
	);
}

function fallbackSVG(W: number, H: number, DOT: number, dur: string): string {
	const cx = W / 2;
	const cy = H / 2;
	return svgWrapper(
		W,
		H,
		`
  <circle cx="${cx}" cy="${cy}" r="${DOT / 2}" fill="#58b4f8">
    <animate attributeName="opacity" values="1;0.15;1" keyTimes="0;0.5;1"
             dur="${dur}" repeatCount="indefinite"/>
  </circle>`,
	);
}
