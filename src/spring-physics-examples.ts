/**
 * Spring Physics Examples
 *
 * This file demonstrates how to use the spring physics engine
 * in your own projects.
 */

import {
	calculateSpringValue,
	generateSpringFrames,
	generateLinearEasing,
	generateCSSCode,
	generateSpringCurvePathData,
	SPRING_PRESETS,
	analyzeSpring,
} from "./spring-physics";

// ============================================
// Example 1: Using Spring Presets
// ============================================

console.log("=== Example 1: Spring Presets ===");

const preset = SPRING_PRESETS.snappy;
const duration = 1;
const easing = generateLinearEasing(preset, duration);
const cssCode = generateCSSCode(preset, duration);

console.log("Snappy Spring CSS:", cssCode);

// ============================================
// Example 2: Custom Spring Configuration
// ============================================

console.log("\n=== Example 2: Custom Configuration ===");

const customConfig = {
	stiffness: 250, // Very tight spring
	damping: 18, // Less damping = more bounce
	mass: 0.8, // Light mass = snappier feel
};

const customCss = generateCSSCode(customConfig, 0.8);
console.log("Custom Spring CSS:", customCss);

// ============================================
// Example 3: Analyzing Spring Behavior
// ============================================

console.log("\n=== Example 3: Spring Analysis ===");

const analysis = analyzeSpring(customConfig, 0.8);
console.log("Damping Type:", analysis.dampingType);
console.log("Oscillations:", analysis.oscillations);
console.log("Settling Time:", analysis.settlingTime.toFixed(2), "seconds");
console.log("Max Overshoot:", analysis.maxOvershoot.toFixed(2), "%");
console.log("Description:", analysis.description);

// ============================================
// Example 4: Getting Frame-by-Frame Data
// ============================================

console.log("\n=== Example 4: Frame Data ===");

const frames = generateSpringFrames(SPRING_PRESETS.standard, 1, 20);
console.table(frames);

// ============================================
// Example 5: Generating SVG Visualization
// ============================================

console.log("\n=== Example 5: SVG Path Data ===");

const svgPath = generateSpringCurvePathData(
	SPRING_PRESETS.bouncy,
	1,
	500, // SVG width
	300, // SVG height
);

console.log("SVG Path (first 100 chars):", `${svgPath.substring(0, 100)}...`);

// ============================================
// Example 6: Creating Animation Keyframes
// ============================================

console.log("\n=== Example 6: Animation Keyframes ===");

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function generateCSSKeyframes(name: string, config: any, duration: number) {
	const frames = generateSpringFrames(config, duration, 25);

	let keyframes = `@keyframes ${name} {\n`;

	// biome-ignore lint/complexity/noForEach: <explanation>
	frames.forEach((frame) => {
		const percent = (frame.time * 100).toFixed(0);
		const translateX = (frame.value * 100).toFixed(1);
		keyframes += `  ${percent}% { transform: translateX(${translateX}%); }\n`;
	});

	keyframes += "}\n";
	return keyframes;
}

const keyframesCss = generateCSSKeyframes(
	"slideIn",
	SPRING_PRESETS.gentle,
	0.8,
);
console.log(`Generated Keyframes:\n${keyframesCss}`);

// ============================================
// Example 7: Real-world Use Case - Button Click Animation
// ============================================

console.log("\n=== Example 7: Button Click Animation ===");

class AnimatedButton {
	private config = {
		stiffness: 200,
		damping: 20,
		mass: 0.9,
	};

	getScaleAnimation() {
		// Quick scale animation on click
		return generateCSSCode(this.config, 0.4);
	}

	generateCSSRule() {
		const easing = generateLinearEasing(this.config, 0.4);
		return `
      .button:active {
        animation: buttonClick 400ms linear(${easing}) forwards;
      }

      @keyframes buttonClick {
        from { transform: scale(1); }
        to { transform: scale(0.95); }
      }
    `;
	}
}

const button = new AnimatedButton();
console.log("Button CSS:", button.generateCSSRule());

// ============================================
// Example 8: Comparing Different Configs
// ============================================

console.log("\n=== Example 8: Configuration Comparison ===");

const configs = [
	{ name: "Gentle", config: SPRING_PRESETS.gentle },
	{ name: "Standard", config: SPRING_PRESETS.standard },
	{ name: "Snappy", config: SPRING_PRESETS.snappy },
	{ name: "Bouncy", config: SPRING_PRESETS.bouncy },
];

console.table(
	configs.map(({ name, config }) => {
		const analysis = analyzeSpring(config, 1);
		return {
			name,
			stiffness: config.stiffness,
			damping: config.damping,
			dampingType: analysis.dampingType,
			overshoot: `${analysis.maxOvershoot.toFixed(1)}%`,
			settlingTime: `${analysis.settlingTime.toFixed(2)}s`,
		};
	}),
);

// ============================================
// Example 9: Single Point Calculation
// ============================================

console.log("\n=== Example 9: Calculate Value at Specific Time ===");

const value = calculateSpringValue(
	0.5, // At 50% of animation
	SPRING_PRESETS.standard.stiffness,
	SPRING_PRESETS.standard.damping,
	SPRING_PRESETS.standard.mass,
	1, // 1 second duration
);

console.log("Spring value at t=0.5s:", value.toFixed(4));

// ============================================
// Example 10: Creating Multiple Spring Animations
// ============================================

console.log("\n=== Example 10: Staggered Animations ===");

const items = ["item-1", "item-2", "item-3"];
const staggerDelay = 0.1; // 100ms between each

let staggeredCSS = "";

items.forEach((item, index) => {
	const delay = index * staggerDelay;
	const animation = generateCSSCode(SPRING_PRESETS.gentle, 0.6);
	staggeredCSS += `
    .${item} {
      ${animation.replace("animation:", "animation:")}
      animation-delay: ${delay}s;
    }
  `;
});

console.log("Staggered Animation CSS:", staggeredCSS);

export { AnimatedButton };
