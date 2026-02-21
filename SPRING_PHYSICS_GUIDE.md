# Spring Physics Engine Documentation

## Overview

The **CSS Ease Generator** now includes a professional-grade **spring physics engine** based on the damped harmonic oscillator model. This is the same physics model used by industry-leading animation libraries like **React Spring**, **Framer Motion**, and **Anime.js**.

## What is Spring Physics?

Spring physics simulates the motion of a mass attached to a spring with damping. Unlike traditional easing functions (cubic-bezier), spring animations feel **natural and organic** because they mimic real-world physics.

### Key Advantages:
- ✨ **Natural motion** - feels alive and responds to physics
- 🎯 **Predictable behavior** - based on real physics equations
- 🎨 **Beautiful oscillation** - controlled bounce and overshoot
- ⚡ **Responsive animations** - can be interrupted and redirected
- 📊 **Measurable properties** - understand settling time, overshoot, oscillations

## Core Parameters

### 1. **Stiffness** (k)
- **Range:** 50 - 500
- **Default:** 170
- **Effect:** Controls how tightly the spring pulls the object back
- **Higher values** = Tighter spring, faster response, more oscillations
- **Lower values** = Looser spring, slower response, smoother settling

### 2. **Damping** (c)
- **Range:** 5 - 100
- **Default:** 26
- **Effect:** Controls resistance to motion (friction)
- **Higher values** = More resistance, quicker settling, no bounce
- **Lower values** = Less resistance, more bounce and oscillation

### 3. **Mass** (m)
- **Range:** 0.1 - 5
- **Default:** 1
- **Effect:** Controls the inertia of the animated object
- **Higher values** = More momentum, slower acceleration, longer settling
- **Lower values** = Quick acceleration, shorter settling, snappy feel

## Physics Equations

The engine uses the **second-order linear differential equation** for damped harmonic motion:

```
m·d²x/dt² + c·dx/dt + k·x = 0
```

**Solution (underdamped case):**
```
x(t) = 1 - e^(-ζω₀t)[cos(ωdt) + (ζω₀/ωd)sin(ωdt)]

Where:
  ω₀ = √(k/m)           — Natural frequency
  ζ = c / (2√(km))       — Damping ratio
  ωd = ω₀√(1 - ζ²)      — Damped frequency
```

## Damping Ratios and Behavior

| Damping Ratio (ζ) | Type | Behavior | Use Case |
|---|---|---|---|
| **ζ < 1** | Underdamped | Oscillates, bounces, overshoots | Snappy, playful animations |
| **ζ = 1** | Critically Damped | No bounce, fastest settling | Smooth, professional feel |
| **ζ > 1** | Overdamped | Slow, no oscillation | Gentle, smooth transitions |

## Using Spring Physics in Your Code

### In the Extension UI

1. Open the **CSS Ease Generator** extension in VS Code
2. Click the **Spring Editor** tab
3. Adjust the three sliders:
   - **Stiffness:** Control response tightness
   - **Damping:** Control bounce amount
   - **Mass:** Control momentum
4. See the live preview of your spring animation
5. Copy the generated CSS to your clipboard

### Programmatically (TypeScript/JavaScript)

```typescript
import {
  calculateSpringValue,
  generateSpringFrames,
  generateLinearEasing,
  generateCSSCode,
  SPRING_PRESETS,
  analyzeSpring
} from './spring-physics';

// Option 1: Use a preset
const config = SPRING_PRESETS.snappy;

// Option 2: Custom configuration
const config = {
  stiffness: 200,
  damping: 20,
  mass: 1
};

const duration = 1.5; // seconds

// Get CSS easing function
const linearEasing = generateLinearEasing(config, duration);
const cssCode = generateCSSCode(config, duration);

console.log(cssCode);
// Output: animation: slide 1500ms linear(...) forwards;

// Analyze spring behavior
const analysis = analyzeSpring(config, duration);
console.log(analysis.description);
// "Underdamped spring with 2 oscillations and 8.5% overshoot. Natural and energetic."

// Get individual frame values
const frames = generateSpringFrames(config, duration, 100);
frames.forEach(frame => {
  console.log(`t=${frame.time.toFixed(2)} → value=${frame.value.toFixed(4)}`);
});
```

## Spring Presets

Ready-made configurations for common use cases:

### **Gentle** (stiffness: 120, damping: 30, mass: 1)
- Soft, slow spring
- Perfect for UI entrance animations
- Minimal bounce

### **Standard** (stiffness: 170, damping: 26, mass: 1)
- Balanced and natural
- Default recommendation
- Light bounce

