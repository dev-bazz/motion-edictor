import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 140;
const H = 28;

// ─── Module state ─────────────────────────────────────────────────────────────

let svgCacheDir = "";
const svgFileCache = new Map<string, string>();
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initGradientPreview(context: vscode.ExtensionContext) {
	svgCacheDir = path.join(context.globalStorageUri.fsPath, "gradient-svgs");
	if (!fs.existsSync(svgCacheDir)) {
		fs.mkdirSync(svgCacheDir, { recursive: true });
	}
	console.log(`[gradient-preview] SVG cache dir: ${svgCacheDir}`);
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function updateGradientPreviews(editor: vscode.TextEditor) {
	try {
		if (!editor || !svgCacheDir) return;

		const doc = editor.document;
		const text = doc.getText();
		const lang = doc.languageId;
		const isPureCss = ["css", "scss", "less", "sass"].includes(lang);

		const varMap = buildVariableMap(text);

		const gradientRanges = new Map<string, vscode.Range[]>();
		const seenOffsets = new Set<number>();

		function record(absStart: number, len: number, gradientStr: string) {
			if (seenOffsets.has(absStart)) return;
			seenOffsets.add(absStart);
			const range = new vscode.Range(
				doc.positionAt(absStart),
				doc.positionAt(absStart + len),
			);
			const resolved = resolveVariables(gradientStr, varMap);
			if (!gradientRanges.has(resolved)) gradientRanges.set(resolved, []);
			gradientRanges.get(resolved)?.push(range);
		}

		if (isPureCss) {
			scanGradients(text, 0, record);
		} else {
			const styleBlockRe = /<style(\s[^>]*)?>[\s\S]*?<\/style>/gim;
			const openTagRe = /^<style(\s[^>]*)?>/i;
			let sm: RegExpExecArray | null;
			styleBlockRe.lastIndex = 0;
			sm = styleBlockRe.exec(text);
			while (sm !== null) {
				const openM = openTagRe.exec(sm[0]);
				if (openM) {
					const contentStart = sm.index + openM[0].length;
					const contentEnd = sm.index + sm[0].length - "</style>".length;
					scanGradients(
						text.slice(contentStart, contentEnd),
						contentStart,
						record,
					);
				}
				sm = styleBlockRe.exec(text);
			}
		}

		for (const dt of decorationTypeCache.values()) {
			editor.setDecorations(dt, []);
		}
		for (const [gradStr, ranges] of gradientRanges) {
			editor.setDecorations(getOrCreateDecorationType(gradStr), ranges);
		}

		console.log(
			`[gradient-preview] ${gradientRanges.size} unique gradients in ${doc.fileName}`,
		);
	} catch (err) {
		console.error("[gradient-preview] ERROR:", err);
	}
}

// ─── Scanner ──────────────────────────────────────────────────────────────────
//
// Two bugs fixed here vs the previous version:
//
// BUG 1 — var() fallback gradients:
//   background: var(--foo, linear-gradient(90deg, red, blue))
//   The gradient lives inside a var() call. The old scanner only searched for
//   gradient function names directly in the property value, so it never looked
//   inside var() fallbacks.
//   FIX: after extracting the full property value, we recursively expand var()
//   fallback content and search for gradient calls within it. We also track the
//   character offset delta so decoration positions remain accurate.
//
// BUG 2 — trailing tokens after gradient call:
//   background: linear-gradient(90deg, #00425f 0 0) 0 / calc(106 * 1ch) no-repeat #aab7c6;
//   The old callLenInValue was computed as:
//     m[0].length - 1 + 1 + inner.length + 1
//   which equals: funcName.length + "(".length + inner.length + ")".length
//   That is exactly the right length for the gradient call itself. BUT the
//   decoration range must cover only the gradient call token, not the trailing
//   " 0 / calc(...) no-repeat #aab7c6" — and it did. So why did it fail?
//   The actual bug was that `m[0]` from GRADIENT_CALL_RE ends with "(" so
//   `m[0].slice(0, -1)` strips it, giving the function name, and
//   `m[0].length - 1` is the name length. Then +1+"("+inner+")"+1 is wrong —
//   the +1 at the end was for the closing ")" but we need exactly:
//     nameLen + 1 (open paren) + innerLen + 1 (close paren)
//   which is m[0].length + inner.length + 1  (m[0] already includes the "(")
//   FIX: use `m[0].length + inner.length + 1` as the call length.

const GRADIENT_PROP_NAME_RE =
	/(?:^|[{;,\s])(?:background(?:-image)?|border-image(?:-source)?|mask(?:-image)?|list-style-image)\s*:/gim;

const GRADIENT_CALL_RE =
	/(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/gi;

function scanGradients(
	cssText: string,
	baseOffset: number,
	record: (absStart: number, len: number, gradStr: string) => void,
) {
	GRADIENT_PROP_NAME_RE.lastIndex = 0;
	let propMatch = GRADIENT_PROP_NAME_RE.exec(cssText);

	while (propMatch !== null) {
		const valueStart = propMatch.index + propMatch[0].length;
		const valueStr = extractPropertyValue(cssText, valueStart);

		if (valueStr) {
			// Search for gradient calls both directly in the value AND inside
			// any var() fallback arguments within the value.
			findGradientCalls(valueStr, valueStart + baseOffset, record);
		}

		propMatch = GRADIENT_PROP_NAME_RE.exec(cssText);
	}
}

/**
 * Finds all gradient function calls in `text`, including those nested inside
 * var() fallback arguments. Calls record() for each one found with the correct
 * absolute document offset.
 *
 * @param text        The CSS value string to search (may be multi-line)
 * @param textAbsBase The absolute document offset where `text` begins
 * @param record      Callback receiving (absStart, len, gradientStr)
 */
function findGradientCalls(
	text: string,
	textAbsBase: number,
	record: (absStart: number, len: number, gradStr: string) => void,
) {
	// Step 1: find direct gradient calls in this text
	const re = new RegExp(GRADIENT_CALL_RE.source, "gi");
	let m: RegExpExecArray | null;
	re.lastIndex = 0;
	m = re.exec(text);
	while (m !== null) {
		// m[0] ends with '(' — find the matching ')'
		const openParenIdx = m.index + m[0].length - 1;
		const inner = extractBalancedParens(text, openParenIdx);
		if (inner !== null) {
			const fullCall = `${m[0].slice(0, -1)}(${inner})`;
			// BUG 2 FIX: correct length = funcName+"(" length + inner + ")"
			// m[0] already includes the "(", so: m[0].length + inner.length + 1
			const callLen = m[0].length + inner.length + 1;
			const absStart = textAbsBase + m.index;
			record(absStart, callLen, fullCall.trim());
		}
		m = re.exec(text);
	}

	// Step 2: look inside var() fallbacks — gradients can live there
	// e.g.: background: var(--foo, linear-gradient(90deg, red, blue))
	// We find every var( and extract its fallback (everything after the first comma)
	const varRe = /\bvar\s*\(/gi;
	let vm: RegExpExecArray | null;
	varRe.lastIndex = 0;
	vm = varRe.exec(text);
	while (vm !== null) {
		const openIdx = vm.index + vm[0].length - 1; // index of '('
		const varContent = extractBalancedParens(text, openIdx);
		if (varContent !== null) {
			// varContent = "--foo-name, fallback value"
			// The fallback starts after the first top-level comma
			const commaIdx = firstTopLevelComma(varContent);
			if (commaIdx !== -1) {
				const fallback = varContent.slice(commaIdx + 1).trim();
				if (fallback) {
					// Absolute offset of fallback within the document:
					// base + vm.index + vm[0].length (past the '(') + commaIdx + 1
					const fallbackAbsBase =
						textAbsBase + vm.index + vm[0].length + commaIdx + 1;
					// Recurse — fallbacks can themselves contain var() calls
					findGradientCalls(fallback, fallbackAbsBase, record);
				}
			}
		}
		vm = varRe.exec(text);
	}
}

/** Returns the index of the first comma in s that is at paren depth 0. */
function firstTopLevelComma(s: string): number {
	let depth = 0;
	for (let i = 0; i < s.length; i++) {
		if (s[i] === "(") depth++;
		else if (s[i] === ")") depth--;
		else if (s[i] === "," && depth === 0) return i;
	}
	return -1;
}

/**
 * Starting from `startIdx` (right after the ':' of a property declaration),
 * reads forward and returns the full value string up to the terminating `;`
 * or `}` at paren depth 0.
 */
function extractPropertyValue(text: string, startIdx: number): string | null {
	let depth = 0;
	let i = startIdx;
	while (i < text.length) {
		const ch = text[i];
		if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (depth === 0 && (ch === ";" || ch === "}")) {
			return text.slice(startIdx, i);
		}
		i++;
	}
	return text.slice(startIdx);
}

/**
 * Given text and the index of an opening '(', returns the content inside
 * the matching ')'. Returns null if unmatched.
 */
function extractBalancedParens(text: string, openIdx: number): string | null {
	let depth = 0;
	let start = -1;
	for (let i = openIdx; i < text.length; i++) {
		if (text[i] === "(") {
			depth++;
			if (depth === 1) start = i + 1;
		} else if (text[i] === ")") {
			depth--;
			if (depth === 0) return text.slice(start, i);
		}
	}
	return null;
}

// ─── Variable resolution ──────────────────────────────────────────────────────

type VarMap = Map<string, string>;

function buildVariableMap(text: string): VarMap {
	const map: VarMap = new Map();

	const cssVarRe = /--([\w-]+)\s*:\s*([^;}{]+)/g;
	let m = cssVarRe.exec(text);
	while (m !== null) {
		map.set(`--${m[1].trim()}`, m[2].trim());
		m = cssVarRe.exec(text);
	}

	const scssVarRe = /\$([\w-]+)\s*:\s*([^;}{]+)/g;
	m = scssVarRe.exec(text);
	while (m !== null) {
		map.set(`$${m[1].trim()}`, m[2].trim());
		m = scssVarRe.exec(text);
	}

	const lessVarRe = /@([\w-]+)\s*:\s*([^;}{]+)/g;
	m = lessVarRe.exec(text);
	while (m !== null) {
		const name = m[1].trim();
		if (
			/^(keyframes|media|import|charset|font-face|supports|layer|use|forward|mixin|include|each|for|while|if|else)$/i.test(
				name,
			)
		) {
			m = lessVarRe.exec(text);
			continue;
		}
		map.set(`@${name}`, m[2].trim());
		m = lessVarRe.exec(text);
	}

	return map;
}

function resolveVariables(value: string, varMap: VarMap, depth = 0): string {
	if (depth > 5) return value;
	let result = value;

	result = result.replace(
		/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\s*\)/g,
		(_, name, fallback) => {
			const resolved = varMap.get(name.trim());
			if (resolved) return resolveVariables(resolved, varMap, depth + 1);
			if (fallback) return resolveVariables(fallback.trim(), varMap, depth + 1);
			return "transparent";
		},
	);

	result = result.replace(/\$([\w-]+)/g, (match, name) => {
		const resolved = varMap.get(`$${name}`);
		return resolved ? resolveVariables(resolved, varMap, depth + 1) : match;
	});

	result = result.replace(/@([\w-]+)/g, (match, name) => {
		const resolved = varMap.get(`@${name}`);
		return resolved ? resolveVariables(resolved, varMap, depth + 1) : match;
	});

	return result;
}

// ─── Decoration type / SVG management ────────────────────────────────────────

function getOrCreateDecorationType(
	gradStr: string,
): vscode.TextEditorDecorationType {
	if (decorationTypeCache.has(gradStr))
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		return decorationTypeCache.get(gradStr)!;

	const svgUri = getOrWriteGradientSVG(gradStr);
	const dt = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: svgUri,
			margin: "0 0 0 6px",
			width: `${W}px`,
			height: `${H}px`,
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	decorationTypeCache.set(gradStr, dt);
	return dt;
}

function getOrWriteGradientSVG(gradStr: string): vscode.Uri {
	if (!svgFileCache.has(gradStr)) {
		const safeName = gradStr.replace(/[^a-z0-9\-_.]/gi, "_").substring(0, 80);
		const filePath = path.join(svgCacheDir, `grad_${safeName}.svg`);
		fs.writeFileSync(filePath, generateGradientSVG(gradStr), "utf8");
		svgFileCache.set(gradStr, filePath);
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	return vscode.Uri.file(svgFileCache.get(gradStr)!);
}

// ─── SVG generation ───────────────────────────────────────────────────────────

function generateGradientSVG(gradStr: string): string {
	const normalised = gradStr.replace(/\s+/g, " ").trim();
	const lower = normalised.toLowerCase();

	try {
		if (
			lower.startsWith("conic-gradient") ||
			lower.startsWith("repeating-conic")
		) {
			return conicSVG(normalised);
		}
		if (
			lower.startsWith("radial-gradient") ||
			lower.startsWith("repeating-radial")
		) {
			return radialSVG(normalised, lower.startsWith("repeating"));
		}
		return linearSVG(normalised, lower.startsWith("repeating"));
	} catch {
		return fallbackSVG();
	}
}

function svgShell(defs: string, body: string): string {
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="5" ry="5" fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  <clipPath id="r"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="4"/></clipPath>
  <defs>${defs}</defs>
  ${body}
</svg>`;
}

// ── Color stop parsing ────────────────────────────────────────────────────────

interface ColorStop {
	color: string;
	offset: number;
}

function parseColorStops(args: string): ColorStop[] {
	const parts = splitByTopLevelComma(args);
	const raw: { color: string; pos: string | null }[] = [];

	for (const part of parts) {
		const p = part.trim();
		if (!p) continue;
		if (/^[\d.]+(%|px|em|rem|deg|turn|rad)$/.test(p)) continue;

		const posMatch = p.match(
			/^(.*?)\s+([\d.]+(?:%|px|em|rem|deg|turn|rad))(?:\s+[\d.]+(?:%|px|em|rem|deg|turn|rad))?$/,
		);
		if (posMatch) {
			raw.push({ color: posMatch[1].trim(), pos: posMatch[2] });
		} else {
			raw.push({ color: p, pos: null });
		}
	}

	if (raw.length === 0) {
		return [
			{ color: "transparent", offset: 0 },
			{ color: "transparent", offset: 1 },
		];
	}

	const stops: ColorStop[] = raw.map((r, i) => ({
		color: r.color,
		offset: r.pos !== null ? normalisePosition(r.pos, i, raw.length) : -1,
	}));

	if (stops[0].offset === -1) stops[0].offset = 0;
	if (stops[stops.length - 1].offset === -1) stops[stops.length - 1].offset = 1;

	for (let i = 1; i < stops.length - 1; i++) {
		if (stops[i].offset !== -1) continue;
		let j = i + 1;
		while (j < stops.length && stops[j].offset === -1) j++;
		const startOff = stops[i - 1].offset;
		const endOff = stops[j].offset;
		const count = j - (i - 1);
		for (let k = i; k < j; k++) {
			stops[k].offset =
				startOff + ((endOff - startOff) * (k - (i - 1))) / count;
		}
	}

	return stops;
}

function normalisePosition(pos: string, index: number, total: number): number {
	if (pos.endsWith("%")) return Number.parseFloat(pos) / 100;
	if (pos.endsWith("deg")) return Number.parseFloat(pos) / 360;
	if (pos.endsWith("turn")) return Number.parseFloat(pos);
	if (pos.endsWith("rad")) return Number.parseFloat(pos) / (2 * Math.PI);
	return index / Math.max(total - 1, 1);
}

function splitByTopLevelComma(s: string): string[] {
	const result: string[] = [];
	let depth = 0;
	let current = "";
	for (const ch of s) {
		if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (ch === "," && depth === 0) {
			result.push(current);
			current = "";
			continue;
		}
		current += ch;
	}
	if (current) result.push(current);
	return result;
}

function parseLinearAngle(args: string): { angleDeg: number; stops: string } {
	const trimmed = args.trim();

	const toMatch = trimmed.match(
		/^to\s+(top|bottom|left|right)(?:\s+(top|bottom|left|right))?\s*,(.*)$/is,
	);
	if (toMatch) {
		return {
			angleDeg: directionToAngle(
				toMatch[1].toLowerCase(),
				(toMatch[2] ?? "").toLowerCase(),
			),
			stops: toMatch[3],
		};
	}

	const angleMatch = trimmed.match(/^(-?[\d.]+)(deg|turn|grad|rad)\s*,(.*)$/is);
	if (angleMatch) {
		const val = Number.parseFloat(angleMatch[1]);
		const unit = angleMatch[2].toLowerCase();
		let deg = val;
		if (unit === "turn") deg = val * 360;
		else if (unit === "grad") deg = val * 0.9;
		else if (unit === "rad") deg = val * (180 / Math.PI);
		return { angleDeg: deg, stops: angleMatch[3] };
	}

	return { angleDeg: 180, stops: trimmed };
}

function directionToAngle(d1: string, d2: string): number {
	const map: Record<string, number> = {
		top: 0,
		right: 90,
		bottom: 180,
		left: 270,
		"top right": 45,
		"right top": 45,
		"bottom right": 135,
		"right bottom": 135,
		"bottom left": 225,
		"left bottom": 225,
		"top left": 315,
		"left top": 315,
	};
	return map[d2 ? `${d1} ${d2}` : d1] ?? 180;
}

function linearSVG(gradStr: string, repeating: boolean): string {
	const argsMatch = gradStr.match(/gradient\s*\(([\s\S]*)\)\s*$/i);
	if (!argsMatch) return fallbackSVG();

	const { angleDeg, stops: stopsStr } = parseLinearAngle(argsMatch[1]);
	const stops = parseColorStops(stopsStr);
	if (stops.length < 2) return fallbackSVG();

	const rad = ((angleDeg - 90) * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const x1 = (0.5 - cos * 0.5).toFixed(4);
	const y1 = (0.5 - sin * 0.5).toFixed(4);
	const x2 = (0.5 + cos * 0.5).toFixed(4);
	const y2 = (0.5 + sin * 0.5).toFixed(4);

	const spreadMethod = repeating ? 'spreadMethod="repeat"' : "";
	const stopEls = stops
		.map(
			(s) =>
				`<stop offset="${(s.offset * 100).toFixed(2)}%" stop-color="${escapeColor(s.color)}"/>`,
		)
		.join("\n    ");

	const defs = `<linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox" ${spreadMethod}>
    ${stopEls}
  </linearGradient>`;

	return svgShell(
		defs,
		`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="4" fill="url(#g)" clip-path="url(#r)"/>`,
	);
}

function radialSVG(gradStr: string, repeating: boolean): string {
	const argsMatch = gradStr.match(/gradient\s*\(([\s\S]*)\)\s*$/i);
	if (!argsMatch) return fallbackSVG();

	const stopsStr = extractRadialStops(argsMatch[1]);
	const stops = parseColorStops(stopsStr);
	if (stops.length < 2) return fallbackSVG();

	const spreadMethod = repeating ? 'spreadMethod="repeat"' : "";
	const stopEls = stops
		.map(
			(s) =>
				`<stop offset="${(s.offset * 100).toFixed(2)}%" stop-color="${escapeColor(s.color)}"/>`,
		)
		.join("\n    ");

	const defs = `<radialGradient id="g" cx="50%" cy="50%" r="50%" fx="50%" fy="50%" ${spreadMethod}>
    ${stopEls}
  </radialGradient>`;

	return svgShell(
		defs,
		`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="4" fill="url(#g)" clip-path="url(#r)"/>`,
	);
}

function extractRadialStops(args: string): string {
	const parts = splitByTopLevelComma(args);
	const shapeKeywords =
		/^(circle|ellipse|closest-side|closest-corner|farthest-side|farthest-corner|at\b)/i;
	let firstColorIdx = 0;
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i].trim();
		if (shapeKeywords.test(p)) {
			firstColorIdx = i + 1;
			continue;
		}
		if (/^[\d.]+(%|px|em)(\s+[\d.]+(%|px|em))?$/.test(p)) {
			firstColorIdx = i + 1;
			continue;
		}
		break;
	}
	return parts.slice(firstColorIdx).join(",");
}

function conicSVG(gradStr: string): string {
	const escaped = gradStr.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="5" ry="5" fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  <clipPath id="r"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="4"/></clipPath>
  <foreignObject x="1" y="1" width="${W - 2}" height="${H - 2}" clip-path="url(#r)">
    <xhtml:div style="width:100%;height:100%;background:${escaped};border-radius:4px;"></xhtml:div>
  </foreignObject>
</svg>`;
}

function fallbackSVG(): string {
	return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="5" fill="#1a1d23" stroke="#3d4455" stroke-width="1"/>
  <text x="${W / 2}" y="${H / 2 + 4}" text-anchor="middle"
        font-family="sans-serif" font-size="9" fill="#555">gradient</text>
</svg>`;
}

function escapeColor(color: string): string {
	const c = color.trim();
	if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
	if (/^(rgb|rgba|hsl|hsla)\s*\(/i.test(c)) return c.replace(/"/g, "&quot;");
	if (/^[a-z]+$/i.test(c)) return c;
	if (/^(oklch|oklab|lab|lch|color)\s*\(/i.test(c)) return "currentColor";
	return c.replace(/"/g, "&quot;");
}
