<div align="center">

<!-- ═══════════════════════════════════════════════════════════════════════
     HERO — Custom inline SVG logo + animated bezier curve illustration
     ═══════════════════════════════════════════════════════════════════════ -->

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="680" height="180" viewBox="0 0 680 180" fill="none">
  <!-- Background pill -->
  <rect x="0" y="0" rx="24" ry="24" width="680" height="180" fill="#18181B"/>
  <!-- Decorative bezier curve -->
  <path d="M 40 140 C 40 40, 160 40, 200 80 S 320 160, 400 80 S 520 0, 640 80" stroke="url(#heroGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Control-point dots -->
  <circle cx="40" cy="140" r="5" fill="#A78BFA"/>
  <circle cx="200" cy="80" r="5" fill="#34D399"/>
  <circle cx="400" cy="80" r="5" fill="#60A5FA"/>
  <circle cx="640" cy="80" r="5" fill="#FBBF24"/>
  <!-- Dashed guide lines -->
  <line x1="40" y1="140" x2="160" y2="40" stroke="#A78BFA" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  <line x1="200" y1="80" x2="320" y2="160" stroke="#34D399" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  <line x1="400" y1="80" x2="520" y2="0" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  <!-- Title text -->
  <text x="340" y="60" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="38" fill="white" letter-spacing="-1">Motion</text>
  <text x="340" y="88" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-weight="400" font-size="14" fill="#A1A1AA" letter-spacing="4">CSS ANIMATION EDITOR</text>
  <!-- VS Code badge -->
  <rect x="264" y="108" rx="12" ry="12" width="152" height="26" fill="#27272A"/>
  <text x="340" y="126" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-weight="600" font-size="12" fill="#A78BFA">&#9670;  Built for VS Code</text>
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="33%" stop-color="#34D399"/>
      <stop offset="66%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
</svg>

<br/>

<!-- Tagline -->
<p>
  <strong>Visually design CSS animations and generate production-ready code — right inside your editor.</strong><br/>
  <sub>Cubic-bezier curves · Spring physics · Scroll-driven ranges · SVG path references</sub>
</p>

<!-- Badges -->
<p>
  <a href="https://marketplace.visualstudio.com/items?itemName=BaZz.motion-graph-edictor"><img alt="VS Code Marketplace" src="https://img.shields.io/badge/Marketplace-Install%20Now-A78BFA?style=for-the-badge&logo=visualstudiocode&logoColor=white"/></a>
  &nbsp;
  <img alt="Version" src="https://img.shields.io/badge/v0.0.6-18181B?style=for-the-badge"/>
  &nbsp;
  <img alt="License" src="https://img.shields.io/badge/MIT-18181B?style=for-the-badge"/>
</p>

</div>

<br/>

<!-- ═══════════════════════════════════════════════════════════════════════
     FEATURE CARDS — 4 inline SVG icon-cards in a table
     ═══════════════════════════════════════════════════════════════════════ -->

<table width="100%">
<tr>

<td align="center" width="25%" valign="top">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="18" fill="#2D2140"/>
  <path d="M 16 64 C 16 20, 40 20, 64 16" stroke="#A78BFA" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="16" y1="64" x2="40" y2="20" stroke="#A78BFA" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.5"/>
  <line x1="64" y1="16" x2="40" y2="20" stroke="#A78BFA" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.5"/>
  <circle cx="16" cy="64" r="4" fill="#A78BFA"/>
  <circle cx="40" cy="20" r="5" fill="#C4B5FD" stroke="#A78BFA" stroke-width="2"/>
  <circle cx="64" cy="16" r="4" fill="#A78BFA"/>
</svg>

<br/>

**Easing Curves**<br/>
<sub>Drag control points to sculpt<br/><code>cubic-bezier()</code> timing functions</sub>

<br/><br/>

</td>

