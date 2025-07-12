#!/bin/bash

# Script to switch back to old pattern-based system

echo "🔄 Switching back to Old Pattern-Based System..."

# Restore original files
if [ -f "src/backups/old-pattern-system/main.ts.original" ]; then
  echo "🔄 Restoring original main.ts..."
  cp src/backups/old-pattern-system/main.ts.original src/plugin/main.ts
fi

if [ -f "src/backups/old-pattern-system/html-to-figma.ts.original" ]; then
  echo "🔄 Restoring original html-to-figma.ts..."
  cp src/backups/old-pattern-system/html-to-figma.ts.original src/conversion/html-to-figma.ts
fi

# Build the plugin
echo "🔨 Building plugin..."
npm run build

echo "✅ Successfully switched back to old system!"
echo ""
echo "📋 To switch to browser-grade system, run: ./switch-to-browsergrade.sh"