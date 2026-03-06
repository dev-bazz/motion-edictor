export interface ScssFunction {
	name: string;
	signature: string;
	description: string;
	insertText: string;
}

export interface ScssVariable {
	name: string;
	description: string;
	value: string;
}

export interface ScssModule {
	name: string;
	description: string;
	functions: ScssFunction[];
	variables?: ScssVariable[];
	mixins?: ScssFunction[];
}

// ─── sass:math ──────────────────────────────────────────────────
const mathModule: ScssModule = {
	name: "sass:math",
	description: "Provides mathematical functions and constants.",
	variables: [
		{
			name: "$e",
			description: "The value of the mathematical constant e.",
			value: "2.7182818285...",
		},
		{
			name: "$pi",
			description: "The value of the mathematical constant π.",
			value: "3.1415926536...",
		},
		{
			name: "$epsilon",
			description: "Smallest positive number where 1 + $epsilon ≠ 1.",
			value: "Machine epsilon",
		},
		{
			name: "$max-number",
			description: "The maximum finite number representable.",
			value: "Max float",
		},
		{
			name: "$min-number",
			description: "The smallest positive number representable.",
			value: "Min float",
		},
		{
			name: "$max-safe-integer",
			description: "The maximum safe integer.",
			value: "2^53 - 1",
		},
		{
			name: "$min-safe-integer",
			description: "The minimum safe integer.",
			value: "-(2^53 - 1)",
		},
		{ name: "$infinity", description: "Positive infinity.", value: "Infinity" },
		{ name: "$nan", description: "Not a Number.", value: "NaN" },
	],
	functions: [
		{
			name: "ceil",
			signature: "ceil($number)",
			description: "Rounds $number up to the next whole number.",
			insertText: "ceil(${1:number})",
		},
		{
			name: "floor",
			signature: "floor($number)",
			description: "Rounds $number down to the next whole number.",
			insertText: "floor(${1:number})",
		},
		{
			name: "round",
			signature: "round($number)",
			description: "Rounds $number to the nearest whole number.",
			insertText: "round(${1:number})",
		},
		{
			name: "abs",
			signature: "abs($number)",
			description: "Returns the absolute value of $number.",
			insertText: "abs(${1:number})",
		},
		{
			name: "max",
			signature: "max($numbers...)",
			description: "Returns the highest of one or more numbers.",
			insertText: "max(${1:numbers})",
		},
		{
			name: "min",
			signature: "min($numbers...)",
			description: "Returns the lowest of one or more numbers.",
			insertText: "min(${1:numbers})",
		},
		{
			name: "percentage",
			signature: "percentage($number)",
			description: "Converts a unitless number to a percentage.",
			insertText: "percentage(${1:number})",
		},
		{
			name: "random",
			signature: "random($limit: null)",
			description: "Returns a random number between 0 and 1, or 1 and $limit.",
			insertText: "random(${1:limit})",
		},
		{
			name: "unit",
			signature: "unit($number)",
			description: "Returns the unit of $number as a string.",
			insertText: "unit(${1:number})",
		},
		{
			name: "is-unitless",
			signature: "is-unitless($number)",
			description: "Returns whether $number has no unit.",
			insertText: "is-unitless(${1:number})",
		},
		{
			name: "compatible",
			signature: "compatible($number1, $number2)",
			description:
				"Returns whether $number1 and $number2 have compatible units.",
			insertText: "compatible(${1:number1}, ${2:number2})",
		},
		{
			name: "clamp",
			signature: "clamp($min, $number, $max)",
			description: "Clamps $number between $min and $max.",
			insertText: "clamp(${1:min}, ${2:number}, ${3:max})",
		},
		{
			name: "div",
			signature: "div($number1, $number2)",
			description: "Returns the result of dividing $number1 by $number2.",
			insertText: "div(${1:number1}, ${2:number2})",
		},
		{
			name: "hypot",
			signature: "hypot($numbers...)",
			description: "Returns the hypotenuse of the given numbers.",
			insertText: "hypot(${1:numbers})",
		},
		{
			name: "log",
			signature: "log($number, $base: null)",
			description: "Returns the logarithm of $number.",
			insertText: "log(${1:number}${2:, base})",
		},
		{
			name: "pow",
			signature: "pow($base, $exponent)",
			description: "Raises $base to the power of $exponent.",
			insertText: "pow(${1:base}, ${2:exponent})",
		},
		{
			name: "sqrt",
			signature: "sqrt($number)",
			description: "Returns the square root of $number.",
			insertText: "sqrt(${1:number})",
		},
		{
			name: "cos",
			signature: "cos($number)",
			description: "Returns the cosine of $number (in rad or deg).",
			insertText: "cos(${1:number})",
		},
		{
			name: "sin",
			signature: "sin($number)",
			description: "Returns the sine of $number (in rad or deg).",
			insertText: "sin(${1:number})",
		},
		{
			name: "tan",
			signature: "tan($number)",
			description: "Returns the tangent of $number (in rad or deg).",
			insertText: "tan(${1:number})",
		},
		{
			name: "acos",
			signature: "acos($number)",
			description: "Returns the arccosine of $number in deg.",
			insertText: "acos(${1:number})",
		},
		{
			name: "asin",
			signature: "asin($number)",
			description: "Returns the arcsine of $number in deg.",
			insertText: "asin(${1:number})",
		},
		{
			name: "atan",
			signature: "atan($number)",
			description: "Returns the arctangent of $number in deg.",
			insertText: "atan(${1:number})",
		},
		{
			name: "atan2",
			signature: "atan2($y, $x)",
			description: "Returns the 2-argument arctangent of $y and $x in deg.",
			insertText: "atan2(${1:y}, ${2:x})",
		},
	],
};

