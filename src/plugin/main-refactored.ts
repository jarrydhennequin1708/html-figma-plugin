// Refactored Figma Plugin - Using browser computed styles
import { ComputedToFigmaConverter } from '../conversion/computed-to-figma';
import { ComputedElementData, FigmaNodeData } from '../types/element-data';

// Show the UI
figma.showUI(__html__, { width: 400, height: 500 });

// Font loading helper
async function loadFonts(node: FigmaNodeData): Promise<void> {
  if (node.type === 'TEXT' && node.fontName) {
    try {
      await figma.loadFontAsync(node.fontName as FontName);
    } catch (e) {
      console.log(`Font ${node.fontName.family} ${node.fontName.style} not available, using Inter`);
      // Fallback to Inter if font not available
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      node.fontName = { family: 'Inter', style: 'Regular' };
    }
  }
  
  // Load fonts for children
  if (node.children) {
    for (const child of node.children) {
      await loadFonts(child);
    }
  }
}

// Create Figma nodes from converted data
async function createFigmaNodes(
  data: FigmaNodeData, 
  parent: BaseNode & ChildrenMixin
): Promise<SceneNode> {
  let node: SceneNode;
  
  if (data.type === 'TEXT') {
    // Create text node
    const textNode = figma.createText();
    
    // Apply properties
    if (data.fontName) {
      textNode.fontName = data.fontName as FontName;
    }
    textNode.characters = data.characters || '';
    if (data.fontSize) textNode.fontSize = data.fontSize;
    if (data.fills) textNode.fills = data.fills;
    if (data.textAlignHorizontal) {
      textNode.textAlignHorizontal = data.textAlignHorizontal as any;
    }
    if (data.lineHeight) {
      textNode.lineHeight = data.lineHeight;
    }
    if (data.letterSpacing) {
      textNode.letterSpacing = data.letterSpacing;
    }
    
    node = textNode;
  } else {
    // Create frame node
    const frame = figma.createFrame();
    
    // Apply size
    if (data.width && data.height) {
      frame.resize(data.width, data.height);
    }
    
    // Apply visual properties
    if (data.fills) frame.fills = data.fills;
    if (data.strokes) frame.strokes = data.strokes;
    if (data.strokeWeight) frame.strokeWeight = data.strokeWeight;
    if (data.effects) frame.effects = data.effects;
    if (data.cornerRadius !== undefined) {
      frame.cornerRadius = data.cornerRadius;
    }
    
    // Apply Auto Layout
    if (data.layoutMode && data.layoutMode !== 'NONE') {
      frame.layoutMode = data.layoutMode;
      
      if (data.primaryAxisSizingMode) {
        frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
      }
      if (data.counterAxisSizingMode) {
        frame.counterAxisSizingMode = data.counterAxisSizingMode;
      }
      if (data.paddingTop !== undefined) frame.paddingTop = data.paddingTop;
      if (data.paddingRight !== undefined) frame.paddingRight = data.paddingRight;
      if (data.paddingBottom !== undefined) frame.paddingBottom = data.paddingBottom;
      if (data.paddingLeft !== undefined) frame.paddingLeft = data.paddingLeft;
      if (data.itemSpacing !== undefined) frame.itemSpacing = data.itemSpacing;
      
      // Apply alignment
      if (data.primaryAxisAlignItems) {
        frame.primaryAxisAlignItems = data.primaryAxisAlignItems as any;
      }
      if (data.counterAxisAlignItems) {
        frame.counterAxisAlignItems = data.counterAxisAlignItems as any;
      }
      if (data.layoutWrap) {
        (frame as any).layoutWrap = data.layoutWrap;
      }
    }
    
    // Create children
    if (data.children) {
      for (const childData of data.children) {
        const childNode = await createFigmaNodes(childData, frame);
        frame.appendChild(childNode);
      }
    }
    
    node = frame;
  }
  
  // Apply name
  if (data.name) {
    node.name = data.name;
  }
  
  return node;
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  console.log('[PLUGIN] Received message:', msg.type);
  
  if (msg.type === 'create-from-computed') {
    try {
      const computedData: ComputedElementData = msg.data;
      console.log('[PLUGIN] Processing computed data for:', computedData.tagName);
      
      // Convert computed styles to Figma data
      const converter = new ComputedToFigmaConverter();
      const figmaData = await converter.convert(computedData);
      console.log('[PLUGIN] Converted to Figma data');
      
      // Pre-load all fonts
      console.log('[PLUGIN] Loading fonts...');
      await loadFonts(figmaData);
      
      // Create the design
      console.log('[PLUGIN] Creating Figma nodes...');
      const rootNode = await createFigmaNodes(figmaData, figma.currentPage);
      
      // Position the node
      rootNode.x = Math.round(figma.viewport.center.x - (rootNode.width / 2));
      rootNode.y = Math.round(figma.viewport.center.y - (rootNode.height / 2));
      
      // Select and focus
      figma.currentPage.selection = [rootNode];
      figma.viewport.scrollAndZoomIntoView([rootNode]);
      
      figma.notify('✅ HTML imported successfully!');
      figma.ui.postMessage({ type: 'success' });
      
    } catch (error) {
      console.error('[PLUGIN] Error:', error);
      figma.notify('❌ Error importing HTML: ' + (error as Error).message);
      figma.ui.postMessage({ 
        type: 'error', 
        message: (error as Error).message 
      });
    }
  }
  
  // Keep old handler for backwards compatibility during transition
  else if (msg.type === 'convert') {
    figma.notify('⚠️ Please refresh the plugin to use the new converter');
    figma.ui.postMessage({ 
      type: 'error', 
      message: 'Plugin needs refresh for new converter' 
    });
  }
};