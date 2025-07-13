// ========================================
// BROWSER-GRADE CSS CONVERTER (ACTIVE)
// ========================================

import { FigmaCompatibleCSSEngine, ComputedStyle } from '../engine/css-engine-figma';
import { SimpleFigmaCSSParser, CSSRule } from '../parsers/simple-css-parser-figma';
import { SimpleHTMLParser } from '../parsers/simple-html-parser'; // Keep existing HTML parser

console.log('🚀 Loading Browser-Grade CSS Converter...');

// UI HTML embedded
const __html__ = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Inter, Arial, sans-serif; 
      margin: 0; 
      padding: 16px; 
      background: #fafbfc; 
    }
    textarea { 
      width: 100%; 
      min-height: 120px; 
      margin-bottom: 12px; 
      font-family: monospace; 
      font-size: 14px; 
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button { 
      padding: 8px 20px; 
      font-size: 16px; 
      background: #007bff; 
      color: #fff; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
      width: 100%;
    }
    button:hover {
      background: #0056b3;
    }
    .status { 
      margin-top: 16px; 
      min-height: 24px; 
      color: #333; 
    }
    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>CodeToFigma - Browser-Grade CSS</h2>
    <label for="html-input">HTML:</label>
    <textarea id="html-input" placeholder="Paste HTML here..."></textarea>
    
    <label for="css-input">CSS:</label>
    <textarea id="css-input" placeholder="Paste CSS here..."></textarea>
    
    <button id="convert-btn">Convert to Figma</button>
    <div class="status" id="status"></div>
  </div>

  <script>
    const htmlInput = document.getElementById('html-input');
    const cssInput = document.getElementById('css-input');
    const convertBtn = document.getElementById('convert-btn');
    const statusDiv = document.getElementById('status');

    convertBtn.onclick = () => {
      console.log('🚀 Convert button clicked');
      statusDiv.textContent = 'Converting...';
      statusDiv.style.color = '#666';
      
      const html = htmlInput.value.trim();
      const css = cssInput.value.trim();
      
      if (!html) {
        statusDiv.textContent = '❌ Please enter some HTML';
        statusDiv.style.color = '#d32f2f';
        return;
      }
      
      parent.postMessage({
        pluginMessage: {
          type: 'convert',
          html: html,
          css: css
        }
      }, '*');
    };
    
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      
      if (msg.type === 'status') {
        statusDiv.textContent = msg.message;
        statusDiv.style.color = '#1976d2';
      } else if (msg.type === 'success') {
        statusDiv.textContent = '✅ ' + msg.message;
        statusDiv.style.color = '#2e7d32';
      } else if (msg.type === 'error') {
        statusDiv.textContent = '❌ Error: ' + msg.message;
        statusDiv.style.color = '#d32f2f';
      }
    };
  </script>