<td align="center" width="25%" valign="top">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="18" fill="#14312A"/>
  <!-- Spring oscillation curve -->
  <path d="M 12 56 Q 20 10, 28 40 Q 36 70, 44 36 Q 50 14, 56 40 Q 60 54, 64 40 Q 67 32, 70 40" stroke="#34D399" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Settling line -->
  <line x1="12" y1="40" x2="72" y2="40" stroke="#34D399" stroke-width="1" stroke-dasharray="2 3" opacity="0.35"/>
  <circle cx="12" cy="56" r="3.5" fill="#34D399"/>
  <circle cx="70" cy="40" r="3.5" fill="#34D399"/>
</svg>

<br/>

**Spring Physics**<br/>
<sub>Tune stiffness, damping & mass<br/>for <code>linear()</code> easing output</sub>

<br/><br/>

</td>

<td align="center" width="25%" valign="top">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="18" fill="#172554"/>
  <!-- Scroll viewport -->
  <rect x="20" y="14" width="40" height="52" rx="6" stroke="#60A5FA" stroke-width="2" fill="none" opacity="0.5"/>
  <!-- Animated element -->
  <rect x="28" y="34" width="24" height="12" rx="3" fill="#60A5FA" opacity="0.9"/>
  <!-- Scroll track -->
  <rect x="64" y="18" width="4" height="44" rx="2" fill="#1E3A5F"/>
  <!-- Scroll thumb -->
  <rect x="64" y="30" width="4" height="14" rx="2" fill="#60A5FA"/>
  <!-- Range arrows -->
  <path d="M 14 24 L 14 56" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <path d="M 12 28 L 14 24 L 16 28" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M 12 52 L 14 56 L 16 52" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>

<br/>

**Scroll-Driven**<br/>
<sub>Configure <code>animation-timeline</code><br/>&amp; <code>animation-range</code> visually</sub>

<br/><br/>

</td>

<td align="center" width="25%" valign="top">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="18" fill="#362310"/>
  <!-- Document icon -->
  <rect x="20" y="12" width="40" height="50" rx="5" stroke="#FBBF24" stroke-width="2" fill="none" opacity="0.5"/>
  <!-- Text lines -->
  <line x1="28" y1="26" x2="52" y2="26" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <line x1="28" y1="34" x2="46" y2="34" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
  <line x1="28" y1="42" x2="50" y2="42" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <line x1="28" y1="50" x2="40" y2="50" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
  <!-- Bookmark -->
  <path d="M 48 12 L 48 22 L 52 19 L 56 22 L 56 12" fill="#FBBF24" opacity="0.8"/>
</svg>

<br/>

**Cheat Sheets**<br/>
<sub>SVG path &amp; scroll animation<br/>quick-reference panels</sub>

<br/><br/>

</td>

</tr>
</table>

<br/>

<!-- ═══════════════════════════════════════════════════════════════════════
     QUICK START — Clean numbered steps with inline SVG step badges
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FBBF24"/>
</svg>
&nbsp;Quick Start
</h2>

> **1** &nbsp; Install **Motion** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=BaZz.motion-graph-edictor)
>
> **2** &nbsp; Click the <kbd>Motion</kbd> icon in the **Activity Bar**
>
> **3** &nbsp; Pick a tab — **Easing** · **Spring** · **Scroll**
>
> **4** &nbsp; Design your animation visually
>
> **5** &nbsp; Copy the generated CSS into your project

<sub>💡 Open cheat sheets anytime via the Command Palette (<kbd>⌘ Shift P</kbd> / <kbd>Ctrl Shift P</kbd>)</sub>

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     FEATURES — Expanded cards with inline SVG illustrations
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <rect x="3" y="3" width="7" height="7" rx="2" fill="#A78BFA"/>
  <rect x="14" y="3" width="7" height="7" rx="2" fill="#34D399"/>
  <rect x="3" y="14" width="7" height="7" rx="2" fill="#60A5FA"/>
  <rect x="14" y="14" width="7" height="7" rx="2" fill="#FBBF24"/>
</svg>
&nbsp;Features
</h2>

<details open>
<summary>&nbsp;🟣 &nbsp;<strong>Cubic-Bezier Easing Editor</strong></summary>

