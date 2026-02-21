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
