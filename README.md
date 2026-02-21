# CSS Ease Generator

A VS Code extension that helps you generate CSS easing (cubic-bezier) values from an interactive motion editor graph. Visually design your easing curves and instantly get the CSS code.

## Features

- **Interactive Canvas Editor**: Draw and edit easing curves on a canvas
- **Control Points**: Drag control points to adjust your easing curve
- **Live Preview**: See a preview animation using your easing function
- **CSS Output**: Get cubic-bezier values ready for CSS
- **Copy to Clipboard**: One-click copy functionality for generated values
- **Reset Curve**: Quickly reset to default easing values

## Usage

1. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Search for "Open CSS Ease Generator"
3. Click to open the interactive editor
4. Draw your easing curve by dragging the control points on the canvas
5. See the CSS output and preview animation on the right side
6. Click "Copy to Clipboard" to copy the cubic-bezier value

## How It Works

The extension uses cubic-bezier curves with two control points (P1 and P2). The curve starts at (0, 0) and ends at (1, 1).

- **Control Points**: Drag these points to shape your easing curve
- **Grid**: The grid helps you position points precisely
- **Preview**: The animated box on the right shows how your easing affects motion
- **CSS Output**: The cubic-bezier function is updated in real-time

## Requirements

- VS Code 1.109.0 or higher

## Development

To run and test this extension:

1. `npm install` - Install dependencies
2. `npm run compile` - Compile TypeScript
3. Press `F5` in VS Code to launch the extension in debug mode
4. Open the Command Palette and search for "Open CSS Ease Generator"

## Release Notes

### 0.0.1

- Initial release
- Interactive easing curve editor with canvas
- CSS cubic-bezier value generation
- Copy to clipboard functionality
- Live preview animation
- Reset curve functionality