<br/>

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="200" viewBox="0 0 460 200" fill="none">
  <rect width="460" height="200" rx="16" fill="#18181B"/>
  <!-- Grid -->
  <line x1="40" y1="20" x2="40" y2="180" stroke="#27272A" stroke-width="1"/>
  <line x1="40" y1="180" x2="260" y2="180" stroke="#27272A" stroke-width="1"/>
  <line x1="150" y1="20" x2="150" y2="180" stroke="#27272A" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.3"/>
  <line x1="40" y1="100" x2="260" y2="100" stroke="#27272A" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.3"/>
  <!-- Bezier curve -->
  <path d="M 40 180 C 95 30, 205 170, 260 20" stroke="#A78BFA" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Control handles -->
  <line x1="40" y1="180" x2="95" y2="30" stroke="#A78BFA" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
  <line x1="260" y1="20" x2="205" y2="170" stroke="#A78BFA" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
  <circle cx="95" cy="30" r="6" fill="#18181B" stroke="#C4B5FD" stroke-width="2.5"/>
  <circle cx="205" cy="170" r="6" fill="#18181B" stroke="#C4B5FD" stroke-width="2.5"/>
  <circle cx="40" cy="180" r="4" fill="#A78BFA"/>
  <circle cx="260" cy="20" r="4" fill="#A78BFA"/>
  <!-- Axis labels -->
  <text x="40" y="196" font-family="monospace" font-size="10" fill="#52525B">0</text>
  <text x="256" y="196" font-family="monospace" font-size="10" fill="#52525B">1</text>
  <text x="24" y="24" font-family="monospace" font-size="10" fill="#52525B">1</text>
  <!-- Output box -->
  <rect x="290" y="40" rx="10" ry="10" width="150" height="120" fill="#27272A"/>
  <text x="310" y="66" font-family="monospace" font-size="10" fill="#71717A">Output</text>
  <text x="310" y="88" font-family="monospace" font-size="11" fill="#E4E4E7">cubic-bezier(</text>
  <text x="316" y="104" font-family="monospace" font-size="12" fill="#A78BFA" font-weight="bold">0.25, 0.1,</text>
  <text x="316" y="120" font-family="monospace" font-size="12" fill="#A78BFA" font-weight="bold">0.25, 1.0</text>
  <text x="310" y="136" font-family="monospace" font-size="11" fill="#E4E4E7">)</text>
  <!-- Copy button -->
  <rect x="310" y="142" rx="6" width="60" height="20" fill="#A78BFA" opacity="0.15"/>
  <text x="326" y="156" font-family="sans-serif" font-size="10" fill="#A78BFA" font-weight="600">Copy</text>
</svg>
</div>

<br/>

| Capability | Description |
|:---|:---|
| **Drag-to-edit** | Shape `cubic-bezier()` values by moving control points in real time |
| **Live preview** | See exactly how your easing affects motion on an animated element |
| **One-click copy** | Grab `cubic-bezier(x1, y1, x2, y2)` to clipboard instantly |
| **Grid overlay** | Labeled coordinate system for precise point positioning |

```css
/* Example output */
transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1.0);
```

</details>

<details>
<summary>&nbsp;🟢 &nbsp;<strong>Spring Physics Engine</strong></summary>

