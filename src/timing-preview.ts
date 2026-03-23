import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Regex ────────────────────────────────────────────────────────────────────
//
// The core problem with a naive timing-function regex:
//
//   "linear"      → matches inside "linear-gradient(...)"
//   "ease"        → matches inside "ease-in", "ease-out", "ease-in-out"
//   "ease-in"     → matches inside "ease-in-out"
//
// Fix strategy:
//   1. Use a PROPERTY-ANCHORED pattern: only match timing tokens that appear
//      after a known CSS property that accepts timing functions:
//        transition, animation, transition-timing-function, animation-timing-function
//   2. For standalone keywords (linear, ease, ease-in, ease-out, ease-in-out):
//      require a word boundary on BOTH sides so "linear" never fires inside
//      "linear-gradient" and "ease" never fires inside "ease-in-out".
//   3. Match "ease-in-out" before "ease-in" and "ease-out" (longest match first).
//
// We do a two-pass approach:
//   Pass 1 — find the VALUE portion of relevant CSS properties on each line.
//   Pass 2 — within that value substring, find timing tokens.
//
// This is the only reliable approach without a full CSS parser.

// Properties whose values may contain timing functions
const TIMING_PROP_RE =
	/(?:^|[{;,])\s*(?:transition|animation|transition-timing-function|animation-timing-function)\s*:/i;

// Matches a timing function token.
// Order matters: longest keyword alternatives must come before shorter ones.
// Word boundaries (\b) prevent matching inside other tokens.
// cubic-bezier / steps use parentheses as natural delimiters.
const TIMING_TOKEN_RE =
	/(cubic-bezier\s*\([^)]*\)|steps\s*\([^)]*\)|\bease-in-out\b|\bease-in\b|\bease-out\b|\bease\b|\blinear\b|\bstep-start\b|\bstep-end\b)/g;

// Additional guard: after we find a token, make sure it is NOT preceded by
// a CSS function name that would make it a false positive.
// e.g. "linear" in "linear-gradient" — the regex already blocks that with \b
// because "linear-gradient" has a hyphen right after "linear" which is NOT
// a word boundary... wait, hyphens ARE word boundary chars in JS \b.
// So \blinear\b WILL match "linear" in "linear-gradient" because the hyphen
// creates a boundary. We need an explicit negative lookahead.
//
// Revised TIMING_TOKEN_RE with negative lookahead for hyphen:
const SAFE_TIMING_TOKEN_RE =
	/(cubic-bezier\s*\([^)]*\)|steps\s*\([^)]*\)|\bease-in-out\b|\bease-in\b|\bease-out\b|\bease(?!-)(?=[\s,;)\n]|$)|\blinear(?!-)(?=[\s,;)\n]|$)|\bstep-start\b|\bstep-end\b)/g;

// ─── Module state ─────────────────────────────────────────────────────────────

let svgCacheDir = "";
const svgFileCache = new Map<string, string>();
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initTimingPreview(context: vscode.ExtensionContext) {
	svgCacheDir = path.join(context.globalStorageUri.fsPath, "timing-svgs");
	if (!fs.existsSync(svgCacheDir)) {
		fs.mkdirSync(svgCacheDir, { recursive: true });
	}
	console.log(`[timing-preview] SVG cache dir: ${svgCacheDir}`);
}

// ─── Decoration type per unique timing string ─────────────────────────────────

function getDecorationTypeForTiming(
	timing: string,
): vscode.TextEditorDecorationType {
	if (decorationTypeCache.has(timing)) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return decorationTypeCache.get(timing)!;
	}
	const svgUri = getOrWriteSVG(timing);
	const dt = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: svgUri,
			margin: "0 0 0 6px",
			width: "48px",
			height: "24px",
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	decorationTypeCache.set(timing, dt);
	return dt;
}

