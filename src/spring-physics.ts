/**
 * Professional Spring Physics Engine
 *
 * A production-ready spring physics implementation using the damped harmonic oscillator model.
 * This engine is used by major animation libraries like React Spring, Framer Motion, and Anime.js.
 *
 * Based on physics equations:
 * - Angular frequency: ω₀ = √(k/m)
 * - Damping ratio: ζ (zeta) = c / (2√(km))
 * - Displacement: x(t) = 1 - e^(-ζω₀t)[cos(ωdt) + (ζω₀/ωd)sin(ωdt)]
 *
 * @example
 * ```typescript
 * import { generateCSSCode, SPRING_PRESETS, analyzeSpring } from './spring-physics';
 *
 * // Use a preset
 * const css = generateCSSCode(SPRING_PRESETS.snappy, 0.8);
 *
 * // Or custom config
 * const config = { stiffness: 200, damping: 20, mass: 1 };
 * const css = generateCSSCode(config, 0.8);
 * console.log(css);
 * // Output: animation: slide 800ms linear(...) forwards;
 * ```
 */

export interface SpringConfig {
	/** Stiffness of the spring (50-500, typical: 170) */
	stiffness: number;
	/** Damping coefficient (5-100, typical: 26) */
	damping: number;
	/** Mass of the animated object (0.1-5, typical: 1) */
	mass: number;
}

export interface AnimationFrame {
	time: number;
	value: number;
}

/**
 * Calculates the displacement at a given time using damped harmonic oscillator physics
 *
 * @param t - Time value (0-1, where 1 is the animation end)
 * @param stiffness - Spring stiffness (k)
 * @param damping - Damping coefficient (c)
 * @param mass - Mass (m)
 * @param duration - Total animation duration in seconds
 * @returns Displacement value (0-1, can overshoot for underdamped springs)
 */
export function calculateSpringValue(
	t: number,
	stiffness: number,
	damping: number,
	mass: number,
	duration: number,
): number {
	if (t <= 0) {
		return 0;
	}
	if (t >= 1) {
		return 1;
	}

	// Normalize time to animation duration
	const normalizedTime = t * duration;

	// Angular frequency (natural frequency)
	// ω₀ = √(k/m)
	const omega0 = Math.sqrt(stiffness / mass);

	// Damping ratio
	// ζ (zeta) = c / (2√(km))
	const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

	// If overdamped (ζ >= 1), no oscillation occurs
	if (dampingRatio >= 1) {
		const r1 =
			-omega0 * (dampingRatio + Math.sqrt(dampingRatio * dampingRatio - 1));
		return 1 - Math.exp(r1 * normalizedTime) * (1 + r1 * normalizedTime);
	}

	// Damped frequency
	// ωd = ω₀√(1 - ζ²)
	const omegad =
		omega0 * Math.sqrt(Math.max(0, 1 - dampingRatio * dampingRatio));

	// Displacement equation for underdamped system:
	// x(t) = 1 - e^(-ζω₀t)[cos(ωdt) + (ζω₀/ωd)sin(ωdt)]
	const exponentialDecay = Math.exp(-dampingRatio * omega0 * normalizedTime);

	if (omegad === 0) {
		return 1 - exponentialDecay * (1 + dampingRatio * omega0 * normalizedTime);
	}

	const cosTerm = Math.cos(omegad * normalizedTime);
	const sinTerm =
		((dampingRatio * omega0) / omegad) * Math.sin(omegad * normalizedTime);

	return 1 - exponentialDecay * (cosTerm + sinTerm);
}

/**
 * Generates an array of animation frames for the spring motion
 *
 * @param config - Spring configuration parameters
 * @param duration - Total animation duration in seconds
 * @param samplingRate - Number of samples per second (default: 100)
 * @returns Array of animation frames with time and value
 */
export function generateSpringFrames(
	config: SpringConfig,
	duration: number,
	samplingRate = 100,
): AnimationFrame[] {
	const frames: AnimationFrame[] = [];
	const timeStep = 1 / samplingRate;

	for (let t = 0; t <= 1; t += timeStep) {
		const value = calculateSpringValue(
			t,
			config.stiffness,
			config.damping,
			config.mass,
			duration,
		);
		frames.push({ time: t, value });
	}

	return frames;
}

/**
 * Generates a CSS linear() easing function string
 *
 * @param config - Spring configuration parameters
 * @param duration - Total animation duration in seconds
 * @returns CSS linear() easing function string
 */
export function generateLinearEasing(
	config: SpringConfig,
	duration: number,
): string {
	const frames = generateSpringFrames(config, duration, 100);
	const keyframes: string[] = [];

	frames.forEach((frame, index) => {
		const value = frame.value.toFixed(4);
		const percent = (frame.time * 100).toFixed(1);

		if (index === 0) {
			// First point (0%)
			keyframes.push(value);
		} else if (index === frames.length - 1) {
			// Last point (100%)
			keyframes.push("1");
		} else {
			// Middle points with percentage
			keyframes.push(`${value} ${percent}%`);
		}
	});

	return keyframes.join(", ");
}