<br/>

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="200" viewBox="0 0 460 200" fill="none">
  <rect width="460" height="200" rx="16" fill="#18181B"/>
  <!-- Grid -->
  <line x1="40" y1="20" x2="40" y2="180" stroke="#27272A" stroke-width="1"/>
  <line x1="40" y1="180" x2="420" y2="180" stroke="#27272A" stroke-width="1"/>
  <!-- Settling line at y=70 (target = 1.0) -->
  <line x1="40" y1="70" x2="420" y2="70" stroke="#34D399" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
  <text x="424" y="74" font-family="monospace" font-size="9" fill="#34D399" opacity="0.5">1.0</text>
  <!-- Spring curve: starts at bottom, overshoots, oscillates, settles -->
  <path d="M 40 180 C 60 180, 80 40, 120 50 S 155 110, 175 70 S 200 42, 230 65 S 260 84, 280 72 S 305 62, 330 70 S 360 74, 420 70" stroke="#34D399" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="180" r="4" fill="#34D399"/>
  <circle cx="420" cy="70" r="4" fill="#34D399"/>
  <!-- Overshoot annotation -->
  <line x1="120" y1="50" x2="120" y2="70" stroke="#FBBF24" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
  <text x="108" y="44" font-family="monospace" font-size="8" fill="#FBBF24" opacity="0.6">overshoot</text>
  <!-- Labels -->
  <text x="40" y="196" font-family="monospace" font-size="10" fill="#52525B">0s</text>
  <text x="410" y="196" font-family="monospace" font-size="10" fill="#52525B">1.5s</text>
</svg>
</div>

<br/>

Physics-based CSS animations powered by a professional **damped harmonic oscillator** — the same model behind React Spring, Framer Motion, and Anime.js.

- **Three core parameters**: Stiffness (50–500) · Damping (5–100) · Mass (0.1–5)
- **Real-time visualization** — see every oscillation and overshoot
- **Analysis panel** — damping type, oscillation count, settling time, overshoot %
- Outputs modern CSS **`linear()`** easing with accurate keyframe sampling

| Preset | Feel | Best For |
|:---|:---|:---|
| **Gentle** | Soft, slow | Page entrances, subtle reveals |
| **Standard** | Balanced | General-purpose UI animations |
| **Snappy** | Quick | Buttons, toggles, interactive elements |
| **Bouncy** | Playful | Attention-grabbing effects, notifications |
| **Molasses** | Smooth | Loading states, background transitions |
| **Springy** | Dynamic | Drag-and-drop, gesture-driven animations |

```css
/* Example output */
transition-timing-function: linear(0, 0.009, 0.037 2.5%, 0.081, ...);
```

</details>

<details>
<summary>&nbsp;🔵 &nbsp;<strong>Scroll-Driven Animation Ranges</strong></summary>

<br/>

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="200" viewBox="0 0 460 200" fill="none">
  <rect width="460" height="200" rx="16" fill="#18181B"/>
  <!-- Viewport frame -->
  <rect x="40" y="20" width="160" height="160" rx="10" stroke="#3B82F6" stroke-width="2" fill="#27272A" opacity="0.6"/>
  <text x="80" y="14" font-family="monospace" font-size="9" fill="#60A5FA">viewport</text>
  <!-- Content elements (faded above/below) -->
  <rect x="60" y="30" width="120" height="18" rx="4" fill="#3F3F46" opacity="0.3"/>
  <rect x="60" y="56" width="120" height="18" rx="4" fill="#3F3F46" opacity="0.3"/>
  <!-- Active animated element -->
  <rect x="60" y="86" width="120" height="24" rx="6" fill="#60A5FA" opacity="0.85"/>
  <text x="90" y="102" font-family="sans-serif" font-size="10" fill="white" font-weight="600">In Range ✓</text>
  <!-- More content -->
  <rect x="60" y="118" width="120" height="18" rx="4" fill="#3F3F46" opacity="0.3"/>
  <rect x="60" y="144" width="120" height="18" rx="4" fill="#3F3F46" opacity="0.3"/>
  <!-- Scroll track -->
  <rect x="212" y="24" width="6" height="152" rx="3" fill="#27272A"/>
  <rect x="212" y="60" width="6" height="50" rx="3" fill="#60A5FA"/>
  <!-- Range bracket -->
  <line x1="240" y1="50" x2="240" y2="150" stroke="#60A5FA" stroke-width="1.5" opacity="0.6"/>
  <line x1="236" y1="50" x2="244" y2="50" stroke="#60A5FA" stroke-width="1.5" opacity="0.6"/>
  <line x1="236" y1="150" x2="244" y2="150" stroke="#60A5FA" stroke-width="1.5" opacity="0.6"/>
  <text x="248" y="104" font-family="monospace" font-size="9" fill="#60A5FA" opacity="0.7">range</text>
  <!-- CSS output box  -->
  <rect x="280" y="40" rx="10" ry="10" width="160" height="120" fill="#27272A"/>
  <text x="298" y="62" font-family="monospace" font-size="10" fill="#71717A">Generated CSS</text>
  <text x="298" y="84" font-family="monospace" font-size="10" fill="#E4E4E7">animation-timeline:</text>
  <text x="306" y="98" font-family="monospace" font-size="11" fill="#60A5FA" font-weight="bold">view();</text>
  <text x="298" y="118" font-family="monospace" font-size="10" fill="#E4E4E7">animation-range:</text>
  <text x="306" y="132" font-family="monospace" font-size="11" fill="#60A5FA" font-weight="bold">entry 0% exit 100%;</text>
