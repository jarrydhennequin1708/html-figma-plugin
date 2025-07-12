/**
 * Integration Example: Using the Browser-Grade Converter
 * 
 * This shows how to integrate the new browser-grade converter into your existing plugin.
 * Replace your current conversion logic with this approach.
 */

import { BrowserGradeConverter } from './browser-grade-converter';

// Example of how to use in your plugin's main.ts
export async function convertHTMLToFigmaWithBrowserEngine(html: string, css: string) {
  // Create converter instance
  const converter = new BrowserGradeConverter({
    viewport: { width: 1920, height: 1080 },
    rootFontSize: 16
  });
  
  // Convert HTML/CSS to Figma nodes
  const figmaNodes = await converter.convert(html, css);
  
  // Create actual Figma nodes
  for (const nodeData of figmaNodes) {
    createFigmaNodeFromData(nodeData);
  }
}

// Helper function to create actual Figma nodes
function createFigmaNodeFromData(nodeData: any, parent?: BaseNode) {
  let node: SceneNode;
  
  // Create appropriate node type
  if (nodeData.type === 'TEXT') {
    node = figma.createText();
    const textNode = node as TextNode;
    
    // Load font first
    if (nodeData.fontName) {
      figma.loadFontAsync(nodeData.fontName).then(() => {
        textNode.fontName = nodeData.fontName;
        textNode.characters = nodeData.characters || '';
        
        if (nodeData.fontSize) textNode.fontSize = nodeData.fontSize;
        if (nodeData.lineHeight) textNode.lineHeight = nodeData.lineHeight;
        if (nodeData.letterSpacing) textNode.letterSpacing = nodeData.letterSpacing;
        if (nodeData.textAlignHorizontal) textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
        if (nodeData.textCase) textNode.textCase = nodeData.textCase;
        if (nodeData.textDecoration) textNode.textDecoration = nodeData.textDecoration;
      });
    }
  } else {
    // Create frame
    node = figma.createFrame();
    const frame = node as FrameNode;
    
    // Apply auto layout if specified
    if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
      frame.layoutMode = nodeData.layoutMode;
      
      if (nodeData.itemSpacing !== undefined) frame.itemSpacing = nodeData.itemSpacing;
      if (nodeData.paddingTop !== undefined) frame.paddingTop = nodeData.paddingTop;
      if (nodeData.paddingRight !== undefined) frame.paddingRight = nodeData.paddingRight;
      if (nodeData.paddingBottom !== undefined) frame.paddingBottom = nodeData.paddingBottom;
      if (nodeData.paddingLeft !== undefined) frame.paddingLeft = nodeData.paddingLeft;
      
      if (nodeData.primaryAxisAlignItems) frame.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
      if (nodeData.counterAxisAlignItems) frame.counterAxisAlignItems = nodeData.counterAxisAlignItems;
      
      if (nodeData.layoutSizingHorizontal) frame.layoutSizingHorizontal = nodeData.layoutSizingHorizontal;
      if (nodeData.layoutSizingVertical) frame.layoutSizingVertical = nodeData.layoutSizingVertical;
    }
  }
  
  // Apply common properties
  node.name = nodeData.name;
  node.x = nodeData.x;
  node.y = nodeData.y;
  node.resize(nodeData.width, nodeData.height);
  
  // Apply visual properties
  if (nodeData.fills) node.fills = nodeData.fills;
  if (nodeData.strokes) node.strokes = nodeData.strokes;
  if (nodeData.strokeWeight) node.strokeWeight = nodeData.strokeWeight;
  if (nodeData.strokeAlign) node.strokeAlign = nodeData.strokeAlign;
  if (nodeData.cornerRadius) node.cornerRadius = nodeData.cornerRadius;
  if (nodeData.opacity !== undefined) node.opacity = nodeData.opacity;
  
  // Add to parent or current page
  if (parent) {
    parent.appendChild(node);
  } else {
    figma.currentPage.appendChild(node);
  }
  
  // Process children
  if (nodeData.children && node.type === 'FRAME') {
    for (const childData of nodeData.children) {
      createFigmaNodeFromData(childData, node);
    }
  }
  
  return node;
}

// Example: Replace your current message handler in main.ts
export function setupBrowserGradeMessageHandler() {
  figma.ui.onmessage = async msg => {
    if (msg.type === 'convert-html') {
      try {
        const { html, css } = msg;
        
        // Use browser-grade converter
        const converter = new BrowserGradeConverter();
        const figmaNodes = await converter.convert(html, css);
        
        // Clear current page
        figma.currentPage.children.forEach(child => child.remove());
        
        // Create Figma nodes
        for (const nodeData of figmaNodes) {
          createFigmaNodeFromData(nodeData);
        }
        
        // Zoom to fit
        figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
        
        figma.ui.postMessage({ 
          type: 'conversion-complete',
          message: 'Successfully converted with browser-grade engine!'
        });
        
      } catch (error) {
        console.error('Conversion error:', error);
        figma.ui.postMessage({ 
          type: 'conversion-error',
          message: error.message
        });
      }
    }
  };
}

// Migration guide for your existing code:
/*
1. Replace SimpleHTMLParser with JSDOM (already done in browser-grade-converter.ts)
2. Replace SimpleCSSParser with CascadeResolver 
3. Replace your sizing logic with the layout engines
4. Remove all the quote cleaning hacks - the new engine handles this properly

Key differences:
- No more guessing: The engine computes exact values like browsers do
- Proper cascade: CSS inheritance and specificity work correctly
- Real layout: Flexbox and Grid algorithms match browser behavior
- Direct mapping: Computed values map directly to Figma properties

To integrate:
1. Import BrowserGradeConverter in your main.ts
2. Replace your current conversion logic with the example above
3. Remove all the utility classes that guess layout patterns
4. Test with your most complex layouts - they should now work perfectly
*/