// ─── sass:color ─────────────────────────────────────────────────
const colorModule: ScssModule = {
	name: "sass:color",
	description:
		"Provides functions for creating, inspecting, and manipulating colors.",
	functions: [
		{
			name: "adjust",
			signature: "adjust($color, ...)",
			description:
				"Increases or decreases one or more properties of $color by fixed amounts.",
			insertText: "adjust(${1:color}, \\$${2:property}: ${3:amount})",
		},
		{
			name: "change",
			signature: "change($color, ...)",
			description: "Sets one or more properties of $color to new values.",
			insertText: "change(${1:color}, \\$${2:property}: ${3:value})",
		},
		{
			name: "scale",
			signature: "scale($color, ...)",
			description: "Scales one or more properties of $color fluidly.",
			insertText: "scale(${1:color}, \\$${2:property}: ${3:amount})",
		},
		{
			name: "mix",
			signature: "mix($color1, $color2, $weight: 50%)",
			description: "Mixes two colors by a given weight.",
			insertText: "mix(${1:color1}, ${2:color2}${3:, 50%})",
		},
		{
			name: "complement",
			signature: "complement($color)",
			description: "Returns the complement of $color.",
			insertText: "complement(${1:color})",
		},
		{
			name: "grayscale",
			signature: "grayscale($color)",
			description: "Returns a gray color with the same lightness.",
			insertText: "grayscale(${1:color})",
		},
		{
			name: "invert",
			signature: "invert($color, $weight: 100%)",
			description: "Returns the inverse of $color.",
			insertText: "invert(${1:color}${2:, 100%})",
		},
		{
			name: "red",
			signature: "red($color)",
			description: "Returns the red channel of $color.",
			insertText: "red(${1:color})",
		},
		{
			name: "green",
			signature: "green($color)",
			description: "Returns the green channel of $color.",
			insertText: "green(${1:color})",
		},
		{
			name: "blue",
			signature: "blue($color)",
			description: "Returns the blue channel of $color.",
			insertText: "blue(${1:color})",
		},
		{
			name: "hue",
			signature: "hue($color)",
			description: "Returns the hue of $color.",
			insertText: "hue(${1:color})",
		},
		{
			name: "saturation",
			signature: "saturation($color)",
			description: "Returns the saturation of $color.",
			insertText: "saturation(${1:color})",
		},
		{
			name: "lightness",
			signature: "lightness($color)",
			description: "Returns the lightness of $color.",
			insertText: "lightness(${1:color})",
		},
		{
			name: "alpha",
			signature: "alpha($color)",
			description: "Returns the alpha channel of $color.",
			insertText: "alpha(${1:color})",
		},
		{
			name: "opacity",
			signature: "opacity($color)",
			description: "Returns the alpha channel of $color.",
			insertText: "opacity(${1:color})",
		},
		{
			name: "adjust-hue",
			signature: "adjust-hue($color, $degrees)",
			description: "Adjusts the hue of $color.",
			insertText: "adjust-hue(${1:color}, ${2:degrees})",
		},
		{
			name: "darken",
			signature: "darken($color, $amount)",
			description: "Makes $color darker.",
			insertText: "darken(${1:color}, ${2:amount})",
		},
		{
			name: "lighten",
			signature: "lighten($color, $amount)",
			description: "Makes $color lighter.",
			insertText: "lighten(${1:color}, ${2:amount})",
		},
		{
			name: "desaturate",
			signature: "desaturate($color, $amount)",
			description: "Makes $color less saturated.",
			insertText: "desaturate(${1:color}, ${2:amount})",
		},
		{
			name: "saturate",
			signature: "saturate($color, $amount)",
			description: "Makes $color more saturated.",
			insertText: "saturate(${1:color}, ${2:amount})",
		},
		{
			name: "opacify",
			signature: "opacify($color, $amount)",
			description: "Makes $color more opaque.",
			insertText: "opacify(${1:color}, ${2:amount})",
		},
		{
			name: "fade-in",
			signature: "fade-in($color, $amount)",
			description: "Makes $color more opaque (alias of opacify).",
			insertText: "fade-in(${1:color}, ${2:amount})",
		},
		{
			name: "transparentize",
			signature: "transparentize($color, $amount)",
			description: "Makes $color more transparent.",
			insertText: "transparentize(${1:color}, ${2:amount})",
		},
		{
			name: "fade-out",
			signature: "fade-out($color, $amount)",
			description: "Makes $color more transparent (alias of transparentize).",
			insertText: "fade-out(${1:color}, ${2:amount})",
		},
		{
			name: "ie-hex-str",
			signature: "ie-hex-str($color)",
			description: "Returns an IE-compatible hex string.",
			insertText: "ie-hex-str(${1:color})",
		},
		{
			name: "hwb",
			signature: "hwb($hue $whiteness $blackness / $alpha)",
			description: "Creates a color from HWB values.",
			insertText: "hwb(${1:hue} ${2:whiteness} ${3:blackness})",
		},
		{
			name: "whiteness",
			signature: "whiteness($color)",
			description: "Returns the HWB whiteness of $color.",
			insertText: "whiteness(${1:color})",
		},
		{
			name: "blackness",
			signature: "blackness($color)",
			description: "Returns the HWB blackness of $color.",
			insertText: "blackness(${1:color})",
		},
		{
			name: "channel",
			signature: "channel($color, $channel, $space: null)",
			description: "Returns a specific channel of $color.",
			insertText: "channel(${1:color}, ${2:channel})",
		},
		{
			name: "is-missing",
			signature: "is-missing($color, $channel)",
			description: "Returns whether $channel is missing in $color.",
			insertText: "is-missing(${1:color}, ${2:channel})",
		},
		{
			name: "is-legacy",
			signature: "is-legacy($color)",
			description: "Returns whether $color is in a legacy color space.",
			insertText: "is-legacy(${1:color})",
		},
		{
			name: "is-in-gamut",
			signature: "is-in-gamut($color, $space: null)",
			description: "Returns whether $color is in gamut for its space.",
			insertText: "is-in-gamut(${1:color})",
		},
		{
			name: "to-gamut",
			signature: "to-gamut($color, $space: null)",
			description: "Maps $color into the gamut of $space.",
			insertText: "to-gamut(${1:color})",
		},
		{
			name: "space",
			signature: "space($color)",
			description: "Returns the color space of $color.",
			insertText: "space(${1:color})",
		},
		{
			name: "to-space",
			signature: "to-space($color, $space)",
			description: "Converts $color to the given $space.",
			insertText: "to-space(${1:color}, ${2:space})",
		},
	],
};

