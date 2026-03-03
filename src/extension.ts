import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";

export function activate(context: vscode.ExtensionContext) {
	console.log("CSS Ease Generator extension is now active!");

	// Register the webview view provider for the side panel
	const provider = new EaseEditorViewProvider(
		context.extensionUri,
		context.extensionPath,
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("easeGeneratorView", provider),
	);

	// Register command to open CSS Scroll Animation Cheat Sheet
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openScrollAnimationCheatSheet",
			() => {
				ScrollAnimationCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);
}

class EaseEditorViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "easeGeneratorView";
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _extensionPath: string,
	) {}

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
		const htmlPath = path.join(this._extensionPath, "src", "index.html");
		const html = fs.readFileSync(htmlPath, "utf8");
		return html;
	}
}

export function deactivate() {}

// ─── Scroll Animation Cheat Sheet Panel ────────────────────────
class ScrollAnimationCheatSheetPanel {
	public static currentPanel: ScrollAnimationCheatSheetPanel | undefined;
	private static readonly viewType = "scrollAnimationCheatSheet";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If panel already exists, reveal it
		if (ScrollAnimationCheatSheetPanel.currentPanel) {
			ScrollAnimationCheatSheetPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise create a new panel
		const panel = vscode.window.createWebviewPanel(
			ScrollAnimationCheatSheetPanel.viewType,
			"CSS Scroll Animation Cheat Sheet",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		ScrollAnimationCheatSheetPanel.currentPanel =
			new ScrollAnimationCheatSheetPanel(panel, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		this._panel.webview.html = this._getHtmlForWebview();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			(message) => {
				if (message.command === "copyToClipboard") {
					vscode.env.clipboard.writeText(message.value);
					vscode.window.showInformationMessage("Copied to clipboard!");
				}
			},
			null,
			this._disposables,
		);
	}

	public dispose() {
		ScrollAnimationCheatSheetPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const d = this._disposables.pop();
			if (d) {
				d.dispose();
			}
		}
	}

	private _getHtmlForWebview(): string {
		const htmlPath = path.join(
			this._extensionPath,
			"src",
			"scroll-animation-cheatsheet.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}
