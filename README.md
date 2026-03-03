# Motion by BaZz — CSS Animation Editor for VS Code

> **The all-in-one visual CSS animation toolkit**: cubic-bezier easing curves, spring physics animations, and scroll-driven animation ranges — right inside VS Code.

![Motion Editor Preview](https://iswwebsitestg.blob.core.windows.net/switchwebsite/interswitch-website-assets/Frame%202%20(1).png)

## What Is Motion?

**Motion** is a VS Code extension that lets you visually design CSS animations and generate production-ready code instantly. No more guessing `cubic-bezier` values or hand-tuning `animation-range` percentages — see exactly what your animation does as you build it.

### Three powerful editors in one extension:

| Editor | What It Does | CSS Output |
|--------|-------------|------------|
| **Easing** | Drag control points to shape cubic-bezier curves | `cubic-bezier(x1, y1, x2, y2)` |
| **Spring** | Tune stiffness, damping & mass for spring physics | `linear()` easing with precise keyframes |
| **Scroll** | Configure scroll-driven animation ranges with live preview | `animation-timeline: view()` + `animation-range` |

---

## Features

### Cubic-Bezier Easing Editor

Design CSS timing functions visually with an interactive curve canvas.

- **Drag-to-edit control points** — shape `cubic-bezier()` values in real time
- **Live animation preview** — see exactly how your easing affects motion
- **One-click copy** — copy `cubic-bezier(x1, y1, x2, y2)` to clipboard instantly
- **Grid overlay** — position points precisely on a labeled coordinate system

**Ideal for**: CSS `transition-timing-function`, `animation-timing-function`, custom easing for any CSS animation.

### Spring Physics Engine

Create natural, physics-based CSS animations using a professional damped harmonic oscillator model — the same engine behind React Spring, Framer Motion, and Anime.js.

- **Three core parameters**: Stiffness (50-500), Damping (5-100), Mass (0.1-5)
- **Built-in presets**: Gentle, Standard, Snappy, Bouncy, Molasses, Springy
- **Real-time spring curve visualization** — see every oscillation and overshoot
- **Spring analysis panel** — damping type, oscillation count, settling time, overshoot percentage
- **Generates modern CSS `linear()` easing** with accurate keyframe sampling

**Ideal for**: UI entrance animations, modal transitions, drag-and-drop interactions, playful bounce effects, responsive micro-interactions.

### Scroll-Driven Animation Ranges Editor

Visually configure the new CSS scroll-driven animations API (`animation-timeline` + `animation-range`) with a live scrolling preview.

- **Simulated scroll viewport** — scrub through scroll position and watch animations respond
- **Range name selectors**: `cover`, `contain`, `entry`, `exit`, `entry-crossing`, `exit-crossing`
- **Adjustable start/end percentages** — fine-tune exactly when animations begin and end
- **Animation effects**: reveal, fade, slide, slide-left, slide-right, rotate, flip, blur, clip-circle, clip-inset, bounce
- **Quick presets**: Full Cover, Entry Only, Exit Only, Contained, Entry 50%, Exit 50%
- **Live CSS output**: generates `animation-timeline: view()` and `animation-range` declarations
- **State indicators**: Before Range → In Range → After Range phase badges

**Ideal for**: scroll-triggered animations, parallax effects, reveal-on-scroll, progress-based animations, modern CSS-only scroll interactions.

---

## Quick Start

1. **Install** the extension from the VS Code Marketplace
2. **Open** the Motion Editor from the sidebar (Activity Bar icon)
3. **Choose a tab**: Easing, Spring, or Scroll
4. **Design** your animation visually
5. **Copy** the generated CSS code

---

## Usage Guide

### Easing Tab — Cubic-Bezier Curves

1. Open the Motion Editor panel from the Activity Bar
2. Click the **Easing** tab
3. Drag the two control points on the canvas to shape your curve
4. Watch the preview animation update in real time
5. Click **Copy** to grab the `cubic-bezier()` value

### Spring Tab — Physics-Based Animations

1. Switch to the **Spring** tab
2. Adjust **Duration** and **Bounciness** sliders (or use a preset)
3. Observe the spring curve update with oscillations mapped out
4. Review the analysis panel for damping ratio, settling time, etc.
5. Copy the generated `linear()` easing function into your CSS

### Scroll Tab — Scroll-Driven Animation Ranges

1. Switch to the **Scroll** tab
2. Use the scroll position slider to simulate scrolling
3. Select range start/end names (`cover`, `entry`, `exit`, etc.)
4. Adjust start/end percentages to define your animation window
5. Choose an animation effect to preview (fade, slide, reveal, etc.)
6. Copy the `animation-timeline` and `animation-range` CSS output

---

## Spring Physics Presets

| Preset | Feel | Best For |
|--------|------|----------|
| **Gentle** | Soft, slow | Page entrance animations, subtle reveals |
| **Standard** | Balanced, natural | General-purpose UI animations |
| **Snappy** | Quick, responsive | Buttons, toggles, interactive elements |
| **Bouncy** | Playful, lively | Attention-grabbing effects, notifications |
| **Molasses** | Smooth, elegant | Smooth transitions, loading states |
| **Springy** | Modern, dynamic | Drag-and-drop, gesture-driven animations |

---

## How It Works

### Cubic-Bezier

Uses two control points (P1, P2) defining a parametric Bézier curve from (0, 0) to (1, 1). Drag points to reshape the curve — the `cubic-bezier(x1, y1, x2, y2)` output updates instantly.

### Spring Physics

Implements the **damped harmonic oscillator** model:

```
x(t) = 1 - e^(-ζω₀t)[cos(ωdt) + (ζω₀/ωd)sin(ωdt)]
```

Where:
- **ω₀** = √(k/m) — Natural frequency
- **ζ** = c/(2√(km)) — Damping ratio
- **ωd** = ω₀√(1-ζ²) — Damped frequency

The resulting curve is sampled into keyframes to produce a CSS `linear()` easing function. This is the same physics engine used by React Spring, Framer Motion, and Anime.js.

### Scroll-Driven Animation Ranges

Implements the CSS `animation-timeline: view()` and `animation-range` specifications. The editor maps range names (`cover`, `contain`, `entry`, `exit`, `entry-crossing`, `exit-crossing`) and percentage offsets to precise scroll positions, then simulates the animation in a scrollable viewport preview.

---

## Programmatic API

Import the spring physics engine directly in TypeScript/JavaScript:

```typescript
import {
  calculateSpringValue,
  generateLinearEasing,
  generateCSSCode,
  SPRING_PRESETS,
  analyzeSpring
} from './spring-physics';

const config = SPRING_PRESETS.snappy;
const css = generateCSSCode(config, 1.5);
const analysis = analyzeSpring(config, 1.5);
```

See [SPRING_PHYSICS_GUIDE.md](./SPRING_PHYSICS_GUIDE.md) and [spring-physics-examples.ts](./src/spring-physics-examples.ts) for full documentation.

---

## Requirements

- VS Code 1.109.0 or higher
- Modern browser with support for CSS `linear()` easing (for spring output) and `animation-timeline` (for scroll-driven output)

## Development

```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch mode
# Press F5 in VS Code to launch the extension in debug mode
```

---

## Release Notes

### 0.0.5
- Scroll-driven animation ranges editor with live scroll preview
- Animation effect presets (reveal, fade, slide, rotate, flip, blur, clip, bounce)
- Quick preset buttons for common scroll-driven ranges
- Improved visibility and readability across the Ranges tab

### 0.0.2
- Spring physics engine with damped harmonic oscillator model
- Bounciness slider and spring preset configurations
- Real-time spring curve visualization and analysis
- CSS `linear()` easing generation
- Sidebar-only extension layout

### 0.0.1
- Initial release
- Interactive cubic-bezier easing curve editor
- Live preview animation
- Copy to clipboard

---

**Publisher**: [BaZz](https://github.com/dev-bazz) | **Repository**: [github.com/dev-bazz/motion-edictor](https://github.com/dev-bazz/motion-edictor)