// ─── sass:list ──────────────────────────────────────────────────
const listModule: ScssModule = {
	name: "sass:list",
	description: "Provides functions for working with lists.",
	functions: [
		{
			name: "append",
			signature: "append($list, $val, $separator: auto)",
			description: "Returns a copy of $list with $val added to the end.",
			insertText: "append(${1:list}, ${2:val})",
		},
		{
			name: "index",
			signature: "index($list, $value)",
			description: "Returns the index of $value in $list, or null.",
			insertText: "index(${1:list}, ${2:value})",
		},
		{
			name: "is-bracketed",
			signature: "is-bracketed($list)",
			description: "Returns whether $list has square brackets.",
			insertText: "is-bracketed(${1:list})",
		},
		{
			name: "join",
			signature: "join($list1, $list2, $separator: auto, $bracketed: auto)",
			description: "Returns a new list with elements of both lists.",
			insertText: "join(${1:list1}, ${2:list2})",
		},
		{
			name: "length",
			signature: "length($list)",
			description: "Returns the number of elements in $list.",
			insertText: "length(${1:list})",
		},
		{
			name: "separator",
			signature: "separator($list)",
			description: "Returns the name of the separator used by $list.",
			insertText: "separator(${1:list})",
		},
		{
			name: "nth",
			signature: "nth($list, $n)",
			description: "Returns the nth element of $list.",
			insertText: "nth(${1:list}, ${2:n})",
		},
		{
			name: "set-nth",
			signature: "set-nth($list, $n, $value)",
			description: "Returns a copy of $list with the nth element replaced.",
			insertText: "set-nth(${1:list}, ${2:n}, ${3:value})",
		},
		{
			name: "zip",
			signature: "zip($lists...)",
			description: "Combines every list into a single multidimensional list.",
			insertText: "zip(${1:lists})",
		},
		{
			name: "slash",
			signature: "slash($elements...)",
			description: "Returns a slash-separated list.",
			insertText: "slash(${1:elements})",
		},
	],
};

