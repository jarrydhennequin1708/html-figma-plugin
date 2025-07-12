# HTML to Figma Plugin

A Figma plugin that converts HTML and CSS code into Figma design elements with full visual fidelity.

## Features

- 🎨 Complete CSS property conversion (colors, borders, shadows, etc.)
- 📐 Auto Layout support for flexbox and grid layouts
- 🔤 Intelligent font management with fallbacks
- 🎯 Preserves visual properties before applying Auto Layout
- 🌈 Comprehensive color parser (hex, rgb, hsl, named colors)
- 📦 Grid-to-flexbox conversion for Figma compatibility
- 🔧 Handles absolute positioning

## Project Structure

```
html-figma-plugin/
├── src/
│   ├── plugin/
│   │   └── main.ts              # Main plugin entry point
│   ├── conversion/
│   │   └── html-to-figma.ts     # Core HTML/CSS converter
│   ├── utils/
│   │   ├── color-parser.ts      # CSS color parsing utilities
│   │   ├── font-manager.ts      # Font loading and management
│   │   ├── layout-utils.ts      # Auto Layout utilities
│   │   ├── logger.ts            # Logging utility
│   │   └── style-parser.ts      # CSS style parsing
│   ├── types/
│   │   ├── element-data.ts      # TypeScript type definitions
│   │   └── globals.d.ts         # Global type declarations
│   └── ui/
│       └── ui.html              # Plugin UI
├── manifest.json                # Figma plugin manifest
├── webpack.config.js            # Build configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
└── test-cases.html              # Test HTML for verification
```

## Development

### Install dependencies
```bash
npm install
```

### Build the plugin
```bash
npm run build
```

### Development workflow
1. Make changes to the source files
2. Run `npm run build` to compile
3. In Figma: Plugins → Development → Import plugin from manifest
4. Select the `manifest.json` file
5. Test the plugin with the provided `test-cases.html`

## Architecture

The plugin follows a clean pipeline architecture:

```
HTML/CSS Input → Parser → Style Computer → Layout Analyzer → Node Factory → Figma Nodes
```

### Key Components

- **Parser**: Converts raw HTML/CSS into structured data
- **Style Computer**: Maps CSS properties to Figma equivalents
- **Layout Analyzer**: Detects layout patterns and determines Auto Layout strategies
- **Node Factory**: Creates Figma nodes with correct property sequencing

### Critical Implementation Details

1. **Order of Operations**: Visual properties (fills, strokes, effects) are applied BEFORE Auto Layout to prevent style overrides
2. **Font Loading**: Fonts are loaded before creating text nodes to prevent errors
3. **Grid Support**: CSS Grid is converted to wrapped horizontal Auto Layout
4. **Color Support**: Full CSS color format support including HSL and 140+ named colors

## Usage

1. Open the plugin in Figma
2. Paste your HTML in the first text field
3. Paste your CSS in the second text field
4. Click "Convert to Figma"
5. Your design will appear as editable Figma elements with proper styling and Auto Layout

## Testing

Use the included `test-cases.html` file to verify the plugin handles:
- Basic layouts with padding and borders
- Complex grid layouts
- Nested flexbox structures
- Typography and text styling

## License

MIT