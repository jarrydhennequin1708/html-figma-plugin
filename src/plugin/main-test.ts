// MINIMAL TEST - Browser-Grade CSS System
import { FigmaCompatibleCSSEngine } from '../engine/css-engine-figma';
import { SimpleFigmaCSSParser } from '../parsers/simple-css-parser-figma';

console.log('🚀🚀🚀 BROWSER-GRADE TEST STARTING 🚀🚀🚀');

// Test the browser-grade engine
const testCSS = `.test { background-color: #ff0000; border: 2px solid #000; }`;
const testElement = { tagName: 'div', className: 'test' };

const cssEngine = new FigmaCompatibleCSSEngine();
const cssParser = new SimpleFigmaCSSParser(testCSS);
const rules = cssParser.parsedRules;

console.log('📋 Parsed CSS rules:', rules);

const computedStyles = cssEngine.computeStyles(testElement, rules);
console.log('🎨 Computed styles:', computedStyles);

// Should show:
// background-color: #ff0000
// border-top-width: 2px
// border-top-color: #000000

figma.showUI('<h1>Browser-Grade Test</h1>', { width: 300, height: 200 });
figma.notify('Check console for browser-grade test results!');