// ─── sass:map ───────────────────────────────────────────────────
const mapModule: ScssModule = {
	name: "sass:map",
	description: "Provides functions for working with maps (key-value pairs).",
	functions: [
		{
			name: "get",
			signature: "get($map, $key, $keys...)",
			description: "Returns the value associated with $key in $map.",
			insertText: "get(${1:map}, ${2:key})",
		},
		{
			name: "has-key",
			signature: "has-key($map, $key, $keys...)",
			description: "Returns whether $map contains $key.",
			insertText: "has-key(${1:map}, ${2:key})",
		},
		{
			name: "keys",
			signature: "keys($map)",
			description: "Returns a list of all keys in $map.",
			insertText: "keys(${1:map})",
		},
		{
			name: "values",
			signature: "values($map)",
			description: "Returns a list of all values in $map.",
			insertText: "values(${1:map})",
		},
		{
			name: "merge",
			signature: "merge($map1, $map2)",
			description: "Returns a new map with all key/value pairs from both maps.",
			insertText: "merge(${1:map1}, ${2:map2})",
		},
		{
			name: "remove",
			signature: "remove($map, $keys...)",
			description: "Returns a copy of $map without the given keys.",
			insertText: "remove(${1:map}, ${2:keys})",
		},
		{
			name: "set",
			signature: "set($map, $key, $value)",
			description: "Returns a copy of $map with $key set to $value.",
			insertText: "set(${1:map}, ${2:key}, ${3:value})",
		},
		{
			name: "deep-merge",
			signature: "deep-merge($map1, $map2)",
			description: "Recursively merges two maps.",
			insertText: "deep-merge(${1:map1}, ${2:map2})",
		},
		{
			name: "deep-remove",
			signature: "deep-remove($map, $key, $keys...)",
			description: "Recursively removes $key from $map.",
			insertText: "deep-remove(${1:map}, ${2:key})",
		},
	],
};