/**
 * Generates complete CSS animation code snippet
 *
 * @param config - Spring configuration parameters
 * @param duration - Total animation duration in seconds
 * @returns Complete CSS code with animation
 */
export function generateCSSCode(
	config: SpringConfig,
	duration: number,
): string {
	const linearEasing = generateLinearEasing(config, duration);
	const durationMs = Math.round(duration * 1000);

	return `/* Spring Animation */
animation: slide ${durationMs}ms linear(${linearEasing}) forwards;`;
}

/**
 * Generates SVG path for visualizing the spring curve
 *
 * @param config - Spring configuration parameters
 * @param duration - Total animation duration in seconds
 * @param width - SVG width in pixels
 * @param height - SVG height in pixels
 * @returns SVG path data string
 */
export function generateSpringCurvePathData(
	config: SpringConfig,
	duration: number,
	width = 500,
	height = 300,
): string {
	const frames = generateSpringFrames(config, duration, 200);
	const values = frames.map((f) => f.value);

	// Find min and max values for scaling
	const minValue = Math.min(...values);
	const maxValue = Math.max(...values);

	// Calculate scaling
	const topPadding = 20;
	const bottomPadding = 50;
	const canvasHeight = height - topPadding - bottomPadding;

	const range = maxValue - minValue;
	const scale = range > 0 ? canvasHeight / range : canvasHeight;

	const maxY = height - bottomPadding;

	// Generate path data
	const points = frames.map((frame, index) => {
		const x = frame.time * width;
		const y = maxY - (frame.value - minValue) * scale;
		return `${x} ${y}`;
	});

	return `M${points.join("L")}`;
}

/**
 * Predefined spring presets for common animation types
 */
export const SPRING_PRESETS = {
	/** Gentle, slow spring - good for UI entrance animations */
	gentle: {
		stiffness: 120,
		damping: 30,
		mass: 1,
	},

	/** Standard spring - balanced and natural feeling */
	standard: {
		stiffness: 170,
		damping: 26,
		mass: 1,
	},

	/** Snappy spring - quick and responsive */
	snappy: {
		stiffness: 210,
		damping: 20,
		mass: 1,
	},

	/** Bouncy spring - playful with more oscillation */
	bouncy: {
		stiffness: 180,
		damping: 15,
		mass: 1,
	},

	/** Molasses spring - very damped, slow settling */
	molasses: {
		stiffness: 100,
		damping: 40,
		mass: 1,
	},

	/** Springy - modern, with slight bounce */
	springy: {
		stiffness: 150,
		damping: 20,
		mass: 0.9,
	},
};

/**
 * Analyzes spring behavior to provide descriptive properties
 */
export interface SpringAnalysis {
	dampingType: "underdamped" | "critically_damped" | "overdamped";
	oscillations: number;
	settlingTime: number;
	maxOvershoot: number;
	description: string;
}

/**{}
 * Anal{yzes the given spring confi}guration
 */
export function analyzeSpring(
	config: SpringConfig,
	duration: number,
): SpringAnalysis {
	const omega0 = Math.sqrt(config.stiffness / config.mass);
	const dampingRatio =
		config.damping / (2 * Math.sqrt(config.stiffness * config.mass));

	let dampingType: "underdamped" | "critically_damped" | "overdamped";
	if (dampingRatio < 1) {
		dampingType = "underdamped";
	} else if (dampingRatio === 1) {
		dampingType = "critically_damped";
	} else {
		dampingType = "overdamped";
	}

	// Count oscillations
	let oscillations = 0;
	if (dampingType === "underdamped") {
		const omegad = omega0 * Math.sqrt(1 - dampingRatio * dampingRatio);
		oscillations = Math.floor((duration * omegad) / (2 * Math.PI));
	}

	// Calculate settling time (99% of final value)
	let settlingTime = 0;
	for (let t = 0; t <= duration; t += 0.01) {
		const value = calculateSpringValue(
			t / duration,
			config.stiffness,
			config.damping,
			config.mass,
			duration,
		);
		if (value >= 0.99) {
			settlingTime = t;
			break;
		}
	}

	// Find maximum overshoot
	let maxOvershoot = 0;
	const frames = generateSpringFrames(config, duration, 1000);
	// biome-ignore lint/complexity/noForEach: <explanation>
	frames.forEach((frame) => {
		if (frame.value > 1) {
			maxOvershoot = Math.max(maxOvershoot, (frame.value - 1) * 100);
		}
	});

	let description = "";
	if (dampingType === "underdamped") {
		description = `Underdamped spring with ${oscillations} oscillations and ${maxOvershoot.toFixed(1)}% overshoot. Natural and energetic.`;
	} else if (dampingType === "critically_damped") {
		description =
			"Critically damped spring. Settles quickly without overshoot.";
	} else {
		description = "Overdamped spring. Smooth but slower settling time.";
	}

	return {
		dampingType,
		oscillations,
		settlingTime,
		maxOvershoot,
		description,
	};
}
