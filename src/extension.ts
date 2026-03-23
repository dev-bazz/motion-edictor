import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import {
	initTimingPreview,
	updateTimingFunctionPreviews,
} from "./timing-preview";
import {
	initAnimationPreview,
	scheduleAnimationPreviewUpdate,
} from "./animation-preview";
import {
	initGradientPreview,
	updateGradientPreviews,
} from "./gradient-preview"; // ← NEW

export function activate(context: vscode.ExtensionContext) {
	console.log("[motion] CSS Ease Generator extension is now active!");

	// ── Init all preview systems (must come first) ────────────────────────────
	initTimingPreview(context);
	initAnimationPreview(context);
	initGradientPreview(context); // ← NEW

	const SUPPORTED_LANGUAGES = [
		"css",
		"scss",
		"less",
		"sass",
		"html",
		"vue",
		"astro",
	];

	const updateAllVisibleEditors = () => {
		for (const editor of vscode.window.visibleTextEditors) {
			const lang = editor.document.languageId;
			const text = editor.document.getText();
			if (
				SUPPORTED_LANGUAGES.includes(lang) ||
				/<style[^>]*>[\s\S]*?<\/style>/i.test(text)
			) {
				updateTimingFunctionPreviews(editor);
				scheduleAnimationPreviewUpdate(editor);
				updateGradientPreviews(editor); // ← NEW
			}
		}
	};

	updateAllVisibleEditors();

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => updateAllVisibleEditors()),
		vscode.workspace.onDidChangeTextDocument((e) => {
			const lang = e.document.languageId;
			const text = e.document.getText();
			if (
				SUPPORTED_LANGUAGES.includes(lang) ||
				/<style[^>]*>[\s\S]*?<\/style>/i.test(text)
			) {
				updateAllVisibleEditors();
			}
		}),
		vscode.window.onDidChangeVisibleTextEditors(() =>
			updateAllVisibleEditors(),
		),
	);

	// ── Webview / panel registrations ─────────────────────────────────────────

	const provider = new EaseEditorViewProvider(
		context.extensionUri,
		context.extensionPath,
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("easeGeneratorView", provider),
	);

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
		vscode.commands.registerCommand(
			"motion-graph-edictor.openSVGCheatSheet",
			() => {
				SVGCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openSVGLoadersCheatSheet",
			() => {
				SVGLoadersCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openContainerQueryCheatSheet",
			() => {
				ContainerQueryCheatSheetPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openGradientForgePro",
			() => {
				GradientForgeProPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openListPlayground",
			() => {
				ListPlaygroundPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openCheatSheetHub",
			() => {
				CheatSheetHubPanel.createOrShow(
					context.extensionUri,
					context.extensionPath,
				);
			},
		),
		vscode.commands.registerCommand(
			"motion-graph-edictor.openEaseGenerator",
			() => {
				vscode.commands.executeCommand("easeGeneratorView.focus");
			},
		),
	);
}

export function deactivate() {}

// ─── Shared panel factory ─────────────────────────────────────────────────────

class EaseEditorViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "easeGeneratorView";
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _extensionPath: string,
	) {}
	public resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};
		webviewView.webview.html = fs.readFileSync(
			path.join(this._extensionPath, "src", "index.html"),
			"utf8",
		);
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
}

function makePanel(
	viewType: string,
	title: string,
	htmlPath: string,
	extensionUri: vscode.Uri,
	onMessage?: (msg: { command: string; value?: string }) => void,
): vscode.WebviewPanel {
	const column =
		vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
	const panel = vscode.window.createWebviewPanel(viewType, title, column, {
		enableScripts: true,
		localResourceRoots: [extensionUri],
	});
	panel.webview.html = fs.readFileSync(htmlPath, "utf8");
	if (onMessage) {
		panel.webview.onDidReceiveMessage(onMessage);
	} else {
		panel.webview.onDidReceiveMessage((msg) => {
			if (msg.command === "copyToClipboard") {
				vscode.env.clipboard.writeText(msg.value ?? "");
				vscode.window.showInformationMessage("Copied to clipboard!");
			}
		});
	}
	return panel;
}

