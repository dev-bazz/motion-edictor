import * as vscode from "vscode";
import {
	scssBuiltInModules,
	getModuleAlias,
	type ScssModule,
	type ScssFunction,
} from "./scss-built-in-modules";

// ─── At-Rule / Directive Snippets ───────────────────────────────
interface ScssSnippet {
	label: string;
	description: string;
	insertText: string;
	detail?: string;
	kind: vscode.CompletionItemKind;
	sortPrefix?: string;
}

const scssAtRuleSnippets: ScssSnippet[] = [
	// ── Module system ────────────────────────────────
	{
		label: "@use",
		description: "Load a Sass module and optionally namespace it.",
		insertText: "@use '${1:module}'${2: as ${3:namespace}};",
		detail: "@use 'module' as namespace;",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@use with",
		description: "Load a Sass module and configure its variables.",
		insertText: "@use '${1:module}' with (\n\t\\$${2:variable}: ${3:value}\n);",
		detail: "@use 'module' with ($var: value);",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@forward",
		description: "Forward another module's public members.",
		insertText: "@forward '${1:module}'${2: hide ${3:members}};",
		detail: "@forward 'module';",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@import",
		description: "Import a Sass file (deprecated — prefer @use).",
		insertText: "@import '${1:file}';",
		detail: "@import 'file'; (deprecated)",
		kind: vscode.CompletionItemKind.Keyword,
	},

	// ── Conditionals ─────────────────────────────────
	{
		label: "@if",
		description: "Conditionally include a block of styles.",
		insertText: "@if ${1:condition} {\n\t$0\n}",
		detail: "@if condition { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@if...else",
		description: "Conditional with else branch.",
		insertText: "@if ${1:condition} {\n\t${2}\n} @else {\n\t$0\n}",
		detail: "@if condition { ... } @else { ... }",
		kind: vscode.CompletionItemKind.Snippet,
	},
	{
		label: "@if...else if...else",
		description: "Full conditional with else-if and else branches.",
		insertText:
			"@if ${1:condition} {\n\t${2}\n} @else if ${3:condition} {\n\t${4}\n} @else {\n\t$0\n}",
		detail: "@if ... @else if ... @else { ... }",
		kind: vscode.CompletionItemKind.Snippet,
	},
	{
		label: "@else",
		description: "Else branch of an @if rule.",
		insertText: "@else {\n\t$0\n}",
		detail: "@else { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@else if",
		description: "Else-if branch of an @if rule.",
		insertText: "@else if ${1:condition} {\n\t$0\n}",
		detail: "@else if condition { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},

	// ── Loops ────────────────────────────────────────
	{
		label: "@for",
		description: "Loop from a start to an end number.",
		insertText: "@for \\$${1:i} from ${2:1} through ${3:10} {\n\t$0\n}",
		detail: "@for $i from 1 through 10 { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@for...to",
		description: "Loop from a start to (exclusive) end number.",
		insertText: "@for \\$${1:i} from ${2:1} to ${3:10} {\n\t$0\n}",
		detail: "@for $i from 1 to 10 { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@each",
		description: "Iterate over a list or map.",
		insertText: "@each \\$${1:item} in ${2:list} {\n\t$0\n}",
		detail: "@each $item in $list { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@each destructuring",
		description: "Iterate over a map with key-value destructuring.",
		insertText: "@each \\$${1:key}, \\$${2:value} in ${3:map} {\n\t$0\n}",
		detail: "@each $key, $value in $map { ... }",
		kind: vscode.CompletionItemKind.Snippet,
	},
	{
		label: "@while",
		description: "Loop as long as a condition is true.",
		insertText: "@while ${1:condition} {\n\t$0\n}",
		detail: "@while condition { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},

	// ── Mixin & Include ──────────────────────────────
	{
		label: "@mixin",
		description: "Define a reusable block of styles.",
		insertText: "@mixin ${1:name}(${2:\\$param}) {\n\t$0\n}",
		detail: "@mixin name($param) { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@mixin (no params)",
		description: "Define a mixin without parameters.",
		insertText: "@mixin ${1:name} {\n\t$0\n}",
		detail: "@mixin name { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@mixin with @content",
		description: "Define a mixin that accepts a content block.",
		insertText: "@mixin ${1:name}(${2}) {\n\t${3}\n\t@content;\n}",
		detail: "@mixin name { ... @content; }",
		kind: vscode.CompletionItemKind.Snippet,
	},
	{
		label: "@include",
		description: "Include a mixin.",
		insertText: "@include ${1:mixin-name}(${2});",
		detail: "@include mixin-name(args);",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@include with content",
		description: "Include a mixin and pass a content block.",
		insertText: "@include ${1:mixin-name}(${2}) {\n\t$0\n}",
		detail: "@include mixin-name() { ... }",
		kind: vscode.CompletionItemKind.Snippet,
	},

	// ── Function ─────────────────────────────────────
	{
		label: "@function",
		description: "Define a custom function that returns a value.",
		insertText: "@function ${1:name}(${2:\\$param}) {\n\t@return ${0};\n}",
		detail: "@function name($param) { @return ...; }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@return",
		description: "Return a value from a @function.",
		insertText: "@return ${0};",
		detail: "@return value;",
		kind: vscode.CompletionItemKind.Keyword,
	},

	// ── Extend ───────────────────────────────────────
	{
		label: "@extend",
		description: "Inherit styles from another selector.",
		insertText: "@extend ${1:%placeholder};",
		detail: "@extend %placeholder;",
		kind: vscode.CompletionItemKind.Keyword,
	},

	// ── Placeholder ──────────────────────────────────
	{
		label: "%placeholder",
		description: "Define a placeholder selector (only output when @extended).",
		insertText: "%${1:name} {\n\t$0\n}",
		detail: "%name { ... }",
		kind: vscode.CompletionItemKind.Snippet,
	},

	// ── Other At-Rules ───────────────────────────────
	{
		label: "@at-root",
		description: "Emit styles at the root of the document.",
		insertText: "@at-root ${1:selector} {\n\t$0\n}",
		detail: "@at-root selector { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@error",
		description: "Throw a fatal error and halt compilation.",
		insertText: "@error '${1:message}';",
		detail: "@error 'message';",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@warn",
		description: "Print a warning without stopping compilation.",
		insertText: "@warn '${1:message}';",
		detail: "@warn 'message';",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@debug",
		description: "Print a value for debugging purposes.",
		insertText: "@debug ${1:expression};",
		detail: "@debug expression;",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@content",
		description: "Inject the caller's content block inside a mixin.",
		insertText: "@content;",
		detail: "@content;",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@media",
		description: "Media query rule.",
		insertText: "@media ${1:(min-width: ${2:768px})} {\n\t$0\n}",
		detail: "@media (min-width: 768px) { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@supports",
		description: "Feature query rule.",
		insertText: "@supports (${1:property}: ${2:value}) {\n\t$0\n}",
		detail: "@supports (property: value) { ... }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@keyframes",
		description: "Define keyframe animations.",
		insertText:
			"@keyframes ${1:name} {\n\t0% {\n\t\t$2\n\t}\n\t100% {\n\t\t$0\n\t}\n}",
		detail: "@keyframes name { 0% { } 100% { } }",
		kind: vscode.CompletionItemKind.Keyword,
	},
	{
		label: "@charset",
		description: "Declare the character encoding.",
		insertText: "@charset '${1:UTF-8}';",
		detail: "@charset 'UTF-8';",
		kind: vscode.CompletionItemKind.Keyword,
	},
];

// ─── @use module suggestions ────────────────────────────────────
const scssUseModuleCompletions: ScssSnippet[] = scssBuiltInModules.map(
	(mod) => ({
		label: `@use '${mod.name}'`,
		description: mod.description,
		insertText: `@use '${mod.name}';`,
		detail: mod.name,
		kind: vscode.CompletionItemKind.Module,
	}),
);

// ─── Common SCSS patterns / snippets ────────────────────────────
const scssPatternSnippets: ScssSnippet[] = [
	{
		label: "Responsive mixin",
		description: "Media query mixin for responsive breakpoints.",
		insertText:
			"@mixin respond-to(\\$breakpoint) {\n\t@if \\$breakpoint == 'sm' {\n\t\t@media (min-width: 576px) { @content; }\n\t} @else if \\$breakpoint == 'md' {\n\t\t@media (min-width: 768px) { @content; }\n\t} @else if \\$breakpoint == 'lg' {\n\t\t@media (min-width: 992px) { @content; }\n\t} @else if \\$breakpoint == 'xl' {\n\t\t@media (min-width: 1200px) { @content; }\n\t}\n}",
		detail: "Responsive breakpoint mixin pattern",
		kind: vscode.CompletionItemKind.Snippet,
		sortPrefix: "z",
	},
	{
		label: "BEM block",
		description: "BEM naming pattern using SCSS nesting.",
		insertText:
			".${1:block} {\n\t&__${2:element} {\n\t\t$3\n\t}\n\n\t&--${4:modifier} {\n\t\t$0\n\t}\n}",
		detail: "BEM block with element and modifier",
		kind: vscode.CompletionItemKind.Snippet,
		sortPrefix: "z",
	},
	{
		label: "Map loop utility",
		description: "Generate utility classes from a map.",
		insertText:
			"\\$${1:colors}: (\n\t'${2:primary}': ${3:#007bff},\n\t'${4:secondary}': ${5:#6c757d},\n);\n\n@each \\$name, \\$color in \\$${1:colors} {\n\t.text-#{\\$name} {\n\t\tcolor: \\$color;\n\t}\n}",
		detail: "Generate classes from a map",
		kind: vscode.CompletionItemKind.Snippet,
		sortPrefix: "z",
	},
	{
		label: "Grid generator",
		description: "Generate grid column classes with @for loop.",
		insertText:
			"\\$${1:columns}: ${2:12};\n\n@for \\$i from 1 through \\$${1:columns} {\n\t.col-#{\\$i} {\n\t\twidth: math.percentage(math.div(\\$i, \\$${1:columns}));\n\t}\n}",
		detail: "Grid system column generator",
		kind: vscode.CompletionItemKind.Snippet,
		sortPrefix: "z",
	},
	{
		label: "Spacing scale",
		description: "Generate spacing utilities from a list.",
		insertText:
			"\\$${1:spacers}: (0, 0.25rem, 0.5rem, 1rem, 1.5rem, 3rem);\n\n@each \\$space in \\$${1:spacers} {\n\t\\$i: list.index(\\$${1:spacers}, \\$space) - 1;\n\t.mt-#{\\$i} { margin-top: \\$space; }\n\t.mb-#{\\$i} { margin-bottom: \\$space; }\n}",
		detail: "Spacing scale utility generator",
		kind: vscode.CompletionItemKind.Snippet,
		sortPrefix: "z",
	},
	{
		label: "Interpolation #{...}",
		description: "SCSS interpolation syntax.",
		insertText: "#{${1:expression}}",
		detail: "#{expression}",
		kind: vscode.CompletionItemKind.Snippet,
	},
	{
		label: "$variable",
		description: "Declare a SCSS variable.",
		insertText: "\\$${1:name}: ${2:value};",
		detail: "$name: value;",
		kind: vscode.CompletionItemKind.Variable,
	},
	{
		label: "$variable !default",
		description: "Declare a SCSS variable with !default flag.",
		insertText: "\\$${1:name}: ${2:value} !default;",
		detail: "$name: value !default;",
		kind: vscode.CompletionItemKind.Variable,
	},
	{
		label: "$map variable",
		description: "Declare a SCSS map variable.",
		insertText: "\\$${1:name}: (\n\t'${2:key}': ${3:value},\n\t$0\n);",
		detail: "$name: ('key': value, ...);",
		kind: vscode.CompletionItemKind.Variable,
	},
];

// ─── Helpers ────────────────────────────────────────────────────

/** Parse the document to find @use aliases. Returns a map of alias → module name */
function parseUseStatements(
	document: vscode.TextDocument,
): Map<string, string> {
	const aliases = new Map<string, string>();
	const text = document.getText();
	// Match: @use 'sass:math' as m;  or  @use 'sass:math';
	const useRegex = /@use\s+['"]([^'"]+)['"]\s*(?:as\s+(\S+?))?\s*;/g;
	let match: RegExpExecArray | null;
	while ((match = useRegex.exec(text)) !== null) {
		const moduleName = match[1];
		const alias = match[2] || moduleName.replace(/^.*:/, ""); // default alias is last segment
		aliases.set(alias, moduleName);
	}
	return aliases;
}

function findModuleByName(name: string): ScssModule | undefined {
	return scssBuiltInModules.find((m) => m.name === name);
}

// ─── Completion Provider ────────────────────────────────────────

export class ScssCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext,
	): vscode.CompletionItem[] | undefined {
		const lineText = document.lineAt(position).text;
		const textBeforeCursor = lineText.substring(0, position.character);

		const items: vscode.CompletionItem[] = [];

		// 1) Module member access: alias.  (e.g., math.ceil, color.adjust)
		const dotMatch = textBeforeCursor.match(/(\w+)\.\s*([\w-]*)$/);
		if (dotMatch) {
			const alias = dotMatch[1];
			const partial = dotMatch[2] || "";
			// Range covers "alias.partial" so VS Code replaces the whole thing
			const matchStart = dotMatch.index!;
			const replaceRange = new vscode.Range(
				position.line,
				matchStart,
				position.line,
				position.character,
			);
			const useAliases = parseUseStatements(document);

			// Check whether this alias matches a known use statement
			const moduleName = useAliases.get(alias);
			if (moduleName) {
				const mod = findModuleByName(moduleName);
				if (mod) {
					items.push(
						...this._getModuleMemberCompletions(
							mod,
							alias,
							partial,
							replaceRange,
						),
					);
					return items;
				}
			}

			// Also offer completions if user typed a built-in module shorthand directly
			const directMod = scssBuiltInModules.find(
				(m) => getModuleAlias(m.name) === alias,
			);
			if (directMod) {
				items.push(
					...this._getModuleMemberCompletions(
						directMod,
						alias,
						partial,
						replaceRange,
					),
				);
				return items;
			}
		}

		// 2) After @use ' or @use " — suggest built-in module names
		const useQuoteMatch = textBeforeCursor.match(/@use\s+['"]([^'"]*)$/);
		if (useQuoteMatch) {
			const partial = useQuoteMatch[1];
			for (const mod of scssBuiltInModules) {
				if (mod.name.startsWith(partial)) {
					const item = new vscode.CompletionItem(
						mod.name,
						vscode.CompletionItemKind.Module,
					);
					item.detail = mod.description;
					item.insertText = mod.name;
					item.range = new vscode.Range(
						position.translate(0, -partial.length),
						position,
					);
					items.push(item);
				}
			}
			return items;
		}

		// 3) @ prefix — suggest SCSS at-rules and directives
		const atMatch = textBeforeCursor.match(/@[\w-]*$/);
		if (atMatch) {
			items.push(...this._getAtRuleCompletions());
			items.push(...this._getUseModuleCompletions());
			return items;
		}

		// 4) Beginning of line / general context — include snippets and patterns
		const trimmed = textBeforeCursor.trim();
		if (
			trimmed === "" ||
			trimmed.startsWith("@") ||
			trimmed.startsWith("$") ||
			trimmed.startsWith("%") ||
			trimmed.startsWith("#")
		) {
			items.push(...this._getAtRuleCompletions());
			items.push(...this._getPatternSnippets());
		}

		// 5) Global SCSS built-in functions (without module prefix) for legacy usage
		items.push(...this._getGlobalFunctionCompletions());

		return items.length > 0 ? items : undefined;
	}

	// ── Module member completions ────────────────────
	private _getModuleMemberCompletions(
		mod: ScssModule,
		alias: string,
		_partial: string,
		replaceRange: vscode.Range,
	): vscode.CompletionItem[] {
		const items: vscode.CompletionItem[] = [];

		// Functions
		for (const fn of mod.functions) {
			const item = new vscode.CompletionItem(
				`${alias}.${fn.name}`,
				vscode.CompletionItemKind.Function,
			);
			item.detail = fn.signature;
			item.documentation = new vscode.MarkdownString(
				`**${mod.name}**\n\n${fn.description}\n\n\`\`\`scss\n${fn.signature}\n\`\`\``,
			);
			item.insertText = new vscode.SnippetString(`${alias}.${fn.insertText}`);
			item.filterText = `${alias}.${fn.name}`;
			item.range = replaceRange;
			item.sortText = `0_${fn.name}`;
			items.push(item);
		}

		// Variables
		if (mod.variables) {
			for (const v of mod.variables) {
				const item = new vscode.CompletionItem(
					`${alias}.${v.name}`,
					vscode.CompletionItemKind.Constant,
				);
				item.detail = `${v.value}`;
				item.documentation = new vscode.MarkdownString(
					`**${mod.name}**\n\n${v.description}\n\nValue: \`${v.value}\``,
				);
				item.insertText = `${alias}.${v.name}`;
				item.filterText = `${alias}.${v.name}`;
				item.range = replaceRange;
				item.sortText = `1_${v.name}`;
				items.push(item);
			}
		}

		// Mixins
		if (mod.mixins) {
			for (const mx of mod.mixins) {
				const item = new vscode.CompletionItem(
					`${alias}.${mx.name}`,
					vscode.CompletionItemKind.Method,
				);
				item.detail = mx.signature;
				item.documentation = new vscode.MarkdownString(
					`**${mod.name}** mixin\n\n${mx.description}\n\n\`\`\`scss\n${mx.signature}\n\`\`\``,
				);
				item.insertText = new vscode.SnippetString(`${alias}.${mx.insertText}`);
				item.filterText = `${alias}.${mx.name}`;
				item.range = replaceRange;
				item.sortText = `0_${mx.name}`;
				items.push(item);
			}
		}

		return items;
	}

	// ── At-rule completions ──────────────────────────
	private _getAtRuleCompletions(): vscode.CompletionItem[] {
		return scssAtRuleSnippets.map((s) => {
			const item = new vscode.CompletionItem(s.label, s.kind);
			item.detail = s.detail;
			item.documentation = new vscode.MarkdownString(s.description);
			item.insertText = new vscode.SnippetString(s.insertText);
			item.sortText = `0_${s.label}`;
			return item;
		});
	}

	// ── @use module completions ──────────────────────
	private _getUseModuleCompletions(): vscode.CompletionItem[] {
		return scssUseModuleCompletions.map((s) => {
			const item = new vscode.CompletionItem(s.label, s.kind);
			item.detail = s.detail;
			item.documentation = new vscode.MarkdownString(s.description);
			item.insertText = new vscode.SnippetString(s.insertText);
			item.sortText = `1_${s.label}`;
			return item;
		});
	}

	// ── Pattern snippets ─────────────────────────────
	private _getPatternSnippets(): vscode.CompletionItem[] {
		return scssPatternSnippets.map((s) => {
			const item = new vscode.CompletionItem(s.label, s.kind);
			item.detail = s.detail;
			item.documentation = new vscode.MarkdownString(s.description);
			item.insertText = new vscode.SnippetString(s.insertText);
			item.sortText = s.sortPrefix
				? `${s.sortPrefix}_${s.label}`
				: `2_${s.label}`;
			return item;
		});
	}

	// ── Global (legacy) function completions ─────────
	private _getGlobalFunctionCompletions(): vscode.CompletionItem[] {
		const items: vscode.CompletionItem[] = [];
		// Expose commonly used global functions available without @use
		const globalFunctions: ScssFunction[] = [
			{
				name: "if",
				signature: "if($condition, $if-true, $if-false)",
				description:
					"Returns $if-true if $condition is truthy, $if-false otherwise.",
				insertText: "if(${1:condition}, ${2:if-true}, ${3:if-false})",
			},
			{
				name: "rgb",
				signature: "rgb($red, $green, $blue)",
				description: "Creates a color from red, green, and blue values.",
				insertText: "rgb(${1:red}, ${2:green}, ${3:blue})",
			},
			{
				name: "rgba",
				signature: "rgba($red, $green, $blue, $alpha)",
				description: "Creates a color from red, green, blue, and alpha values.",
				insertText: "rgba(${1:red}, ${2:green}, ${3:blue}, ${4:alpha})",
			},
			{
				name: "hsl",
				signature: "hsl($hue, $saturation, $lightness)",
				description: "Creates a color from hue, saturation, and lightness.",
				insertText: "hsl(${1:hue}, ${2:saturation}, ${3:lightness})",
			},
			{
				name: "hsla",
				signature: "hsla($hue, $saturation, $lightness, $alpha)",
				description: "Creates a color from HSLA values.",
				insertText:
					"hsla(${1:hue}, ${2:saturation}, ${3:lightness}, ${4:alpha})",
			},
			{
				name: "mix",
				signature: "mix($color1, $color2, $weight: 50%)",
				description: "Mixes two colors.",
				insertText: "mix(${1:color1}, ${2:color2}, ${3:50%})",
			},
			{
				name: "lighten",
				signature: "lighten($color, $amount)",
				description: "Makes a color lighter.",
				insertText: "lighten(${1:color}, ${2:amount})",
			},
			{
				name: "darken",
				signature: "darken($color, $amount)",
				description: "Makes a color darker.",
				insertText: "darken(${1:color}, ${2:amount})",
			},
			{
				name: "saturate",
				signature: "saturate($color, $amount)",
				description: "Makes a color more saturated.",
				insertText: "saturate(${1:color}, ${2:amount})",
			},
			{
				name: "desaturate",
				signature: "desaturate($color, $amount)",
				description: "Makes a color less saturated.",
				insertText: "desaturate(${1:color}, ${2:amount})",
			},
			{
				name: "adjust-hue",
				signature: "adjust-hue($color, $degrees)",
				description: "Changes the hue of a color.",
				insertText: "adjust-hue(${1:color}, ${2:degrees})",
			},
			{
				name: "complement",
				signature: "complement($color)",
				description: "Returns the complement of a color.",
				insertText: "complement(${1:color})",
			},
			{
				name: "invert",
				signature: "invert($color, $weight: 100%)",
				description: "Returns the inverse of a color.",
				insertText: "invert(${1:color})",
			},
			{
				name: "grayscale",
				signature: "grayscale($color)",
				description: "Converts a color to grayscale.",
				insertText: "grayscale(${1:color})",
			},
			{
				name: "opacify",
				signature: "opacify($color, $amount)",
				description: "Makes a color more opaque.",
				insertText: "opacify(${1:color}, ${2:amount})",
			},
			{
				name: "transparentize",
				signature: "transparentize($color, $amount)",
				description: "Makes a color more transparent.",
				insertText: "transparentize(${1:color}, ${2:amount})",
			},
			{
				name: "red",
				signature: "red($color)",
				description: "Gets the red component of a color.",
				insertText: "red(${1:color})",
			},
			{
				name: "green",
				signature: "green($color)",
				description: "Gets the green component of a color.",
				insertText: "green(${1:color})",
			},
			{
				name: "blue",
				signature: "blue($color)",
				description: "Gets the blue component of a color.",
				insertText: "blue(${1:color})",
			},
			{
				name: "alpha",
				signature: "alpha($color)",
				description: "Gets the alpha channel of a color.",
				insertText: "alpha(${1:color})",
			},
			{
				name: "opacity",
				signature: "opacity($color)",
				description: "Gets the alpha channel of a color.",
				insertText: "opacity(${1:color})",
			},
			{
				name: "hue",
				signature: "hue($color)",
				description: "Gets the hue of a color.",
				insertText: "hue(${1:color})",
			},
			{
				name: "saturation",
				signature: "saturation($color)",
				description: "Gets the saturation of a color.",
				insertText: "saturation(${1:color})",
			},
			{
				name: "lightness",
				signature: "lightness($color)",
				description: "Gets the lightness of a color.",
				insertText: "lightness(${1:color})",
			},
			{
				name: "percentage",
				signature: "percentage($number)",
				description: "Converts a unitless number to a percentage.",
				insertText: "percentage(${1:number})",
			},
			{
				name: "round",
				signature: "round($number)",
				description: "Rounds to the nearest whole number.",
				insertText: "round(${1:number})",
			},
			{
				name: "ceil",
				signature: "ceil($number)",
				description: "Rounds up to the next whole number.",
				insertText: "ceil(${1:number})",
			},
			{
				name: "floor",
				signature: "floor($number)",
				description: "Rounds down to the next whole number.",
				insertText: "floor(${1:number})",
			},
			{
				name: "abs",
				signature: "abs($number)",
				description: "Returns the absolute value.",
				insertText: "abs(${1:number})",
			},
			{
				name: "min",
				signature: "min($numbers...)",
				description: "Returns the minimum value.",
				insertText: "min(${1:numbers})",
			},
			{
				name: "max",
				signature: "max($numbers...)",
				description: "Returns the maximum value.",
				insertText: "max(${1:numbers})",
			},
			{
				name: "random",
				signature: "random($limit: null)",
				description: "Returns a random number.",
				insertText: "random(${1})",
			},
			{
				name: "length",
				signature: "length($list)",
				description: "Returns the length of a list.",
				insertText: "length(${1:list})",
			},
			{
				name: "nth",
				signature: "nth($list, $n)",
				description: "Gets the nth item of a list.",
				insertText: "nth(${1:list}, ${2:n})",
			},
			{
				name: "join",
				signature: "join($list1, $list2)",
				description: "Joins two lists.",
				insertText: "join(${1:list1}, ${2:list2})",
			},
			{
				name: "append",
				signature: "append($list, $val)",
				description: "Appends a value to a list.",
				insertText: "append(${1:list}, ${2:val})",
			},
			{
				name: "zip",
				signature: "zip($lists...)",
				description: "Zips multiple lists.",
				insertText: "zip(${1:lists})",
			},
			{
				name: "index",
				signature: "index($list, $value)",
				description: "Returns the index of a value in a list.",
				insertText: "index(${1:list}, ${2:value})",
			},
			{
				name: "map-get",
				signature: "map-get($map, $key)",
				description: "Gets the value for a key in a map.",
				insertText: "map-get(${1:map}, ${2:key})",
			},
			{
				name: "map-merge",
				signature: "map-merge($map1, $map2)",
				description: "Merges two maps.",
				insertText: "map-merge(${1:map1}, ${2:map2})",
			},
			{
				name: "map-remove",
				signature: "map-remove($map, $keys...)",
				description: "Removes keys from a map.",
				insertText: "map-remove(${1:map}, ${2:keys})",
			},
			{
				name: "map-keys",
				signature: "map-keys($map)",
				description: "Returns all keys of a map.",
				insertText: "map-keys(${1:map})",
			},
			{
				name: "map-values",
				signature: "map-values($map)",
				description: "Returns all values of a map.",
				insertText: "map-values(${1:map})",
			},
			{
				name: "map-has-key",
				signature: "map-has-key($map, $key)",
				description: "Returns whether a map has a key.",
				insertText: "map-has-key(${1:map}, ${2:key})",
			},
			{
				name: "type-of",
				signature: "type-of($value)",
				description: "Returns the type of a value.",
				insertText: "type-of(${1:value})",
			},
			{
				name: "unit",
				signature: "unit($number)",
				description: "Returns the unit of a number.",
				insertText: "unit(${1:number})",
			},
			{
				name: "unitless",
				signature: "unitless($number)",
				description: "Returns whether a number is unitless.",
				insertText: "unitless(${1:number})",
			},
			{
				name: "comparable",
				signature: "comparable($number1, $number2)",
				description: "Returns whether two numbers have compatible units.",
				insertText: "comparable(${1:number1}, ${2:number2})",
			},
			{
				name: "str-length",
				signature: "str-length($string)",
				description: "Returns the length of a string.",
				insertText: "str-length(${1:string})",
			},
			{
				name: "str-insert",
				signature: "str-insert($string, $insert, $index)",
				description: "Inserts a string at an index.",
				insertText: "str-insert(${1:string}, ${2:insert}, ${3:index})",
			},
			{
				name: "str-index",
				signature: "str-index($string, $substring)",
				description: "Returns the index of a substring.",
				insertText: "str-index(${1:string}, ${2:substring})",
			},
			{
				name: "str-slice",
				signature: "str-slice($string, $start, $end: -1)",
				description: "Extracts a substring.",
				insertText: "str-slice(${1:string}, ${2:start}${3:, end})",
			},
			{
				name: "to-upper-case",
				signature: "to-upper-case($string)",
				description: "Converts to uppercase.",
				insertText: "to-upper-case(${1:string})",
			},
			{
				name: "to-lower-case",
				signature: "to-lower-case($string)",
				description: "Converts to lowercase.",
				insertText: "to-lower-case(${1:string})",
			},
			{
				name: "unique-id",
				signature: "unique-id()",
				description: "Returns a unique CSS identifier.",
				insertText: "unique-id()",
			},
			{
				name: "unquote",
				signature: "unquote($string)",
				description: "Removes quotes from a string.",
				insertText: "unquote(${1:string})",
			},
			{
				name: "quote",
				signature: "quote($string)",
				description: "Adds quotes to a string.",
				insertText: "quote(${1:string})",
			},
			{
				name: "inspect",
				signature: "inspect($value)",
				description: "Returns a string representation of a value.",
				insertText: "inspect(${1:value})",
			},
			{
				name: "selector-nest",
				signature: "selector-nest($selectors...)",
				description: "Nests selectors.",
				insertText: "selector-nest(${1:selectors})",
			},
			{
				name: "selector-append",
				signature: "selector-append($selectors...)",
				description: "Appends selectors.",
				insertText: "selector-append(${1:selectors})",
			},
			{
				name: "selector-replace",
				signature: "selector-replace($selector, $original, $replacement)",
				description: "Replaces part of a selector.",
				insertText:
					"selector-replace(${1:selector}, ${2:original}, ${3:replacement})",
			},
			{
				name: "selector-unify",
				signature: "selector-unify($selector1, $selector2)",
				description: "Unifies two selectors.",
				insertText: "selector-unify(${1:selector1}, ${2:selector2})",
			},
			{
				name: "is-superselector",
				signature: "is-superselector($super, $sub)",
				description: "Tests if $super matches a superset of $sub.",
				insertText: "is-superselector(${1:super}, ${2:sub})",
			},
			{
				name: "simple-selectors",
				signature: "simple-selectors($selector)",
				description: "Returns simple selectors in a compound selector.",
				insertText: "simple-selectors(${1:selector})",
			},
			{
				name: "variable-exists",
				signature: "variable-exists($name)",
				description: "Returns whether a variable exists.",
				insertText: "variable-exists(${1:name})",
			},
			{
				name: "global-variable-exists",
				signature: "global-variable-exists($name)",
				description: "Returns whether a global variable exists.",
				insertText: "global-variable-exists(${1:name})",
			},
			{
				name: "function-exists",
				signature: "function-exists($name)",
				description: "Returns whether a function exists.",
				insertText: "function-exists(${1:name})",
			},
			{
				name: "mixin-exists",
				signature: "mixin-exists($name)",
				description: "Returns whether a mixin exists.",
				insertText: "mixin-exists(${1:name})",
			},
			{
				name: "content-exists",
				signature: "content-exists()",
				description: "Returns whether @content was passed.",
				insertText: "content-exists()",
			},
			{
				name: "get-function",
				signature: "get-function($name, $css: false)",
				description: "Gets a reference to a function.",
				insertText: "get-function(${1:name})",
			},
			{
				name: "call",
				signature: "call($function, $args...)",
				description: "Calls a function reference.",
				insertText: "call(${1:function}, ${2:args})",
			},
		];

		return globalFunctions.map((fn) => {
			const item = new vscode.CompletionItem(
				fn.name,
				vscode.CompletionItemKind.Function,
			);
			item.detail = fn.signature;
			item.documentation = new vscode.MarkdownString(
				`${fn.description}\n\n\`\`\`scss\n${fn.signature}\n\`\`\``,
			);
			item.insertText = new vscode.SnippetString(fn.insertText);
			item.sortText = `3_${fn.name}`;
			return item;
		});
	}
}

// ─── Hover Provider ─────────────────────────────────────────────

export class ScssHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.Hover | undefined {
		const wordRange = document.getWordRangeAtPosition(position, /[\w$.-]+/);
		if (!wordRange) {
			return undefined;
		}
		const word = document.getText(wordRange);

		// Check for module.function pattern (e.g., math.ceil)
		const dotIndex = word.indexOf(".");
		if (dotIndex > 0) {
			const alias = word.substring(0, dotIndex);
			const memberName = word.substring(dotIndex + 1);

			const useAliases = parseUseStatements(document);
			const moduleName = useAliases.get(alias);
			const mod = moduleName
				? findModuleByName(moduleName)
				: scssBuiltInModules.find((m) => getModuleAlias(m.name) === alias);

			if (mod) {
				// Search functions
				const fn = mod.functions.find((f) => f.name === memberName);
				if (fn) {
					return new vscode.Hover(
						new vscode.MarkdownString(
							`**${mod.name}.${fn.name}**\n\n\`\`\`scss\n${fn.signature}\n\`\`\`\n\n${fn.description}`,
						),
						wordRange,
					);
				}
				// Search variables
				const v = mod.variables?.find(
					(vr) => vr.name === `$${memberName}` || vr.name === memberName,
				);
				if (v) {
					return new vscode.Hover(
						new vscode.MarkdownString(
							`**${mod.name}.${v.name}**\n\nValue: \`${v.value}\`\n\n${v.description}`,
						),
						wordRange,
					);
				}
				// Search mixins
				const mx = mod.mixins?.find((m) => m.name === memberName);
				if (mx) {
					return new vscode.Hover(
						new vscode.MarkdownString(
							`**${mod.name}.${mx.name}** (mixin)\n\n\`\`\`scss\n${mx.signature}\n\`\`\`\n\n${mx.description}`,
						),
						wordRange,
					);
				}
			}
		}

		return undefined;
	}
}

// ─── Signature Help Provider ────────────────────────────────────

export class ScssSignatureHelpProvider implements vscode.SignatureHelpProvider {
	provideSignatureHelp(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.SignatureHelpContext,
	): vscode.SignatureHelp | undefined {
		const lineText = document.lineAt(position).text;
		const textBeforeCursor = lineText.substring(0, position.character);

		// Match module.function( pattern
		const fnCallMatch = textBeforeCursor.match(/(\w+)\.(\w+)\s*\(([^)]*)$/);
		if (fnCallMatch) {
			const alias = fnCallMatch[1];
			const fnName = fnCallMatch[2];
			const argsText = fnCallMatch[3];

			const useAliases = parseUseStatements(document);
			const moduleName = useAliases.get(alias);
			const mod = moduleName
				? findModuleByName(moduleName)
				: scssBuiltInModules.find((m) => getModuleAlias(m.name) === alias);

			if (mod) {
				const fn = mod.functions.find((f) => f.name === fnName);
				if (fn) {
					const sigHelp = new vscode.SignatureHelp();
					const sig = new vscode.SignatureInformation(
						`${alias}.${fn.signature}`,
						new vscode.MarkdownString(fn.description),
					);

					// Parse parameters from the signature
					const paramMatch = fn.signature.match(/\(([^)]*)\)/);
					if (paramMatch) {
						const params = paramMatch[1].split(",").map((p) => p.trim());
						sig.parameters = params.map(
							(p) => new vscode.ParameterInformation(p),
						);
					}
					sigHelp.signatures = [sig];
					sigHelp.activeSignature = 0;
					// Count commas to determine active parameter
					sigHelp.activeParameter = (argsText.match(/,/g) || []).length;
					return sigHelp;
				}
			}
		}

		return undefined;
	}
}
