#!/bin/bash

# Script to switch to browser-grade converter

echo "🔄 Switching to Browser-Grade Converter..."

# Backup current files if not already backed up
if [ ! -f "src/backups/old-pattern-system/main.ts.original" ]; then
  echo "📦 Creating backup of original main.ts..."
  cp src/plugin/main.ts src/backups/old-pattern-system/main.ts.original
fi

if [ ! -f "src/backups/old-pattern-system/html-to-figma.ts.original" ]; then
  echo "📦 Creating backup of original html-to-figma.ts..."
  cp src/conversion/html-to-figma.ts src/backups/old-pattern-system/html-to-figma.ts.original
fi

# Switch to browser-grade versions
echo "🔄 Switching main.ts to browser-grade version..."
cp src/plugin/main-browsergrade.ts src/plugin/main.ts

echo "🔄 Switching converter to browser-grade version..."
cp src/conversion/html-to-figma-browsergrade.ts src/conversion/html-to-figma.ts

# Update package.json to ensure jsdom is installed
echo "📦 Checking dependencies..."
if ! grep -q "jsdom" package.json; then
  echo "📦 Adding jsdom dependency..."
  npm install jsdom --save
fi

# Build the plugin
echo "🔨 Building plugin..."
npm run build

echo "✅ Successfully switched to Browser-Grade Converter!"
echo ""
echo "📋 Next steps:"
echo "1. Reload the plugin in Figma"
echo "2. Test with the example HTML/CSS in the UI"
echo "3. You should see:"
echo "   - Red backgrounds actually appear"
echo "   - Borders are visible"
echo "   - Auto Layout works correctly"
echo ""
echo "🔙 To switch back to the old system, run: ./switch-to-old.sh"