function getOrWriteSVG(timing: string): vscode.Uri {
	if (!svgFileCache.has(timing)) {
		const safeName = timing.replace(/[^a-z0-9\-_.]/gi, "_").substring(0, 80);
		const filePath = path.join(svgCacheDir, `${safeName}.svg`);
		fs.writeFileSync(filePath, generateSVGContent(timing), "utf8");
		svgFileCache.set(timing, filePath);
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	return vscode.Uri.file(svgFileCache.get(timing)!);
}

// ─── Main update function ─────────────────────────────────────────────────────

export function updateTimingFunctionPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor || !svgCacheDir) {
			if (!svgCacheDir) {
				console.warn("[timing-preview] initTimingPreview() not called.");
			}
			return;
		}

		const doc = editor.document;
		const text = doc.getText();

		// timing string → ranges
		const timingRanges = new Map<string, vscode.Range[]>();
		const seenOffsets = new Set<number>();

		function record(absStart: number, len: number, timing: string) {
			if (seenOffsets.has(absStart)) {
				return;
			}
			seenOffsets.add(absStart);
			const range = new vscode.Range(
				doc.positionAt(absStart),
				doc.positionAt(absStart + len),
			);
			if (!timingRanges.has(timing)) {
				timingRanges.set(timing, []);
			}
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			timingRanges.get(timing)!.push(range);
		}

		// ── Extract CSS source regions ────────────────────────────────────────
		// For HTML/Vue/Astro: only scan inside <style> blocks.
		// For CSS/SCSS/LESS/SASS: scan the whole file.
		const lang = doc.languageId;
		const isPureCss = ["css", "scss", "less", "sass"].includes(lang);

		if (isPureCss) {
			// Scan every line but only within property values
			scanCssText(text, 0, doc, record);
		} else {
			// Extract <style> blocks and scan their content
			const styleBlockRe = /<style(\s[^>]*)?>[\s\S]*?<\/style>/gim;
			const openTagRe = /^<style(\s[^>]*)?>/i;
			let sm: RegExpExecArray | null;
			styleBlockRe.lastIndex = 0;
			sm = styleBlockRe.exec(text);
			while (sm !== null) {
				const openTagM = openTagRe.exec(sm[0]);
				if (openTagM) {
					const contentStart = sm.index + openTagM[0].length;
					const contentEnd = sm.index + sm[0].length - "</style>".length;
					const blockText = text.slice(contentStart, contentEnd);
					scanCssText(blockText, contentStart, doc, record);
				}
				sm = styleBlockRe.exec(text);
			}
		}

		// ── Clear then re-apply decorations ───────────────────────────────────
		for (const dt of decorationTypeCache.values()) {
			editor.setDecorations(dt, []);
		}
		let total = 0;
		for (const [timing, ranges] of timingRanges) {
			editor.setDecorations(getDecorationTypeForTiming(timing), ranges);
			total += ranges.length;
		}
		console.log(
			`[timing-preview] ${total} decorations across ${timingRanges.size} unique timing functions in ${doc.fileName}`,
		);
	} catch (err) {
		console.error("[timing-preview] ERROR:", err);
	}
}

/**
 * Scans CSS text for timing function tokens, but ONLY within the value
 * portion of relevant CSS properties (transition, animation, *-timing-function).
 *
 * @param cssText   The CSS source string to scan
 * @param baseOffset The absolute character offset of cssText within the full document
 * @param doc       The VS Code document (for positionAt)
 * @param record    Callback to register a found timing token
 */
function scanCssText(
	cssText: string,
	baseOffset: number,
	doc: vscode.TextDocument,
	record: (absStart: number, len: number, timing: string) => void,
) {
	// Split into lines so we can detect property declarations
	const lines = cssText.split("\n");
	let lineOffset = 0;

	for (const lineText of lines) {
		// Only process lines that contain a relevant CSS property declaration
		if (TIMING_PROP_RE.test(lineText)) {
			// Find the value portion: everything after the first ':'
			const colonIdx = lineText.indexOf(":");
			if (colonIdx !== -1) {
				const valueStart = colonIdx + 1;
				const valueText = lineText.slice(valueStart);

				// Find all timing tokens within the value
				const re = new RegExp(SAFE_TIMING_TOKEN_RE.source, "g");
				let m: RegExpExecArray | null;
				re.lastIndex = 0;
				m = re.exec(valueText);
				while (m !== null) {
					const absStart = baseOffset + lineOffset + valueStart + m.index;
					record(absStart, m[0].length, m[0].trim());
					m = re.exec(valueText);
				}
			}
		}
		// +1 for the '\n' character that was consumed by split
		lineOffset += lineText.length + 1;
	}
}

// ─── SVG generation ───────────────────────────────────────────────────────────

function generateSVGContent(timing: string): string {
	const W = 48;
	const H = 24;
	const bezierMatch = timing.match(/cubic-bezier\s*\(([^)]+)\)/);
	let pathD: string;

	if (bezierMatch) {
		const [x1, y1, x2, y2] = bezierMatch[1]
			.split(",")
			.map((s) => Number.parseFloat(s.trim()));
		pathD = cubicBezierPathD(x1, y1, x2, y2, W, H);
	} else {
		const stdMap: Record<string, [number, number, number, number]> = {
			linear: [0, 0, 1, 1],
			ease: [0.25, 0.1, 0.25, 1],
			"ease-in": [0.42, 0, 1, 1],
			"ease-out": [0, 0, 0.58, 1],
			"ease-in-out": [0.42, 0, 0.58, 1],
		};
		const std = timing.trim();
		if (stdMap[std]) {
			const [x1, y1, x2, y2] = stdMap[std];
			pathD = cubicBezierPathD(x1, y1, x2, y2, W, H);
		} else {
			// step-start / step-end / steps(n, …)
			pathD = `M 0,${H} L 0,${H / 2} L ${W / 2},${H / 2} L ${W / 2},0 L ${W},0`;
		}
	}

	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="5" ry="5"
        fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  <path d="${pathD}" fill="none" stroke="#58b4f8"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function cubicBezierPathD(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	W: number,
	H: number,
): string {
	const f = (n: number) => n.toFixed(2);
	return `M 0,${H} C ${f(x1 * W)},${f(H - y1 * H)} ${f(x2 * W)},${f(H - y2 * H)} ${W},0`;
}
