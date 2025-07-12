# Browser-Grade CSS Engine File Structure

## ✅ CORRECT FILES FOR BROWSER-GRADE SYSTEM

### Core Engine Files (NEW SYSTEM)
```
src/engine/
├── css-engine.ts          # Main CSS computation engine with browser defaults
├── cascade-resolver.ts    # CSS cascade and specificity resolution
└── value-resolver.ts      # Unit resolution (em/rem/% to pixels)

src/layout/
├── flexbox-engine.ts      # CSS Flexbox specification implementation
└── grid-engine.ts         # CSS Grid with auto-fit/auto-fill support

src/figma/
└── layout-mapper.ts       # Accurate CSS-to-Figma property mapping

src/conversion/
├── html-to-figma-browsergrade.ts  # Main browser-grade converter
└── browser-grade-converter.ts     # Alternative implementation

src/plugin/
└── main-browsergrade.ts   # Plugin entry point using browser-grade system
```

### Old Pattern-Based Files (TO BE REPLACED)
```
src/conversion/
└── html-to-figma.ts       # OLD pattern-based converter

src/utils/
├── spacing-extractor.ts   # Pattern-based spacing detection
├── grid-calculator.ts     # Pattern-based grid calculation
├── dynamic-*.ts          # All dynamic pattern matchers
└── sizing-strategy.ts    # Heuristic-based sizing

src/plugin/
└── main.ts               # OLD plugin entry using pattern system
```

### Shared/Keep These Files
```
src/types/
├── element-data.ts       # Type definitions
└── globals.d.ts          # Global type declarations

src/utils/
├── color-parser-enhanced.ts  # Keep for color parsing
├── font-manager-fixed.ts     # Keep for font management
└── logger.ts                 # Keep for logging

src/ui/
└── ui.html              # Plugin UI (if separate)
```

## 🚀 HOW TO ACTIVATE BROWSER-GRADE SYSTEM

### Option 1: Use the Switch Script
```bash
# Switch to browser-grade system
./switch-to-browsergrade.sh

# Switch back to old system (if needed)
./switch-to-old.sh
```

### Option 2: Manual Switch
```bash
# 1. Backup current files
cp src/plugin/main.ts src/backups/main.ts.backup
cp src/conversion/html-to-figma.ts src/backups/html-to-figma.ts.backup

# 2. Replace with browser-grade versions
cp src/plugin/main-browsergrade.ts src/plugin/main.ts
cp src/conversion/html-to-figma-browsergrade.ts src/conversion/html-to-figma.ts

# 3. Install jsdom dependency
npm install jsdom --save

# 4. Build the plugin
npm run build
```

## 📊 KEY DIFFERENCES

### Old System (Pattern Matching)
- Guesses CSS behavior from patterns
- Uses heuristics for sizing decisions
- Loses visual properties during conversion
- Quote contamination issues
- Approximate layout calculations

### New System (Browser-Grade)
- Computes CSS like real browsers
- Implements CSS cascade and inheritance
- Preserves all visual properties
- Clean value parsing (no quote issues)
- Exact flexbox/grid algorithms

## ✅ SUCCESS INDICATORS

When the browser-grade system is working correctly:

1. **Console logs show**:
   - "🚀 Initializing Browser-Grade HTML to Figma Converter"
   - "✅ Using BrowserGradeCSSEngine"
   - Computed style values for each element

2. **Visual results**:
   - Background colors appear correctly
   - Borders are visible with proper styling
   - Border radius is applied
   - Auto Layout matches CSS flexbox/grid
   - Text has correct fonts and sizes

3. **Test with this CSS**:
   ```css
   .card {
     background-color: #ff0000;
     border: 2px solid #000000;
     padding: 20px;
   }
   ```
   Should produce: Red background with black border

## 🐛 TROUBLESHOOTING

If browser-grade system isn't working:

1. **Check imports in main.ts**:
   ```typescript
   // Should see:
   import { HTMLToFigmaConverter } from '../conversion/html-to-figma-browsergrade';
   
   // NOT:
   import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
   ```

2. **Verify jsdom is installed**:
   ```bash
   npm list jsdom
   ```

3. **Clear build cache**:
   ```bash
   rm -rf dist/
   npm run build
   ```

4. **Check console for errors**:
   - Missing jsdom: `npm install jsdom`
   - Import errors: Verify file paths
   - Type errors: Run `npm run typecheck`

## 🎯 NEXT STEPS

1. Run `./switch-to-browsergrade.sh`
2. Reload plugin in Figma
3. Test with examples in the UI
4. Verify visual properties appear correctly
5. Test your complex Klarna dashboard CSS

The browser-grade system solves the core issue of pattern matching vs computation, providing pixel-perfect CSS-to-Figma conversion.