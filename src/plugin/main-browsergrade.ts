/**
 * Browser-Grade Figma Plugin Main Entry Point
 * 
 * This version uses the browser-grade CSS engine for pixel-perfect conversion
 */

// This file is the main entry point for the Figma plugin
// It runs in the Figma document context

// Import the browser-grade converter
import { HTMLToFigmaConverter } from '../conversion/html-to-figma-browsergrade';

// Show the UI
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  title: "HTML to Figma (Browser-Grade)"
});

// Initialize converter
const converter = new HTMLToFigmaConverter({
  viewport: { width: 1920, height: 1080 },
  rootFontSize: 16
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log('🔌 Plugin received message:', msg.type);
  
  if (msg.type === 'convert-html') {
    try {
      const { html, css } = msg;
      
      console.log('🚀 Starting browser-grade conversion...');
      console.log('📝 HTML preview:', html.substring(0, 100) + '...');
      console.log('🎨 CSS preview:', css.substring(0, 100) + '...');
      
      // Clear the current page
      console.log('🗑️ Clearing current page...');
      const nodesToRemove = [...figma.currentPage.children];
      for (const node of nodesToRemove) {
        node.remove();
      }
      
      // Convert HTML/CSS to Figma node data
      console.log('🔄 Converting with browser-grade engine...');
      const nodeDataArray = await converter.convert(html, css);
      
      console.log(`📦 Received ${nodeDataArray.length} nodes to create`);
      
      // Create actual Figma nodes
      const createdNodes: SceneNode[] = [];
      for (const nodeData of nodeDataArray) {
        const node = await createFigmaNodeFromData(nodeData);
        if (node) {
          createdNodes.push(node);
        }
      }
      
      // Select and zoom to the created nodes
      if (createdNodes.length > 0) {
        figma.currentPage.selection = createdNodes;
        figma.viewport.scrollAndZoomIntoView(createdNodes);
      }
      
      // Send success message
      figma.ui.postMessage({
        type: 'conversion-complete',
        message: `Successfully created ${createdNodes.length} elements with browser-grade engine!`
      });
      
      console.log('✅ Conversion complete!');
      
    } catch (error) {
      console.error('❌ Conversion error:', error);
      figma.ui.postMessage({
        type: 'conversion-error',
        message: error.message || 'An error occurred during conversion'
      });
    }
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

/**
 * Create actual Figma nodes from node data
 */
async function createFigmaNodeFromData(nodeData: any, parent?: BaseNode): Promise<SceneNode | null> {
  try {
    let node: SceneNode;
    
    console.log(`🔨 Creating ${nodeData.type} node: ${nodeData.name}`);
    
    // Create appropriate node type
    if (nodeData.type === 'TEXT') {
      // Load font first
      const fontName = nodeData.fontName || { family: 'Inter', style: 'Regular' };
      
      console.log(`📝 Loading font: ${fontName.family} ${fontName.style}`);
      await figma.loadFontAsync(fontName);
      
      node = figma.createText();
      const textNode = node as TextNode;
      
      // Set font
      textNode.fontName = fontName;
      
      // Set text content
      if (nodeData.characters) {
        textNode.characters = nodeData.characters;
      }
      
      // Set text properties
      if (nodeData.fontSize) textNode.fontSize = nodeData.fontSize;
      if (nodeData.lineHeight) textNode.lineHeight = nodeData.lineHeight;
      if (nodeData.letterSpacing) textNode.letterSpacing = nodeData.letterSpacing;
      if (nodeData.textAlignHorizontal) textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
      if (nodeData.textCase) textNode.textCase = nodeData.textCase;
      if (nodeData.textDecoration) textNode.textDecoration = nodeData.textDecoration;
      
    } else {
      // Create frame
      node = figma.createFrame();
      const frame = node as FrameNode;
      
      // Apply auto layout if specified
      if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
        console.log(`📐 Applying auto layout: ${nodeData.layoutMode}`);
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
    
    // Set position and size
    if (!parent || (parent && 'layoutMode' in parent && parent.layoutMode === 'NONE')) {
      node.x = nodeData.x || 0;
      node.y = nodeData.y || 0;
    }
    
    // Resize only if not using auto layout sizing
    if (nodeData.width && nodeData.height) {
      if (node.type === 'FRAME') {
        const frame = node as FrameNode;
        if (!frame.layoutMode || 
            (frame.layoutSizingHorizontal === 'FIXED' && frame.layoutSizingVertical === 'FIXED')) {
          node.resize(nodeData.width, nodeData.height);
        }
      } else {
        node.resize(nodeData.width, nodeData.height);
      }
    }
    
    // Apply visual properties
    if (nodeData.fills) {
      console.log(`🎨 Applying fills:`, nodeData.fills);
      node.fills = nodeData.fills;
    }
    
    if (nodeData.strokes) {
      console.log(`🖌️ Applying strokes:`, nodeData.strokes);
      node.strokes = nodeData.strokes;
    }
    
    if (nodeData.strokeWeight !== undefined) node.strokeWeight = nodeData.strokeWeight;
    if (nodeData.strokeAlign) node.strokeAlign = nodeData.strokeAlign;
    if (nodeData.cornerRadius !== undefined) {
      if ('cornerRadius' in node) {
        node.cornerRadius = nodeData.cornerRadius;
      }
    }
    if (nodeData.opacity !== undefined) node.opacity = nodeData.opacity;
    
    // Add to parent or current page
    if (parent) {
      parent.appendChild(node);
    } else {
      figma.currentPage.appendChild(node);
    }
    
    // Process children
    if (nodeData.children && node.type === 'FRAME') {
      console.log(`👶 Processing ${nodeData.children.length} children`);
      for (const childData of nodeData.children) {
        await createFigmaNodeFromData(childData, node);
      }
    }
    
    console.log(`✅ Created node: ${node.name}`);
    return node;
    
  } catch (error) {
    console.error('❌ Failed to create node:', error);
    console.error('Node data:', nodeData);
    return null;
  }
}

// UI HTML (embedded)
const __html__ = `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: #333;
      background: #ffffff;
    }
    
    .container {
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .header {
      margin-bottom: 16px;
    }
    
    h1 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 12px;
      color: #666;
    }
    
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
      font-weight: 500;
    }
    
    .input-group {
      margin-bottom: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    label {
      font-weight: 500;
      margin-bottom: 8px;
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }
    
    textarea {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 12px;
      resize: vertical;
      flex: 1;
    }
    
    textarea:focus {
      outline: none;
      border-color: #0066ff;
    }
    
    #htmlInput {
      min-height: 150px;
    }
    
    #cssInput {
      min-height: 200px;
    }
    
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    button {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .primary {
      background: #0066ff;
      color: white;
    }
    
    .primary:hover {
      background: #0052cc;
    }
    
    .secondary {
      background: #f3f4f6;
      color: #333;
    }
    
    .secondary:hover {
      background: #e5e7eb;
    }
    
    .message {
      margin-top: 12px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      display: none;
    }
    
    .message.success {
      background: #d1fae5;
      color: #065f46;
      display: block;
    }
    
    .message.error {
      background: #fee2e2;
      color: #991b1b;
      display: block;
    }
    
    .examples {
      margin-top: 16px;
      font-size: 12px;
    }
    
    .example-link {
      color: #0066ff;
      text-decoration: none;
      cursor: pointer;
      margin-right: 12px;
    }
    
    .example-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HTML to Figma <span class="badge">Browser-Grade</span></h1>
      <p class="subtitle">Convert HTML & CSS to Figma with pixel-perfect accuracy</p>
    </div>
    
    <div class="input-group">
      <label for="htmlInput">HTML</label>
      <textarea id="htmlInput" placeholder='<div class="card">
  <h2>Hello World</h2>
  <p>This is a paragraph</p>
</div>'></textarea>
    </div>
    
    <div class="input-group">
      <label for="cssInput">CSS</label>
      <textarea id="cssInput" placeholder='.card {
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
}

h2 {
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 16px;
}

p {
  color: #cccccc;
  font-size: 16px;
  line-height: 1.5;
}'></textarea>
    </div>
    
    <div class="examples">
      <span style="color: #666;">Examples:</span>
      <a class="example-link" onclick="loadExample('card')">Card</a>
      <a class="example-link" onclick="loadExample('flexbox')">Flexbox</a>
      <a class="example-link" onclick="loadExample('grid')">Grid</a>
    </div>
    
    <div class="buttons">
      <button class="primary" onclick="convert()">Convert to Figma</button>
      <button class="secondary" onclick="cancel()">Cancel</button>
    </div>
    
    <div id="message" class="message"></div>
  </div>
  
  <script>
    function convert() {
      const html = document.getElementById('htmlInput').value;
      const css = document.getElementById('cssInput').value;
      
      if (!html.trim()) {
        showMessage('Please enter some HTML', 'error');
        return;
      }
      
      parent.postMessage({
        pluginMessage: {
          type: 'convert-html',
          html: html,
          css: css
        }
      }, '*');
      
      showMessage('Converting...', 'success');
    }
    
    function cancel() {
      parent.postMessage({
        pluginMessage: { type: 'cancel' }
      }, '*');
    }
    
    function showMessage(text, type) {
      const messageEl = document.getElementById('message');
      messageEl.textContent = text;
      messageEl.className = 'message ' + type;
    }
    
    function loadExample(type) {
      const examples = {
        card: {
          html: '<div class="card">\\n  <h2>Card Title</h2>\\n  <p>This is a card with a border and background.</p>\\n</div>',
          css: '.card {\\n  background-color: #1a1a1a;\\n  border: 2px solid #333;\\n  border-radius: 12px;\\n  padding: 24px;\\n  max-width: 400px;\\n}\\n\\nh2 {\\n  color: #ffffff;\\n  font-size: 24px;\\n  margin-bottom: 16px;\\n}\\n\\np {\\n  color: #cccccc;\\n  font-size: 16px;\\n  line-height: 1.5;\\n}'
        },
        flexbox: {
          html: '<div class="container">\\n  <div class="item">Item 1</div>\\n  <div class="item">Item 2</div>\\n  <div class="item">Item 3</div>\\n</div>',
          css: '.container {\\n  display: flex;\\n  flex-direction: row;\\n  gap: 16px;\\n  padding: 20px;\\n  background-color: #f0f0f0;\\n}\\n\\n.item {\\n  background-color: #0066cc;\\n  color: white;\\n  padding: 12px 16px;\\n  border-radius: 8px;\\n}'
        },
        grid: {
          html: '<div class="grid">\\n  <div class="grid-item">1</div>\\n  <div class="grid-item">2</div>\\n  <div class="grid-item">3</div>\\n  <div class="grid-item">4</div>\\n</div>',
          css: '.grid {\\n  display: grid;\\n  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\\n  gap: 16px;\\n  padding: 20px;\\n  background-color: #f5f5f5;\\n}\\n\\n.grid-item {\\n  background-color: #333;\\n  color: white;\\n  padding: 40px;\\n  text-align: center;\\n  border-radius: 8px;\\n}'
        }
      };
      
      const example = examples[type];
      if (example) {
        document.getElementById('htmlInput').value = example.html;
        document.getElementById('cssInput').value = example.css;
      }
    }
    
    // Listen for messages from the plugin
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message) {
        if (message.type === 'conversion-complete') {
          showMessage(message.message, 'success');
        } else if (message.type === 'conversion-error') {
          showMessage('Error: ' + message.message, 'error');
        }
      }
    };
  </script>
</body>
</html>
`;