</svg>
</div>

<br/>

Visually configure the CSS scroll-driven animations API with a live scrolling preview.

- **Simulated scroll viewport** — scrub through scroll position and watch animations respond
- **Range selectors**: `cover` · `contain` · `entry` · `exit` · `entry-crossing` · `exit-crossing`
- **11 animation effects**: reveal, fade, slide, slide-left, slide-right, rotate, flip, blur, clip-circle, clip-inset, bounce
- **Quick presets**: Full Cover · Entry Only · Exit Only · Contained · Entry 50% · Exit 50%
- **Phase badges**: Before Range → In Range → After Range

```css
/* Example output */
animation-timeline: view();
animation-range: entry 0% exit 100%;
```

</details>

<details>
<summary>&nbsp;🟡 &nbsp;<strong>Built-in Cheat Sheets</strong></summary>

<br/>

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="130" viewBox="0 0 460 130" fill="none">
  <rect width="460" height="130" rx="16" fill="#18181B"/>
  <!-- SVG card -->
  <rect x="30" y="20" rx="10" ry="10" width="190" height="90" fill="#27272A" stroke="#FBBF24" stroke-width="1.5" opacity="0.7"/>
  <text x="62" y="44" font-family="sans-serif" font-size="12" fill="#FBBF24" font-weight="700">SVG Path Commands</text>
  <text x="50" y="64" font-family="monospace" font-size="10" fill="#A1A1AA">M 10 80 L 50 10</text>
  <text x="50" y="78" font-family="monospace" font-size="10" fill="#A1A1AA">C 20 10 40 10 50 80</text>
  <text x="50" y="92" font-family="monospace" font-size="10" fill="#A1A1AA">A 25 25 0 0 1 50 50</text>
  <!-- Scroll card -->
  <rect x="240" y="20" rx="10" ry="10" width="190" height="90" fill="#27272A" stroke="#60A5FA" stroke-width="1.5" opacity="0.7"/>
  <text x="264" y="44" font-family="sans-serif" font-size="12" fill="#60A5FA" font-weight="700">Scroll Animation</text>
  <text x="260" y="64" font-family="monospace" font-size="10" fill="#A1A1AA">animation-timeline</text>
  <text x="260" y="78" font-family="monospace" font-size="10" fill="#A1A1AA">animation-range</text>
  <text x="260" y="92" font-family="monospace" font-size="10" fill="#A1A1AA">view() | scroll()</text>
</svg>
</div>

<br/>

| Cheat Sheet | Description |
|:---|:---|
| **SVG Path Cheat Sheet** | Interactive reference for SVG `<path>` commands (`M`, `L`, `C`, `A`, etc.) |
| **CSS Scroll Animation** | Visual guide to `animation-timeline`, `animation-range`, and scroll-driven properties |

Open either from the **Command Palette** (<kbd>⌘ Shift P</kbd>).

</details>

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     COMMANDS
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <rect x="2" y="4" width="20" height="16" rx="3" fill="#27272A" stroke="#71717A" stroke-width="1.5"/>
  <path d="M6 12l3-3M6 12l3 3" stroke="#A78BFA" stroke-width="2" stroke-linecap="round"/>
  <line x1="13" y1="15" x2="18" y2="15" stroke="#52525B" stroke-width="2" stroke-linecap="round"/>