class SVGCheatSheetPanel {
	static currentPanel: SVGCheatSheetPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"svgPathCheatSheet",
			"SVG Path Cheat Sheet",
			path.join(extPath, "src", "tools", "svg-path-cheat-sheet.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new SVGCheatSheetPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			SVGCheatSheetPanel.currentPanel = undefined;
		});
	}
}

class ScrollAnimationCheatSheetPanel {
	static currentPanel: ScrollAnimationCheatSheetPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"scrollAnimationCheatSheet",
			"CSS Scroll Animation Cheat Sheet",
			path.join(extPath, "src", "tools", "scroll-animation-cheatsheet.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new ScrollAnimationCheatSheetPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			ScrollAnimationCheatSheetPanel.currentPanel = undefined;
		});
	}
}

class SVGLoadersCheatSheetPanel {
	static currentPanel: SVGLoadersCheatSheetPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"svgLoadersCheatSheet",
			"SVG Loaders Cheat Sheet",
			path.join(extPath, "src", "tools", "svg-loaders-cheatsheet.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new SVGLoadersCheatSheetPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			SVGLoadersCheatSheetPanel.currentPanel = undefined;
		});
	}
}

class CheatSheetHubPanel {
	static currentPanel: CheatSheetHubPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"cheatSheetHub",
			"Cheat Sheets",
			path.join(extPath, "src", "tools", "cheatsheet-hub.html"),
			uri,
			(msg) => {
				const cmds: Record<string, string> = {
					openEaseGenerator: "motion-graph-edictor.openEaseGenerator",
					openSVGCheatSheet: "motion-graph-edictor.openSVGCheatSheet",
					openScrollAnimationCheatSheet:
						"motion-graph-edictor.openScrollAnimationCheatSheet",
					openSVGLoadersCheatSheet:
						"motion-graph-edictor.openSVGLoadersCheatSheet",
					openContainerQueryCheatSheet:
						"motion-graph-edictor.openContainerQueryCheatSheet",
					openGradientForgePro: "motion-graph-edictor.openGradientForgePro",
					openListPlayground: "motion-graph-edictor.openListPlayground",
				};
				if (cmds[msg.command]) {
					vscode.commands.executeCommand(cmds[msg.command]);
				}
			},
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new CheatSheetHubPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			CheatSheetHubPanel.currentPanel = undefined;
		});
	}
}

class ContainerQueryCheatSheetPanel {
	static currentPanel: ContainerQueryCheatSheetPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"containerQueryCheatSheet",
			"CSS Modern Queries Cheat Sheet",
			path.join(extPath, "src", "tools", "container-query.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new ContainerQueryCheatSheetPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			ContainerQueryCheatSheetPanel.currentPanel = undefined;
		});
	}
}

class GradientForgeProPanel {
	static currentPanel: GradientForgeProPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"gradientForgePro",
			"Gradient Forge Pro",
			path.join(extPath, "src", "tools", "gradient-forge-pro.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new GradientForgeProPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			GradientForgeProPanel.currentPanel = undefined;
		});
	}
}

class ListPlaygroundPanel {
	static currentPanel: ListPlaygroundPanel | undefined;
	static createOrShow(uri: vscode.Uri, extPath: string) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		if (this.currentPanel) {
			// biome-ignore lint/complexity/noThisInStatic: <explanation>
			this.currentPanel._panel.reveal();
			return;
		}
		const p = makePanel(
			"listPlayground",
			"List Style Playground",
			path.join(extPath, "src", "tools", "list-playground.html"),
			uri,
		);
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.currentPanel = new ListPlaygroundPanel(p);
	}
	private constructor(private _panel: vscode.WebviewPanel) {
		_panel.onDidDispose(() => {
			ListPlaygroundPanel.currentPanel = undefined;
		});
	}
}