// ─── sass:meta ──────────────────────────────────────────────────
const metaModule: ScssModule = {
	name: "sass:meta",
	description: "Provides introspection functions for the Sass language itself.",
	mixins: [
		{
			name: "load-css",
			signature: "@include meta.load-css($url, $with: null)",
			description: "Dynamically loads a module's CSS at runtime.",
			insertText: "load-css(${1:url})",
		},
	],
	functions: [
		{
			name: "call",
			signature: "call($function, $args...)",
			description: "Invokes $function with $args and returns the result.",
			insertText: "call(${1:function}, ${2:args})",
		},
		{
			name: "content-exists",
			signature: "content-exists()",
			description:
				"Returns whether the current mixin was passed a @content block.",
			insertText: "content-exists()",
		},
		{
			name: "feature-exists",
			signature: "feature-exists($feature)",
			description:
				"Returns whether the current Sass implementation supports $feature.",
			insertText: "feature-exists(${1:feature})",
		},
		{
			name: "function-exists",
			signature: "function-exists($name, $module: null)",
			description: "Returns whether a function named $name exists.",
			insertText: "function-exists(${1:name})",
		},
		{
			name: "get-function",
			signature: "get-function($name, $css: false, $module: null)",
			description: "Returns the function named $name.",
			insertText: "get-function(${1:name})",
		},
		{
			name: "global-variable-exists",
			signature: "global-variable-exists($name, $module: null)",
			description: "Returns whether a global variable named $name exists.",
			insertText: "global-variable-exists(${1:name})",
		},
		{
			name: "inspect",
			signature: "inspect($value)",
			description: "Returns a string representation of $value.",
			insertText: "inspect(${1:value})",
		},
		{
			name: "keywords",
			signature: "keywords($args)",
			description: "Returns the keyword arguments passed to a mixin/function.",
			insertText: "keywords(${1:args})",
		},
		{
			name: "mixin-exists",
			signature: "mixin-exists($name, $module: null)",
			description: "Returns whether a mixin named $name exists.",
			insertText: "mixin-exists(${1:name})",
		},
		{
			name: "module-functions",
			signature: "module-functions($module)",
			description: "Returns all functions defined in $module.",
			insertText: "module-functions(${1:module})",
		},
		{
			name: "module-mixins",
			signature: "module-mixins($module)",
			description: "Returns all mixins defined in $module.",
			insertText: "module-mixins(${1:module})",
		},
		{
			name: "module-variables",
			signature: "module-variables($module)",
			description: "Returns all variables defined in $module.",
			insertText: "module-variables(${1:module})",
		},
		{
			name: "type-of",
			signature: "type-of($value)",
			description: "Returns the type of $value.",
			insertText: "type-of(${1:value})",
		},
		{
			name: "variable-exists",
			signature: "variable-exists($name)",
			description:
				"Returns whether a variable named $name exists in the current scope.",
			insertText: "variable-exists(${1:name})",
		},
		{
			name: "calc-args",
			signature: "calc-args($calc)",
			description: "Returns the arguments of a calculation value.",
			insertText: "calc-args(${1:calc})",
		},
		{
			name: "calc-name",
			signature: "calc-name($calc)",
			description: "Returns the name of a calculation value.",
			insertText: "calc-name(${1:calc})",
		},
	],
};

