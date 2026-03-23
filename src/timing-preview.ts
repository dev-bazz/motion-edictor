import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Regex to match timing functions in CSS/SCSS
const TIMING_FUNCTION_REGEX =
	/(cubic-bezier\([^\)]*\)|linear|ease-in-out|ease-in|ease-out|ease|step-start|step-end|steps\([^\)]*\))/g;

// Cache: timing string → absolute svg file path on disk
const svgFileCache = new Map<string, string>();

// Directory where we write SVG files (set during init)
let svgCacheDir = "";

/**
 * Must be called once from extension.ts activate(), passing the ExtensionContext.
 * Creates the SVG cache directory inside the extension's global storage path.
 *
 * Example in extension.ts:
 *   import { initTimingPreview, updateTimingFunctionPreviews } from './timingPreview';
 *   export function activate(context: vscode.ExtensionContext) {
 *     initTimingPreview(context);
 *     // ... register listeners that call updateTimingFunctionPreviews(editor)
 *   }
 */
export function initTimingPreview(context: vscode.ExtensionContext) {
	svgCacheDir = path.join(context.globalStorageUri.fsPath, "timing-svgs");
	if (!fs.existsSync(svgCacheDir)) {
		fs.mkdirSync(svgCacheDir, { recursive: true });
	}
	console.log(`[timing-preview] SVG cache dir: ${svgCacheDir}`);
}

/**
 * VS Code requires ONE TextEditorDecorationType per unique icon.
 * We cache these so we don't leak decoration types on every update.
 */
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

function getDecorationTypeForTiming(
	timing: string,
): vscode.TextEditorDecorationType {
	if (decorationTypeCache.has(timing)) {
		return decorationTypeCache.get(timing)!;
	}
	const svgUri = getOrWriteSVG(timing);
	const decType = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: svgUri, // Must be a real file URI — data: URIs don't work
			margin: "0 0 0 6px",
			width: "48px",
			height: "24px",
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	decorationTypeCache.set(timing, decType);
	return decType;
}

/**
 * Returns a Uri.file() pointing to a cached on-disk SVG for the timing string.
 * Writes the file the first time it's needed.
 */
function getOrWriteSVG(timing: string): vscode.Uri {
	if (!svgFileCache.has(timing)) {
		const safeName = timing.replace(/[^a-z0-9\-_.]/gi, "_").substring(0, 80);
		const filePath = path.join(svgCacheDir, `${safeName}.svg`);
		const svgContent = generateSVGContent(timing);
		fs.writeFileSync(filePath, svgContent, "utf8");
		svgFileCache.set(timing, filePath);
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	return vscode.Uri.file(svgFileCache.get(timing)!);
}

/**
 * Scans the document for timing functions and applies inline SVG previews.
 *
 * Key design: each unique timing string gets its own TextEditorDecorationType
 * (required by VS Code to render different icons at different ranges).
 * All decoration types are cleared first, then re-applied with current ranges.
 */
export function updateTimingFunctionPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor) {
			return;
		}
		if (!svgCacheDir) {
			console.warn(
				"[timing-preview] initTimingPreview() was not called — aborting.",
			);
			return;
		}

		const doc = editor.document;
		const text = doc.getText();

		// timing string → ranges found in this pass
		const timingRanges = new Map<string, vscode.Range[]>();
		// absolute char offset → already handled (dedup style blocks + line scan)
		const seenOffsets = new Set<number>();

		function record(absoluteStart: number, matchLen: number, timing: string) {
			if (seenOffsets.has(absoluteStart)) {
				return;
			}
			seenOffsets.add(absoluteStart);
			const range = new vscode.Range(
				doc.positionAt(absoluteStart),
				doc.positionAt(absoluteStart + matchLen),
			);
			if (!timingRanges.has(timing)) {
				timingRanges.set(timing, []);
			}
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			timingRanges.get(timing)!.push(range);
		}

		// ── Step 1: <style> blocks (HTML / Vue / Astro / Svelte) ──────────────
		// Regex captures the full <style ...>...</style> block as one match.
		// We then compute the content start offset precisely from the opening tag length.
		const styleBlockRe = /<style(\s[^>]*)?>[\s\S]*?<\/style>/gim;
		const styleOpenTagRe = /^<style(\s[^>]*)?>/i;
		let sm: RegExpExecArray | null;
		styleBlockRe.lastIndex = 0;
		sm = styleBlockRe.exec(text);
		while (sm !== null) {
			const openTagM = styleOpenTagRe.exec(sm[0]);
			if (openTagM) {
				const contentStart = sm.index + openTagM[0].length;
				const contentEnd = sm.index + sm[0].length - "</style>".length;
				const content = text.slice(contentStart, contentEnd);
				const re = new RegExp(TIMING_FUNCTION_REGEX.source, "g");
				let m: RegExpExecArray | null;
				re.lastIndex = 0;
				m = re.exec(content);
				while (m !== null) {
					record(contentStart + m.index, m[0].length, m[0]);
					m = re.exec(content);
				}
			}
			sm = styleBlockRe.exec(text);
		}

		// ── Step 2: All lines (CSS / SCSS / LESS / inline styles) ─────────────
		for (let line = 0; line < doc.lineCount; line++) {
			const lineText = doc.lineAt(line).text;
			const lineOffset = doc.offsetAt(new vscode.Position(line, 0));
			const re = new RegExp(TIMING_FUNCTION_REGEX.source, "g");
			let m: RegExpExecArray | null;
			re.lastIndex = 0;
			m = re.exec(lineText);
			while (m !== null) {
				record(lineOffset + m.index, m[0].length, m[0]);
				m = re.exec(lineText);
			}
		}

		// ── Clear all known decoration types (reset before re-applying) ────────
		for (const decType of decorationTypeCache.values()) {
			editor.setDecorations(decType, []);
		}

		// ── Apply each unique timing's decoration type with its ranges ─────────
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

// ── SVG generation ────────────────────────────────────────────────────────────

function generateSVGContent(timing: string): string {
	const W = 48;
	const H = 24;

	const bezierMatch = timing.match(/cubic-bezier\(([^)]+)\)/);
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
			// step-start / step-end / steps(n, …) — rough staircase
			pathD = `M 0,${H} L 0,${H / 2} L ${W / 2},${H / 2} L ${W / 2},0 L ${W},0`;
		}
	}

	// Plain SVG with no embedded CSS — decoration renderers strip style tags.
	// Using dark-theme colours that look good on both dark and light VS Code themes.
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="5" ry="5" fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
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
	const fmt = (n: number) => n.toFixed(2);
	return (
		`M 0,${H} ` +
		`C ${fmt(x1 * W)},${fmt(H - y1 * H)} ` +
		`${fmt(x2 * W)},${fmt(H - y2 * H)} ` +
		`${W},0`
	);
}