</svg>
&nbsp;Commands
</h2>

Open the Command Palette (<kbd>⌘ Shift P</kbd> / <kbd>Ctrl Shift P</kbd>):

| Command | Description |
|:---|:---|
| `Motion: SVG Animation Cheat sheet` | Open the SVG path commands reference |
| `Motion: Open CSS Scroll Animation Cheat Sheet` | Open the scroll-driven animation reference |

> The main **Ease Generator** panel is always available via the Activity Bar sidebar icon.

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     USAGE GUIDE
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#27272A" stroke="#71717A" stroke-width="1.5"/>
  <path d="M12 7v5l3 3" stroke="#34D399" stroke-width="2" stroke-linecap="round"/>
</svg>
&nbsp;Usage Guide
</h2>

<details>
<summary>&nbsp;🟣 &nbsp;<strong>Easing Tab — Cubic-Bezier Curves</strong></summary>

1. Open the **Motion Editor** panel from the Activity Bar
2. Click the **Easing** tab
3. Drag the two control points on the canvas to shape your curve
4. Watch the preview animation update in real time
5. Click **Copy** to grab the `cubic-bezier()` value

</details>

<details>
<summary>&nbsp;🟢 &nbsp;<strong>Spring Tab — Physics-Based Animations</strong></summary>

1. Switch to the **Spring** tab
2. Adjust **Duration** and **Bounciness** sliders (or use a preset)
3. Observe the spring curve with oscillations mapped out
4. Review the analysis panel for damping ratio, settling time, etc.
5. Copy the generated `linear()` easing function

</details>

<details>
<summary>&nbsp;🔵 &nbsp;<strong>Scroll Tab — Scroll-Driven Animation Ranges</strong></summary>

1. Switch to the **Scroll** tab
2. Use the scroll position slider to simulate scrolling
3. Select range names (`cover`, `entry`, `exit`, etc.)
4. Adjust start/end percentages to define your animation window
5. Choose an animation effect to preview
6. Copy the `animation-timeline` and `animation-range` CSS output

</details>

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     HOW IT WORKS — Technical deep dive
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <circle cx="12" cy="12" r="9" fill="#27272A" stroke="#71717A" stroke-width="1.5"/>
  <path d="M12 8v4l2.5 2.5" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="12" r="1.5" fill="#FBBF24"/>
</svg>
&nbsp;How It Works
</h2>

<details>
<summary><strong>Cubic-Bezier</strong> — Parametric curve mathematics</summary>

<br/>

Two control points (P1, P2) define a parametric Bézier curve from `(0,0)` to `(1,1)`. Drag points to reshape the curve — the `cubic-bezier(x1, y1, x2, y2)` output updates instantly.

</details>

<details>
<summary><strong>Spring Physics</strong> — Damped harmonic oscillator</summary>

<br/>

$$x(t) = 1 - e^{-\zeta\omega_0 t}\left[\cos(\omega_d t) + \frac{\zeta\omega_0}{\omega_d}\sin(\omega_d t)\right]$$

| Symbol | Meaning |
|:---|:---|
| $\omega_0 = \sqrt{k/m}$ | Natural frequency |
| $\zeta = c/(2\sqrt{km})$ | Damping ratio |
| $\omega_d = \omega_0\sqrt{1-\zeta^2}$ | Damped frequency |

The curve is sampled into keyframes to produce a CSS `linear()` easing function.

</details>

<details>
<summary><strong>Scroll-Driven</strong> — CSS animation-timeline spec</summary>

<br/>

Implements `animation-timeline: view()` and `animation-range`. The editor maps range names (`cover`, `contain`, `entry`, `exit`, `entry-crossing`, `exit-crossing`) and percentage offsets to precise scroll positions, then simulates the animation in a scrollable viewport preview.