// ─── sass:selector ──────────────────────────────────────────────
const selectorModule: ScssModule = {
	name: "sass:selector",
	description: "Provides functions for inspecting and manipulating selectors.",
	functions: [
		{
			name: "append",
			signature: "append($selectors...)",
			description: "Appends selectors without a descendant combinator.",
			insertText: "append(${1:selectors})",
		},
		{
			name: "extend",
			signature: "extend($selector, $extendee, $extender)",
			description: "Extends $selector with $extender.",
			insertText: "extend(${1:selector}, ${2:extendee}, ${3:extender})",
		},
		{
			name: "is-superselector",
			signature: "is-superselector($super, $sub)",
			description: "Returns whether $super matches a superset of $sub.",
			insertText: "is-superselector(${1:super}, ${2:sub})",
		},
		{
			name: "nest",
			signature: "nest($selectors...)",
			description: "Returns selectors nested within each other.",
			insertText: "nest(${1:selectors})",
		},
		{
			name: "parse",
			signature: "parse($selector)",
			description: "Parses a selector string into selector lists.",
			insertText: "parse(${1:selector})",
		},
		{
			name: "replace",
			signature: "replace($selector, $original, $replacement)",
			description: "Replaces $original with $replacement in $selector.",
			insertText: "replace(${1:selector}, ${2:original}, ${3:replacement})",
		},
		{
			name: "simple-selectors",
			signature: "simple-selectors($selector)",
			description: "Returns the simple selectors in a compound selector.",
			insertText: "simple-selectors(${1:selector})",
		},
		{
			name: "unify",
			signature: "unify($selector1, $selector2)",
			description:
				"Returns a selector that matches only elements matched by both.",
			insertText: "unify(${1:selector1}, ${2:selector2})",
		},
	],
};

// ─── sass:string ────────────────────────────────────────────────
const stringModule: ScssModule = {
	name: "sass:string",
	description: "Provides functions for working with strings.",
	functions: [
		{
			name: "index",
			signature: "index($string, $substring)",
			description: "Returns the first index of $substring in $string, or null.",
			insertText: "index(${1:string}, ${2:substring})",
		},
		{
			name: "insert",
			signature: "insert($string, $insert, $index)",
			description: "Returns a copy of $string with $insert inserted at $index.",
			insertText: "insert(${1:string}, ${2:insert}, ${3:index})",
		},
		{
			name: "length",
			signature: "length($string)",
			description: "Returns the number of characters in $string.",
			insertText: "length(${1:string})",
		},
		{
			name: "quote",
			signature: "quote($string)",
			description: "Returns $string as a quoted string.",
			insertText: "quote(${1:string})",
		},
		{
			name: "slice",
			signature: "slice($string, $start-at, $end-at: -1)",
			description: "Returns the slice of $string from $start-at to $end-at.",
			insertText: "slice(${1:string}, ${2:start-at}${3:, end-at})",
		},
		{
			name: "split",
			signature: "split($string, $separator, $limit: null)",
			description: "Splits $string by $separator into a list of substrings.",
			insertText: "split(${1:string}, ${2:separator})",
		},
		{
			name: "to-lower-case",
			signature: "to-lower-case($string)",
			description: "Converts $string to lowercase.",
			insertText: "to-lower-case(${1:string})",
		},
		{
			name: "to-upper-case",
			signature: "to-upper-case($string)",
			description: "Converts $string to uppercase.",
			insertText: "to-upper-case(${1:string})",
		},
		{
			name: "unique-id",
			signature: "unique-id()",
			description: "Returns a randomly-generated unique CSS identifier.",
			insertText: "unique-id()",
		},
		{
			name: "unquote",
			signature: "unquote($string)",
			description: "Returns $string as an unquoted string.",
			insertText: "unquote(${1:string})",
		},
	],
};

export const scssBuiltInModules: ScssModule[] = [
	mathModule,
	colorModule,
	listModule,
	mapModule,
	metaModule,
	selectorModule,
	stringModule,
];

/** Returns the short alias from "sass:math" → "math" */
export function getModuleAlias(moduleName: string): string {
	return moduleName.replace("sass:", "");
}