</body>
</html>
`;

// ========================================
// BROWSER-GRADE CONVERTER CLASS
// ========================================

class BrowserGradeConverter {
  private cssEngine: FigmaCompatibleCSSEngine;
  
  constructor() {
    console.log('🏗️ Initializing Browser-Grade Converter');
    this.cssEngine = new FigmaCompatibleCSSEngine();
  }
  
  async convert(html: string, css: string): Promise<FrameNode[]> {
    console.log('🔄 Starting browser-grade conversion...');
    console.log('📝 HTML length:', html.length);
    console.log('🎨 CSS length:', css.length);
    
    try {
      // 1. Parse HTML (keep existing parser)
      console.log('📄 Parsing HTML...');
      const htmlParser = new SimpleHTMLParser(html);
      const elements = htmlParser.parse();
      console.log(`✅ Parsed ${elements.length} HTML elements`);
      
      // 2. Parse CSS with Figma-compatible parser
      console.log('🎨 Parsing CSS...');
      const cssParser = new SimpleFigmaCSSParser(css);
      const cssRules = cssParser.parsedRules;
      console.log(`✅ Parsed ${cssRules.length} CSS rules`);
      
      // 3. Compute styles (THE KEY DIFFERENCE FROM OLD SYSTEM)
      console.log('💻 Computing styles with browser-grade engine...');
      const computedStylesMap = new Map<any, ComputedStyle>();
      this.computeAllStyles(elements, cssRules, computedStylesMap);
      console.log(`✅ Computed styles for ${computedStylesMap.size} elements`);
      
      // 4. Create Figma nodes with accurate styles
      console.log('🔧 Creating Figma nodes...');
      const figmaNodes: FrameNode[] = [];
      
      for (const element of elements) {
        const computedStyle = computedStylesMap.get(element);
        if (!computedStyle) {
          console.warn('⚠️ No computed style for element:', element);
          continue;
        }
        
        console.log('🎨 Creating node for element:', {
          tag: element.tagName || 'text',
          background: computedStyle['background-color'],
          border: computedStyle['border-top-width'],
          display: computedStyle['display']
        });
        
        const figmaNode = await this.createFigmaNode(element, computedStyle);
        if (figmaNode && 'layoutMode' in figmaNode) {
          figmaNodes.push(figmaNode as FrameNode);
        }
      }
      
      console.log(`✅ Created ${figmaNodes.length} Figma nodes`);
      return figmaNodes;
      
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw error;
    }
  }
  
  private computeAllStyles(
    elements: any[], 
    cssRules: CSSRule[], 
    computedStylesMap: Map<any, ComputedStyle>
  ): void {
    this.traverseAndComputeStyles(elements, cssRules, computedStylesMap, null);
  }
  
  private traverseAndComputeStyles(
    elements: any[],
    cssRules: CSSRule[],
    computedStylesMap: Map<any, ComputedStyle>,
    parentStyles: ComputedStyle | null
  ): void {
    
    elements.forEach((element, index) => {
      console.log(`🎯 Computing styles for element ${index}:`, element.tagName || 'text');
      
      // THIS IS THE KEY: Use browser-grade CSS computation
      const computedStyle = this.cssEngine.computeStyles(
        element, 
        cssRules, 
        parentStyles || undefined
      );
      
      console.log('✅ Computed style preview:', {
        backgroundColor: computedStyle['background-color'],
        borderWidth: computedStyle['border-top-width'],
        display: computedStyle['display']
      });
      
      computedStylesMap.set(element, computedStyle);
      
      // Recursively compute for children
      if (element.children && element.children.length > 0) {
        this.traverseAndComputeStyles(
          element.children,
          cssRules,
          computedStylesMap,
          computedStyle
        );
      }
    });
  }
  
  private async createFigmaNode(
    element: any, 
    computedStyle: ComputedStyle
  ): Promise<FrameNode | TextNode | null> {
    
    try {
      if (element.type === 'text') {
        return await this.createTextNode(element, computedStyle);
      } else {
        return await this.createFrameNode(element, computedStyle);
      }
    } catch (error) {
      console.error(`❌ Failed to create node:`, error);
      return null;
    }
  }
  
  private async createFrameNode(
    element: any, 
    computedStyle: ComputedStyle
  ): Promise<FrameNode> {
    
    console.log('🔲 Creating frame with computed styles');
    const frame = figma.createFrame();
    
    // 1. Apply visual properties FIRST (critical order!)
    await this.applyVisualProperties(frame, computedStyle);
    
    // 2. Apply layout properties
    this.applyLayoutProperties(frame, computedStyle);
    
    // 3. Apply sizing
    this.applySizingProperties(frame, computedStyle);
    
    // 4. Set name
    frame.name = this.generateNodeName(element, computedStyle);
    
    return frame;
  }
  
  private async applyVisualProperties(
    node: FrameNode, 
    computedStyle: ComputedStyle
  ): Promise<void> {
    
    console.log('🎨 Applying visual properties...');
    
    // Background color
    const backgroundColor = computedStyle['background-color'] as string;
    if (backgroundColor && backgroundColor !== 'transparent') {
      const color = this.parseColor(backgroundColor);
      if (color) {
        node.fills = [{
          type: 'SOLID',
          color: color
        }];
        console.log('✅ Applied background color:', backgroundColor);
      }
    }
    
    // Borders
    const borderWidth = computedStyle['border-top-width'] as string;
    const borderColor = computedStyle['border-top-color'] as string;
    const borderStyle = computedStyle['border-top-style'] as string;
    
    if (borderWidth && parseFloat(borderWidth) > 0 && borderStyle !== 'none') {
      const color = this.parseColor(borderColor);
      if (color) {
        node.strokes = [{
          type: 'SOLID',
          color: color
        }];
        node.strokeWeight = parseFloat(borderWidth);
        node.strokeAlign = 'INSIDE';
        console.log('✅ Applied border:', borderWidth, borderColor);
      }
    }
    
    // Border radius
    const borderRadius = computedStyle['border-radius'] as string;
    if (borderRadius && borderRadius !== '0' && borderRadius !== '0px') {
      const radius = parseFloat(borderRadius);
      if (radius > 0) {
        node.cornerRadius = radius;
        console.log('✅ Applied border radius:', radius);
      }
    }
  }
  
  private applyLayoutProperties(frame: FrameNode, computedStyle: ComputedStyle): void {
    const display = computedStyle.display as string;
    
    if (display === 'flex') {
      const flexDirection = computedStyle['flex-direction'] as string || 'row';
      frame.layoutMode = flexDirection.includes('column') ? 'VERTICAL' : 'HORIZONTAL';
      
      // Gap
      const gap = computedStyle['gap'] as string;
      if (gap) {
        frame.itemSpacing = Math.round(parseFloat(gap) || 0);
      }
      
      // Padding
      frame.paddingTop = Math.round(parseFloat(computedStyle['padding-top'] as string) || 0);
      frame.paddingRight = Math.round(parseFloat(computedStyle['padding-right'] as string) || 0);
      frame.paddingBottom = Math.round(parseFloat(computedStyle['padding-bottom'] as string) || 0);
      frame.paddingLeft = Math.round(parseFloat(computedStyle['padding-left'] as string) || 0);
      
      console.log('✅ Applied Auto Layout:', frame.layoutMode);
    }
  }
  
  private applySizingProperties(frame: FrameNode, computedStyle: ComputedStyle): void {
    const width = computedStyle.width as number;
    const height = computedStyle.height as number;
    
    if (typeof width === 'number' && width > 0) {
      frame.resize(Math.round(width), Math.round(height || 100));
    } else {
      // Default sizing for elements without explicit dimensions
      frame.resize(200, 100);
    }
    
    // Set sizing modes
    frame.layoutSizingHorizontal = 'HUG';
    frame.layoutSizingVertical = 'HUG';
  }
  
  private async createTextNode(element: any, computedStyle: ComputedStyle): Promise<TextNode | null> {
    try {
      // Load font BEFORE creating text
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      const textNode = figma.createText();
      textNode.fontName = { family: "Inter", style: "Regular" };
      textNode.characters = element.content || element.textContent || '';
      
      const fontSize = computedStyle['font-size'] as number;
      if (fontSize) {
        textNode.fontSize = Math.round(fontSize);
      }
      
      const color = this.parseColor(computedStyle['color'] as string);
      if (color) {
        textNode.fills = [{ type: 'SOLID', color: color }];
      }
      
      return textNode;
    } catch (error) {
      console.error('❌ Failed to create text node:', error);
      return null;
    }
  }
  
  private parseColor(cssColor: string): RGB | null {
    if (!cssColor || cssColor === 'transparent') return null;
    
    // Handle hex colors
    if (cssColor.startsWith('#')) {
      const hex = cssColor.slice(1);
      
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16) / 255;
        const g = parseInt(hex[1] + hex[1], 16) / 255;
        const b = parseInt(hex[2] + hex[2], 16) / 255;
        return { r, g, b };
      }
      
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        return { r, g, b };
      }
    }
    
    // Handle rgb() colors
    const rgbMatch = cssColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]) / 255;
      const g = parseInt(rgbMatch[2]) / 255;
      const b = parseInt(rgbMatch[3]) / 255;
      return { r, g, b };
    }
    
    return null;
  }
  
  private generateNodeName(element: any, computedStyle: ComputedStyle): string {
    const className = element.className || '';
    const tagName = element.tagName || 'div';
    const display = computedStyle.display || 'block';
    
    if (className) {
      return `${tagName}.${className} (${display})`;
    }
    return `${tagName} (${display})`;
  }
}

// ========================================
// FIGMA PLUGIN MAIN FUNCTION
// ========================================

figma.showUI(__html__, { width: 400, height: 500 });

figma.ui.onmessage = async (msg) => {
  console.log('📨 Received message:', msg.type);
  
  if (msg.type === 'convert') {
    try {
      console.log('🚀 Starting Browser-Grade Conversion...');
      
      const { html, css } = msg;
      
      // REMOVE quote contamination handling (old system workaround)
      // The new system handles CSS properly without these hacks
      
      console.log('📝 Input received:');
      console.log('- HTML length:', html.length);
      console.log('- CSS length:', css.length);
      
      // Use the browser-grade converter
      const converter = new BrowserGradeConverter();
      const nodes = await converter.convert(html, css);
      
      if (nodes.length > 0) {
        console.log(`✅ Successfully created ${nodes.length} nodes`);
        figma.ui.postMessage({ 
          type: 'success', 
          message: `Created ${nodes.length} elements with browser-grade CSS computation!` 
        });
      } else {
        console.log('⚠️ No nodes created');
        figma.ui.postMessage({ 
          type: 'warning', 
          message: 'No elements were created. Check console for details.' 
        });
      }
      
    } catch (error) {
      console.error('❌ Conversion error:', error);
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Conversion failed: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
};

console.log('✅ Browser-Grade CSS Plugin loaded successfully!');