### **Snappy** (stiffness: 210, damping: 20, mass: 1)
- Quick and responsive
- Great for interactive elements
- Moderate bounce

### **Bouncy** (stiffness: 180, damping: 15, mass: 1)
- Playful with visible oscillation
- Perfect for attention-grabbing animations
- Multiple bounces

### **Molasses** (stiffness: 100, damping: 40, mass: 1)
- Very damped and slow
- For smooth, elegant transitions
- No bounce

### **Springy** (stiffness: 150, damping: 20, mass: 0.9)
- Modern with slight bounce
- Good for drag-and-drop animations
- Quick settling

## CSS Output Format

The engine generates **CSS `linear()` easing functions** that work in all modern browsers:

```css
/* Example output */
animation: slide 1500ms linear(
  0 0%,
  0.3542 5%,
  0.6234 10%,
  0.8156 15%,
  /* ... more points ... */
  1
) forwards;
```

This format allows for precise frame-by-frame control of your animation values.

## Practical Examples

### Example 1: Smooth Modal Entrance
```typescript
const config = SPRING_PRESETS.gentle;
const css = generateCSSCode(config, 0.8);

// Apply to modal:
// transform: translateY(0) scale(1);
// animation: [generated animation]
```

### Example 2: Button Click Response
```typescript
const config = SPRING_PRESETS.snappy;
const css = generateCSSCode(config, 0.4);

// Apply to button scale animation
```

### Example 3: Draggable Element
```typescript
const config = {
  stiffness: 200,
  damping: 18,
  mass: 0.8
};
const css = generateCSSCode(config, 0.6);

// Apply when user releases the element
```

## Understanding the Visualization

The spring editor displays:

- **X-axis:** Time (0 to duration)
- **Y-axis:** Animation progress (0 to 1, with overshoot)
- **Red curve:** Your spring animation profile
- **Vertical line:** Settling threshold (99% of final value)

### What to Look For:
- **Smooth curve:** Balanced stiffness and damping
- **Visible oscillations:** Underdamped (bouncy)
- **S-curve shape:** Overdamped (smooth, no bounce)
- **Overshoots above 1.0:** Underdamped behavior

## Performance Considerations

- **Number of keyframes:** 100-200 keyframes for smooth animations
- **Browser support:** All modern browsers support `linear()` easing
- **Animation FPS:** Smooth at 60fps on mobile devices
- **CPU usage:** Minimal; animation runs on GPU

## Advanced: Custom Curve Generation

```typescript
// Get raw frame data for custom processing
const frames = generateSpringFrames(
  { stiffness: 200, damping: 20, mass: 1 },
  1.5,                           // duration
  500                            // 500 samples/second for ultra-smooth
);

// Convert to other formats (WebGL, Canvas, etc.)
frames.forEach(frame => {
  const x = frame.time;
  const y = frame.value;
  // Use x, y for custom rendering
});
```

## Comparison: Spring vs. Cubic-Bezier

| Aspect | Spring Physics | Cubic-Bezier |
|---|---|---|
| **Feel** | Natural, organic | Static, predetermined |
| **Bounce** | Natural overshoot | Manual overshoot handling |
| **Control** | Physics-based (intuitive) | Curve-based (unintuitive) |
| **Interruptibility** | Easy to redirect | Must restart |
| **Browser Support** | ✅ All modern browsers | ✅ All browsers |
| **Performance** | ✅ Identical | ✅ Identical |

## Tips and Best Practices

1. **Start with presets** - they're designed for common use cases
2. **Adjust mass for feel** - lower mass = snappier, higher mass = more momentum
3. **Balance stiffness and damping** - too stiff = harsh, too damped = sluggish
4. **Test on mobile** - ensure animations feel good on touch devices
5. **Use consistent durations** - 0.3-0.6s for micro-interactions, 0.8-1.2s for transitions
6. **Preview before shipping** - the live preview helps validate the feel

## Troubleshooting

### Animation feels sluggish
- ↑ Increase stiffness
- ↓ Decrease damping
- ↓ Decrease mass

### Animation feels too jerky
- ↓ Decrease stiffness
- ↑ Increase damping
- ↑ Increase mass

### Too much bounce
- ↑ Increase damping
- ↓ Decrease mass

### No bounce at all
- ↓ Decrease damping (below 26)
- ↑ Decrease mass

## Resources & References

- [React Spring Documentation](https://www.react-spring.io/)
- [Framer Motion - Layout Animations](https://www.framer.com/)
- [Anime.js](https://animejs.com/)
- [Wikipedia: Damping](https://en.wikipedia.org/wiki/Damping_ratio)

---

**Made with ❤️ for web developers who care about animation quality.**
