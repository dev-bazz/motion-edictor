import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	console.log("CSS Ease Generator extension is now active!");

	const disposable = vscode.commands.registerCommand(
		"css-ease-generator.openEditor",
		() => {
			EaseEditorPanel.createOrShow(context.extensionUri);
		},
	);

	context.subscriptions.push(disposable);

	// Register the webview view provider for the side panel
	const provider = new EaseEditorViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("easeGeneratorView", provider),
	);
}

class EaseEditorPanel {
	public static currentPanel: EaseEditorPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case "copyToClipboard":
						vscode.env.clipboard.writeText(message.value);
						vscode.window.showInformationMessage(
							"CSS ease value copied to clipboard!",
						);
						return;
				}
			},
			null,
			this._disposables,
		);
	}

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (EaseEditorPanel.currentPanel) {
			EaseEditorPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			"easeEditor",
			"CSS Ease Generator",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
				retainContextWhenHidden: true,
			},
		);

		EaseEditorPanel.currentPanel = new EaseEditorPanel(panel, extensionUri);
	}

	private _update() {
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		return /*html*/ ``;
	}

	private dispose() {
		EaseEditorPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}
}

class EaseEditorViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "easeGeneratorView";
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message) => {
			switch (message.command) {
				case "copyToClipboard":
					vscode.env.clipboard.writeText(message.value);
					vscode.window.showInformationMessage(
						"CSS ease value copied to clipboard!",
					);
					return;
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CSS Ease Generator</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			overflow: hidden;
			height: 100vh;
		}

		.container {
			display: flex;
			flex-direction: column;
			height: 100%;
			padding: 12px;
			gap: 12px;
		}

		.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
		}

		.header h2 {
			font-size: 16px;
			font-weight: 600;
		}

		button {
			padding: 6px 12px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			transition: background 0.2s;
		}

		button:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.canvas-wrapper {
			flex: 1;
			display: flex;
			flex-direction: column;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			padding: 8px;
			min-height: 0;
		}

		canvas {
			flex: 1;
			border: 1px solid var(--vscode-input-border);
			border-radius: 2px;
			cursor: crosshair;
			background: white;
		}

		.output-section {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.output-section h3 {
			margin: 0;
			font-size: 12px;
			font-weight: 600;
		}

		.code-block {
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 2px;
			padding: 8px;
			font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
			font-size: 11px;
			word-break: break-all;
			color: var(--vscode-symbolIcon-colorForeground);
		}

		.copy-btn {
			width: 100%;
			padding: 8px;
		}

		.point-list {
			font-size: 11px;
			max-height: 80px;
			overflow-y: auto;
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 2px;
			padding: 6px;
		}

		.point-item {
			padding: 3px;
			font-family: monospace;
			font-size: 10px;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>Ease Curve</h2>
			<button id="resetBtn">Reset</button>
		</div>

		<div class="canvas-wrapper">
			<canvas id="easeCanvas"></canvas>
		</div>

		<div class="output-section">
			<h3>CSS</h3>
			<div class="code-block" id="cssOutput">cubic-bezier(0.25, 0.1, 0.25, 1.0)</div>
			<button class="copy-btn" id="copyBtn">Copy</button>
			<h3 style="margin-top: 4px;">Points</h3>
			<div class="point-list" id="pointList"></div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const canvas = document.getElementById('easeCanvas');
		const ctx = canvas.getContext('2d');
		const cssOutput = document.getElementById('cssOutput');
		const copyBtn = document.getElementById('copyBtn');
		const resetBtn = document.getElementById('resetBtn');
		const pointList = document.getElementById('pointList');

		let controlPoints = [
			{ x: 0.25, y: 0.9 },
			{ x: 0.75, y: 0.1 }
		];

		let isDrawing = false;
		let selectedPoint = -1;
		const pointRadius = 6;

		function resizeCanvas() {
			const rect = canvas.parentElement.getBoundingClientRect();
			canvas.width = rect.width - 16;
			canvas.height = rect.height - 16;
		}

		function drawCurve() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.strokeStyle = '#888';
			ctx.lineWidth = 0.5;

			// Draw grid
			for (let i = 0; i <= 10; i++) {
				const x = (canvas.width / 10) * i;
				const y = (canvas.height / 10) * i;
				ctx.fillStyle = '#ddd';
				ctx.fillRect(x - 0.25, y - 0.25, 0.5, 0.5);
			}

			// Draw axes
			ctx.strokeStyle = '#333';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(0, canvas.height);
			ctx.lineTo(canvas.width, canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, canvas.height);
			ctx.stroke();

			// Draw cubic bezier curve
			ctx.strokeStyle = '#00a8ff';
			ctx.lineWidth = 2;
			ctx.beginPath();

			const p0 = { x: 0, y: 0 };
			const p3 = { x: 1, y: 1 };
			const p1 = controlPoints[0];
			const p2 = controlPoints[1];

			ctx.moveTo(p0.x * canvas.width, canvas.height - p0.y * canvas.height);

			for (let t = 0; t <= 1; t += 0.01) {
				const x = Math.pow(1 - t, 3) * p0.x +
						  3 * Math.pow(1 - t, 2) * t * p1.x +
						  3 * (1 - t) * Math.pow(t, 2) * p2.x +
						  Math.pow(t, 3) * p3.x;
				const y = Math.pow(1 - t, 3) * p0.y +
						  3 * Math.pow(1 - t, 2) * t * p1.y +
						  3 * (1 - t) * Math.pow(t, 2) * p2.y +
						  Math.pow(t, 3) * p3.y;
				ctx.lineTo(x * canvas.width, canvas.height - y * canvas.height);
			}
			ctx.stroke();

			// Draw control lines
			ctx.strokeStyle = '#999';
			ctx.lineWidth = 0.5;
			ctx.setLineDash([3, 3]);
			ctx.beginPath();
			ctx.moveTo(0, canvas.height);
			ctx.lineTo(p1.x * canvas.width, canvas.height - p1.y * canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(canvas.width, 0);
			ctx.lineTo(p2.x * canvas.width, canvas.height - p2.y * canvas.height);
			ctx.stroke();
			ctx.setLineDash([]);

			// Draw control points
			controlPoints.forEach((point, index) => {
				ctx.fillStyle = selectedPoint === index ? '#ff6b6b' : '#00a8ff';
				ctx.beginPath();
				ctx.arc(
					point.x * canvas.width,
					canvas.height - point.y * canvas.height,
					pointRadius,
					0,
					Math.PI * 2
				);
				ctx.fill();

				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.stroke();
			});

			updateCSSOutput();
		}

		function updateCSSOutput() {
			const x1 = controlPoints[0].x.toFixed(3);
			const y1 = controlPoints[0].y.toFixed(3);
			const x2 = controlPoints[1].x.toFixed(3);
			const y2 = controlPoints[1].y.toFixed(3);

			const cubic = \`cubic-bezier(\${x1}, \${y1}, \${x2}, \${y2})\`;
			cssOutput.textContent = cubic;

			pointList.innerHTML = \`
				<div class="point-item">P1: (\${x1}, \${y1})</div>
				<div class="point-item">P2: (\${x2}, \${y2})</div>
			\`;
		}

		canvas.addEventListener('mousedown', (e) => {
			const rect = canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1 - (e.clientY - rect.top) / rect.height;

			for (let i = 0; i < controlPoints.length; i++) {
				const dx = (controlPoints[i].x * rect.width) / rect.width - x;
				const dy = (controlPoints[i].y * rect.height) / rect.height - y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < pointRadius / Math.min(rect.width, rect.height)) {
					selectedPoint = i;
					isDrawing = true;
					drawCurve();
					return;
				}
			}
		});

		canvas.addEventListener('mousemove', (e) => {
			if (!isDrawing || selectedPoint === -1) return;

			const rect = canvas.getBoundingClientRect();
			let x = (e.clientX - rect.left) / rect.width;
			let y = 1 - (e.clientY - rect.top) / rect.height;

			x = Math.max(0, Math.min(1, x));
			y = Math.max(0, Math.min(1, y));

			controlPoints[selectedPoint] = { x, y };
			drawCurve();
		});

		canvas.addEventListener('mouseup', () => {
			isDrawing = false;
			selectedPoint = -1;
			drawCurve();
		});

		canvas.addEventListener('mouseleave', () => {
			isDrawing = false;
			selectedPoint = -1;
			drawCurve();
		});

		copyBtn.addEventListener('click', () => {
			vscode.postMessage({
				command: 'copyToClipboard',
				value: cssOutput.textContent
			});
		});

		resetBtn.addEventListener('click', () => {
			controlPoints = [
				{ x: 0.25, y: 0.9 },
				{ x: 0.75, y: 0.1 }
			];
			selectedPoint = -1;
			drawCurve();
		});

		window.addEventListener('resize', () => {
			resizeCanvas();
			drawCurve();
		});

		resizeCanvas();
		drawCurve();
	</script>
</body>
</html>`;
	}
}

export function deactivate() {}
