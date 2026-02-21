# CSS Ease Generator VS Code Extension

## Project Overview
This VS Code extension helps users generate CSS ease (easing) values from a motion editor graph. Users can visually design easing curves in a graph editor and export them as CSS cubic-bezier values.

## Key Features (To Be Implemented)
1. **Motion Editor Webview**: Interactive canvas-based graph editor for drawing easing curves
2. **Curve Analysis**: Convert visual curves to cubic-bezier values
3. **CSS Export**: Generate ready-to-use CSS code snippets
4. **Copy to Clipboard**: Quick copy functionality for generated values

## Development Notes
- Extension Type: TypeScript
- Package Manager: npm
- Bundler: unbundled
- Built on VS Code Extension API using Webview for the UI

## Project Structure
- `src/extension.ts`: Main extension code and command registration
- `src/webview/`: Webview UI components and logic (to be created)
- `package.json`: Extension manifest and dependencies

## Next Steps
1. Create the webview UI with canvas for motion editor
2. Implement curve-to-easing algorithm
3. Add commands for opening the editor and copying values
4. Test the complete workflow
