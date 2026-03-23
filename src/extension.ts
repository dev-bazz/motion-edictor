import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import { updateTimingFunctionPreviews } from "./timing-preview";

export function activate(context: vscode.ExtensionContext) {
	console.log("CSS Ease Generator extension is now active!");

	// ── Timing Function Inline Preview: Always Active ─────────────
	const updateAllVisibleEditors = () => {
		for (const editor of vscode.window.visibleTextEditors) {
			updateTimingFunctionPreviews(editor);
		}
	};
	updateAllVisibleEditors();
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => {
			updateAllVisibleEditors();
		}),
		vscode.workspace.onDidChangeTextDocument(() => {
			updateAllVisibleEditors();
		}),
		vscode.window.onDidChangeVisibleTextEditors(() => {
			updateAllVisibleEditors();
		}),
	);

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

	// Register command to open SVG Path Cheat Sheet
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openSVGCheatSheet",
			() => {
				SVGCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open SVG Loaders Cheat Sheet
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openSVGLoadersCheatSheet",
			() => {
				SVGLoadersCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open CSS Modern Queries Cheat Sheet
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openContainerQueryCheatSheet",
			() => {
				ContainerQueryCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open Gradient Forge Pro
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openGradientForgePro",
			() => {
				GradientForgeProPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open List Style Playground
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openListPlayground",
			() => {
				ListPlaygroundPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open the Cheat Sheet Hub
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openCheatSheetHub",
			() => {
				CheatSheetHubPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
	);

	// Register command to open the Ease Generator view
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"motion-graph-edictor.openEaseGenerator",
			() => {
				vscode.commands.executeCommand("easeGeneratorView.focus");
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
				case "openCheatSheetHub":
					vscode.commands.executeCommand(
						"motion-graph-edictor.openCheatSheetHub",
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

// ─── SVG Path Cheat Sheet Panel ────────────────────────────────
class SVGCheatSheetPanel {
	public static currentPanel: SVGCheatSheetPanel | undefined;
	private static readonly viewType = "svgPathCheatSheet";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (SVGCheatSheetPanel.currentPanel) {
			SVGCheatSheetPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			SVGCheatSheetPanel.viewType,
			"SVG Path Cheat Sheet",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		SVGCheatSheetPanel.currentPanel = new SVGCheatSheetPanel(
			panel,
			extensionPath,
		);
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
		SVGCheatSheetPanel.currentPanel = undefined;
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
			"tools",
			"svg-path-cheat-sheet.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

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
			"tools",
			"scroll-animation-cheatsheet.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

// ─── SVG Loaders Cheat Sheet Panel ─────────────────────────────
class SVGLoadersCheatSheetPanel {
	public static currentPanel: SVGLoadersCheatSheetPanel | undefined;
	private static readonly viewType = "svgLoadersCheatSheet";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (SVGLoadersCheatSheetPanel.currentPanel) {
			SVGLoadersCheatSheetPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			SVGLoadersCheatSheetPanel.viewType,
			"SVG Loaders Cheat Sheet",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		SVGLoadersCheatSheetPanel.currentPanel = new SVGLoadersCheatSheetPanel(
			panel,
			extensionPath,
		);
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
		SVGLoadersCheatSheetPanel.currentPanel = undefined;
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
			"tools",
			"svg-loaders-cheatsheet.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

// ─── Cheat Sheet Hub Panel ─────────────────────────────────────
class CheatSheetHubPanel {
	public static currentPanel: CheatSheetHubPanel | undefined;
	private static readonly viewType = "cheatSheetHub";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (CheatSheetHubPanel.currentPanel) {
			CheatSheetHubPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			CheatSheetHubPanel.viewType,
			"Cheat Sheets",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		CheatSheetHubPanel.currentPanel = new CheatSheetHubPanel(
			panel,
			extensionPath,
		);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		this._panel.webview.html = this._getHtmlForWebview();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case "openEaseGenerator":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openEaseGenerator",
						);
						return;
					case "openSVGCheatSheet":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openSVGCheatSheet",
						);
						return;
					case "openScrollAnimationCheatSheet":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openScrollAnimationCheatSheet",
						);
						return;
					case "openSVGLoadersCheatSheet":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openSVGLoadersCheatSheet",
						);
						return;
					case "openContainerQueryCheatSheet":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openContainerQueryCheatSheet",
						);
						return;
					case "openGradientForgePro":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openGradientForgePro",
						);
						return;
					case "openListPlayground":
						vscode.commands.executeCommand(
							"motion-graph-edictor.openListPlayground",
						);
						return;
				}
			},
			null,
			this._disposables,
		);
	}

	public dispose() {
		CheatSheetHubPanel.currentPanel = undefined;
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
			"tools",
			"cheatsheet-hub.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

// ─── Container Query Cheat Sheet Panel ─────────────────────────
class ContainerQueryCheatSheetPanel {
	public static currentPanel: ContainerQueryCheatSheetPanel | undefined;
	private static readonly viewType = "containerQueryCheatSheet";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (ContainerQueryCheatSheetPanel.currentPanel) {
			ContainerQueryCheatSheetPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			ContainerQueryCheatSheetPanel.viewType,
			"CSS Modern Queries Cheat Sheet",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		ContainerQueryCheatSheetPanel.currentPanel =
			new ContainerQueryCheatSheetPanel(panel, extensionPath);
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
		ContainerQueryCheatSheetPanel.currentPanel = undefined;
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
			"tools",
			"container-query.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

// ─── Gradient Forge Pro Panel ───────────────────────────────────
class GradientForgeProPanel {
	public static currentPanel: GradientForgeProPanel | undefined;
	private static readonly viewType = "gradientForgePro";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (GradientForgeProPanel.currentPanel) {
			GradientForgeProPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			GradientForgeProPanel.viewType,
			"Gradient Forge Pro",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		GradientForgeProPanel.currentPanel = new GradientForgeProPanel(
			panel,
			extensionPath,
		);
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
		GradientForgeProPanel.currentPanel = undefined;
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
			"tools",
			"gradient-forge-pro.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}

// ─── List Style Playground Panel ───────────────────────────────
class ListPlaygroundPanel {
	public static currentPanel: ListPlaygroundPanel | undefined;
	private static readonly viewType = "listPlayground";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (ListPlaygroundPanel.currentPanel) {
			ListPlaygroundPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			ListPlaygroundPanel.viewType,
			"List Style Playground",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		ListPlaygroundPanel.currentPanel = new ListPlaygroundPanel(
			panel,
			extensionPath,
		);
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
		ListPlaygroundPanel.currentPanel = undefined;
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
			"tools",
			"list-playground.html",
		);
		return fs.readFileSync(htmlPath, "utf8");
	}
}
