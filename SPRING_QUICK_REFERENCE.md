# Spring Physics Quick Reference

## Getting Started

### Use Presets in the UI
1. Open CSS Ease Generator → Spring Editor
2. Click any preset button (Gentle, Standard, Snappy, Bouncy, Molasses, Springy)
3. See real-time preview and spring analysis
4. Copy CSS or export configuration

### Spring Presets Overview

| Preset | Feel | Best For | Stiffness | Damping | Mass |
|--------|------|----------|-----------|---------|------|
| **Gentle** | Soft, smooth | UI transitions | 120 | 30 | 1.0 |
| **Standard** | Balanced, natural | General animations | 170 | 26 | 1.0 |
| **Snappy** | Quick, responsive | Interactive elements | 210 | 20 | 1.0 |
| **Bouncy** | Playful, lively | Attention-grabbing | 180 | 15 | 1.0 |
| **Molasses** | Smooth, elegant | Gentle transitions | 100 | 40 | 1.0 |
| **Springy** | Modern, dynamic | Drag interactions | 150 | 20 | 0.9 |

## Parameter Tuning Guide

### Stiffness (k)
- **Range**: 50-500
- **Default**: 170 (standard preset)
- **↑ Increase**: Tighter spring, faster response, more oscillations
- **↓ Decrease**: Looser spring, slower response, smoother feel
- **Tip**: Start at 170, adjust ±30-50 for different feels

### Damping (c)
- **Range**: 5-100
- **Default**: 26 (standard preset)
- **↑ Increase**: More resistance, quicker settling, less bounce
- **↓ Decrease**: Less resistance, more bounce, more oscillations
- **Tip**: Values 15-30 give natural motion; >40 is very smooth

### Mass (m)
- **Range**: 0.1-5
- **Default**: 1.0
- **↑ Increase**: More momentum, slower settling, heavier feel
- **↓ Decrease**: Quick acceleration, snappy response, light feel
- **Tip**: Most animations work well with 0.8-1.2

## Spring Analysis Display

### Damping Type
- **Underdamped** (ζ < 1): Oscillates with overshoot - most animations
- **Critically Damped** (ζ ≈ 1): No overshoot, fastest settling
- **Overdamped** (ζ > 1): Smooth, slow settling

### Key Metrics
- **Oscillations**: Number of bounces before settling
- **Settling Time**: Time to reach 99% of final value
- **Max Overshoot**: Maximum percentage above target (100% = no overshoot)

## Usage Examples

### Quick: Use Presets
```javascript
// Spring Editor UI → Click "Snappy" preset
// Copy CSS → Use in your animation
animation: slide 800ms linear(...) forwards;
```

### Custom: Adjust Parameters
```javascript
// Spring Editor UI
// Drag sliders to customize feel
// Real-time preview shows results
// Export JSON config for later
```

### Code: Programmatic Usage
```typescript
import {
  generateCSSCode,
  SPRING_PRESETS,
  analyzeSpring
} from './spring-physics';

// Use preset
const css = generateCSSCode(SPRING_PRESETS.snappy, 1);

// Or custom
const config = {
  stiffness: 200,
  damping: 18,
  mass: 0.9
};
const css = generateCSSCode(config, 1);

// Analyze
const analysis = analyzeSpring(config, 1);
console.log(analysis.description);
// "Underdamped spring with 2 oscillations and 8.5% overshoot..."
```

## Common Animations

### Button Click (Quick Feedback)
```
Preset: Snappy
Duration: 0.4s
Effect: Scale transform with quick spring-back
```

### Modal Entrance (Smooth, Natural)
```
Preset: Gentle
Duration: 0.8s
Effect: Subtle bounce creates pleasant entrance
```

### Drag Release (Dynamic, Responsive)
```
Preset: Springy
Duration: 0.6s
Effect: Good momentum with quick settling
```

### Smooth Transition (Professional)
```
Preset: Molasses
Duration: 1.0s
Effect: Very smooth, no visible bounce
```

## Tips & Tricks

1. **Live Preview**: Watch the preview animation update in real-time as you adjust
2. **Export Config**: Save custom presets as JSON for reuse across projects
3. **Spring Analysis**: Check oscillation count and settling time for performance
4. **Keyboard Navigation**: Arrow keys fine-tune slider values (±1 or ±10)
5. **Copy Formats**: CSS ready to paste directly into stylesheets

## Performance Considerations

- Spring animations run at 60fps smoothly
- Generated CSS uses `linear()` easing - works in all modern browsers
- Settle time typically 0.5-2s depending on config
- Low: <0.5s (Snappy, Springy)
- Medium: 0.5-1s (Standard, Gentle)
- High: >1s (Molasses, custom low-damping)

## Troubleshooting

### Animation too slow?
- ↑ Increase Stiffness
- ↓ Decrease Damping
- ↓ Decrease Mass

### Animation too fast/harsh?
- ↓ Decrease Stiffness
- ↑ Increase Damping
- ↑ Increase Mass

### Too much bounce?
- ↓ Decrease Mass (0.7-0.8)
- ↓ Decrease Stiffness (150-180)
- ↑ Increase Damping (30-35)

### Not enough bounce?
- ↑ Decrease Damping (15-20)
- ↑ Increase Stiffness (200+)
- ↓ Decrease Mass (0.7-0.9)

## Resources

- [Spring Physics Guide](./SPRING_PHYSICS_GUIDE.md) - Detailed documentation
- [React Spring](https://www.react-spring.io/) - Inspiration for physics model
- [Framer Motion](https://www.framer.com/) - Industry reference implementation
- [Wikipedia: Damping Ratio](https://en.wikipedia.org/wiki/Damping_ratio) - Physics background
