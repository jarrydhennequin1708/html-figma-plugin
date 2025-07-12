# HTML to Figma Plugin

Convert HTML and CSS code directly into editable Figma designs with proper Auto Layout.

## Features
- 🎨 Faithful CSS to Figma conversion
- 📐 Automatic Auto Layout implementation  
- 🎯 Preserves all CSS styling (colors, fonts, borders, etc.)
- 🔧 No external dependencies

## Development Setup

### Installation
```bash
npm install
```

### Development
```bash
npm run dev   # Watch mode
npm run build # Production build
```

### Testing in Figma
1. Build: `npm run build`
2. In Figma: Plugins → Development → Import plugin from manifest
3. Select `manifest.json`

## Project Status
- ✅ Basic HTML/CSS conversion working
- 🚧 Removing hardcoded styles
- 🚧 Improving CSS parser

## Recent Changes
- Fixed visual styles application order
- Removed class-specific hardcoding
- Enhanced CSS parsing for any HTML/CSS input

## Usage
1. Open the plugin in Figma
2. Paste your HTML in the first text field
3. Paste your CSS in the second text field
4. Click "Convert to Figma"
5. Your design will appear as editable Figma elements

## Project Structure
```
├── src/
│   ├── plugin/          # Figma plugin code
│   │   └── main.ts      # Main plugin logic
│   ├── conversion/      # HTML/CSS to Figma conversion
│   │   └── html-to-figma.ts
│   └── ui/              # Plugin UI
│       └── ui.html
├── manifest.json        # Figma plugin manifest
└── webpack.config.js    # Build configuration
```

## License
Private