import * as vscode from "vscode";

// Regex to match timing functions in CSS/SCSS
const TIMING_FUNCTION_REGEX =
	/(cubic-bezier\([^\)]*\)|linear|ease-in-out|ease-in|ease-out|ease|step-start|step-end|steps\([^\)]*\))/g;

// Decoration type for inline preview
const timingPreviewDecoration = vscode.window.createTextEditorDecorationType({
	after: {
		margin: "0 0 0 1em",
		contentIconPath: vscode.Uri.file(
			`${__dirname}/../media/timing-preview.svg`,
		), // Placeholder, will be replaced dynamically
	},
	rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
});

/**
 * Scans the document for timing functions and adds inline interactive previews.
 */
export function updateTimingFunctionPreviews(editor: vscode.TextEditor) {
	if (!editor || !["css", "scss"].includes(editor.document.languageId)) {
		return;
	}

	const decorations: vscode.DecorationOptions[] = [];

	for (let line = 0; line < editor.document.lineCount; line++) {
		const lineText = editor.document.lineAt(line).text;
		let match: RegExpExecArray | null = TIMING_FUNCTION_REGEX.exec(lineText);
		while (match !== null) {
			const start = match.index;
			const end = start + match[0].length;
			const range = new vscode.Range(line, start, line, end);

			// Generate a data URI SVG preview for the timing function
			const svgDataUri = generateTimingFunctionSVG(match[0]);

			decorations.push({
				range,
				renderOptions: {
					after: {
						contentIconPath: svgDataUri,
						// Optionally, add a hover message or command
					},
				},
			});
			match = TIMING_FUNCTION_REGEX.exec(lineText);
		}
	}

	editor.setDecorations(timingPreviewDecoration, decorations);
}

/**
 * Generates a data URI SVG for the given timing function string.
 * For interactive preview, this could be replaced with a webview or command.
 */
function generateTimingFunctionSVG(timing: string): vscode.Uri {
	// SVG dimensions
	const width = 48;
	const height = 24;
	let path = "";

	// Parse cubic-bezier
	const bezierMatch = timing.match(/cubic-bezier\(([^)]+)\)/);
	if (bezierMatch) {
		const [x1, y1, x2, y2] = bezierMatch[1].split(",").map(Number);
		// SVG path for cubic-bezier from (0,1) to (1,0)
		const p0 = { x: 0, y: height };
		const p1 = { x: x1 * width, y: height - y1 * height };
		const p2 = { x: x2 * width, y: height - y2 * height };
		const p3 = { x: width, y: 0 };
		path = `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
	} else {
		// Standard easings
		const std = timing.trim();
		// Map standard names to cubic-bezier
		const stdMap: Record<string, [number, number, number, number]> = {
			linear: [0, 0, 1, 1],
			ease: [0.25, 0.1, 0.25, 1],
			"ease-in": [0.42, 0, 1, 1],
			"ease-out": [0, 0, 0.58, 1],
			"ease-in-out": [0.42, 0, 0.58, 1],
		};
		if (stdMap[std]) {
			const [x1, y1, x2, y2] = stdMap[std];
			const p0 = { x: 0, y: height };
			const p1 = { x: x1 * width, y: height - y1 * height };
			const p2 = { x: x2 * width, y: height - y2 * height };
			const p3 = { x: width, y: 0 };
			path = `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
		} else {
			// Fallback: just a straight line
			path = `M 0,${height} L ${width},0`;
		}
	}

	const svg = `
		<svg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'>
			<rect width='${width}' height='${height}' fill='#e0e0e0' fill-opacity='1' stroke='#bbb' stroke-width='1'/>
			<path d='${path}' fill='none' stroke='#0078d4' stroke-width='2'/>
		</svg>
	`;
	const encoded = Buffer.from(svg).toString("base64");
	return vscode.Uri.parse(`data:image/svg+xml;base64,${encoded}`);
}

// Listeners are now registered in extension.ts
