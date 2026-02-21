import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";

export function activate(context: vscode.ExtensionContext) {
	console.log("CSS Ease Generator extension is now active!");

	const disposable = vscode.commands.registerCommand(
		"css-ease-generator.openEditor",
		() => {
			EaseEditorPanel.createOrShow(context.extensionUri, context.extensionPath);
		},
	);

	context.subscriptions.push(disposable);

	// Register the webview view provider for the side panel
	const provider = new EaseEditorViewProvider(
		context.extensionUri,
		context.extensionPath,
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("easeGeneratorView", provider),
	);
}

class EaseEditorPanel {
	public static currentPanel: EaseEditorPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		extensionPath: string,
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._extensionPath = extensionPath;

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

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
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

		EaseEditorPanel.currentPanel = new EaseEditorPanel(
			panel,
			extensionUri,
			extensionPath,
		);
	}

	private _update() {
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const htmlPath = path.join(this._extensionPath, "src", "index.html");
		const html = fs.readFileSync(htmlPath, "utf8");
		return html;
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