</details>

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     API + REQUIREMENTS + DEV
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <rect x="3" y="3" width="18" height="18" rx="4" fill="#27272A" stroke="#71717A" stroke-width="1.5"/>
  <text x="12" y="16" text-anchor="middle" font-family="monospace" font-size="10" fill="#A78BFA" font-weight="bold">{&nbsp;}</text>
</svg>
&nbsp;Programmatic API
</h2>

Import the spring physics engine directly:

```typescript
import {
  calculateSpringValue,
  generateLinearEasing,
  generateCSSCode,
  SPRING_PRESETS,
  analyzeSpring
} from './spring-physics';

const config = SPRING_PRESETS.snappy;
const css    = generateCSSCode(config, 1.5);
const info   = analyzeSpring(config, 1.5);
```

<sub>See [SPRING_PHYSICS_GUIDE.md](./SPRING_PHYSICS_GUIDE.md) and [spring-physics-examples.ts](./src/spring-physics-examples.ts) for full docs.</sub>

<br/>

---

## Requirements

| Dependency | Minimum |
|:---|:---|
| **VS Code** | 1.109.0+ |
| **Browser support** | CSS `linear()` easing &amp; `animation-timeline` |

## Development

```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch mode
# Press F5 in VS Code → launch extension in debug mode
```

<br/>

---

<!-- ═══════════════════════════════════════════════════════════════════════
     RELEASE NOTES — Timeline style
     ═══════════════════════════════════════════════════════════════════════ -->

<h2>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: text-bottom;">
  <path d="M3 6h18M3 12h18M3 18h18" stroke="#71717A" stroke-width="2" stroke-linecap="round"/>
  <circle cx="8" cy="6" r="2" fill="#A78BFA"/>
  <circle cx="14" cy="12" r="2" fill="#34D399"/>
  <circle cx="8" cy="18" r="2" fill="#60A5FA"/>
</svg>
&nbsp;Release Notes
</h2>

<details open>
<summary>&nbsp;&nbsp;<code>0.0.6</code> — Cheat Sheets</summary>

- SVG Path Cheat Sheet — interactive reference opened via Command Palette
- CSS Scroll Animation Cheat Sheet — visual guide opened via Command Palette
- Two new commands added

</details>

<details>
<summary>&nbsp;&nbsp;<code>0.0.5</code> — Scroll-Driven</summary>

- Scroll-driven animation ranges editor with live scroll preview
- 11 animation effect presets
- Quick preset buttons for common ranges

</details>

<details>
<summary>&nbsp;&nbsp;<code>0.0.2</code> — Spring Physics</summary>

- Damped harmonic oscillator engine
- Bounciness slider and spring presets
- Real-time curve visualization and analysis
- CSS `linear()` easing generation

</details>

<details>
<summary>&nbsp;&nbsp;<code>0.0.1</code> — Initial Release</summary>

- Interactive cubic-bezier easing curve editor
- Live preview animation
- Copy to clipboard

</details>

<br/>

---

<div align="center">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60" viewBox="0 0 400 60" fill="none">
  <rect width="400" height="60" rx="14" fill="#18181B"/>
  <text x="200" y="28" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#A1A1AA">Made with ♥ for the CSS animation community</text>
  <text x="200" y="46" text-anchor="middle" font-family="monospace" font-size="11" fill="#52525B">by BaZz · MIT License</text>
</svg>

<br/>

<p>
  <a href="https://github.com/dev-bazz"><img src="https://img.shields.io/badge/GitHub-dev--bazz-18181B?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
  &nbsp;
  <a href="https://github.com/dev-bazz/motion-edictor"><img src="https://img.shields.io/badge/Repo-motion--edictor-18181B?style=flat-square&logo=github&logoColor=white" alt="Repository"/></a>
  &nbsp;
  <a href="https://marketplace.visualstudio.com/items?itemName=BaZz.motion-graph-edictor"><img src="https://img.shields.io/badge/Marketplace-Install-A78BFA?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Marketplace"/></a>
</p>

</div>
