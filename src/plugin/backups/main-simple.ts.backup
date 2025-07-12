// Simplified working main.ts for HTML to Figma Plugin
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Simple font manager
class SimpleFontManager {
  static async preloadCommonFonts() {
    const fonts = [
      { family: "Inter", style: "Regular" },
      { family: "Inter", style: "Bold" },
      { family: "Arial", style: "Regular" },
      { family: "Arial", style: "Bold" }
    ];
    
    for (const font of fonts) {
      try {
        await figma.loadFontAsync(font);
        console.log(`[FONT] Loaded ${font.family} ${font.style}`);
      } catch (e) {
        console.log(`[FONT] Could not load ${font.family} ${font.style}, skipping`);
      }
    }
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  console.log('[PLUGIN] Received message:', msg.type);
  
  if (msg.type === 'convert') {
    try {
      // Update UI
      figma.ui.postMessage({ type: 'status', message: 'Loading fonts...' });
      
      // Pre-load fonts
      await SimpleFontManager.preloadCommonFonts();
      
      // Update UI
      figma.ui.postMessage({ type: 'status', message: 'Converting HTML/CSS...' });
      
      // Create converter
      const converter = new HTMLToFigmaConverter({
        useAutoLayout: true,
        createLocalStyles: false,
        useExistingStyles: false,
        detectComponents: false,
        preserveHyperlinks: false,
        highResImages: false,
        fontFallbacks: 'auto' as const
      });
      
      // Convert HTML/CSS
      console.log('[PLUGIN] Converting HTML:', msg.html?.substring(0, 100));
      console.log('[PLUGIN] Converting CSS:', msg.css?.substring(0, 100));
      
      const elements = await converter.convert(msg.html || '', msg.css || '');
      console.log('[PLUGIN] Converter returned', elements.length, 'elements');
      
      if (elements.length === 0) {
        throw new Error('No elements to convert');
      }
      
      // Create nodes in Figma
      const createdNodes: SceneNode[] = [];
      
      for (const element of elements) {
        try {
          const node = await createFigmaNode(element);
          if (node) {
            figma.currentPage.appendChild(node);
            createdNodes.push(node);
          }
        } catch (error) {
          console.error('[PLUGIN] Failed to create node:', error);
        }
      }
      
      // Select and zoom
      if (createdNodes.length > 0) {
        figma.currentPage.selection = createdNodes;
        figma.viewport.scrollAndZoomIntoView(createdNodes);
        figma.ui.postMessage({ 
          type: 'success', 
          message: `Created ${createdNodes.length} elements` 
        });
      }
      
    } catch (error) {
      console.error('[PLUGIN] Conversion error:', error);
      figma.ui.postMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Conversion failed' 
      });
    }
  }
};

// Create Figma node from converter element
async function createFigmaNode(element: any): Promise<SceneNode | null> {
  console.log('[CREATE NODE] Creating:', element.type, element.name);
  
  if (element.type === 'TEXT') {
    return await createTextNode(element);
  } else {
    return await createFrameNode(element);
  }
}

// Create text node
async function createTextNode(element: any): Promise<TextNode> {
  // Load font first
  const fontFamily = element.fontName?.family || 'Inter';
  const fontStyle = element.fontName?.style || 'Regular';
  
  try {
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  } catch (e) {
    console.log(`[FONT] Falling back to Inter Regular`);
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }
  
  const text = figma.createText();
  text.name = element.name || 'Text';
  text.characters = element.characters || '';
  
  // Apply font
  text.fontName = { family: fontFamily, style: fontStyle };
  
  // Apply size
  if (element.fontSize) {
    text.fontSize = element.fontSize;
  }
  
  // Apply color
  if (element.fills) {
    text.fills = element.fills;
  }
  
  // Apply alignment
  if (element.textAlignHorizontal) {
    text.textAlignHorizontal = element.textAlignHorizontal;
  }
  
  // Set text auto-resize
  text.textAutoResize = 'HEIGHT';
  
  return text;
}

// Create frame node
async function createFrameNode(element: any): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // Set size
  frame.resize(element.width || 100, element.height || 100);
  
  // Apply visual styles FIRST (before Auto Layout)
  if (element.fills && element.fills.length > 0) {
    frame.fills = element.fills;
    console.log('[VISUAL] Applied fills to', frame.name);
  }
  
  if (element.strokes && element.strokes.length > 0) {
    frame.strokes = element.strokes;
    frame.strokeWeight = element.strokeWeight || 1;
    console.log('[VISUAL] Applied strokes to', frame.name);
  }
  
  if (element.cornerRadius) {
    frame.cornerRadius = element.cornerRadius;
  }
  
  if (element.effects) {
    frame.effects = element.effects;
  }
  
  // Apply Auto Layout
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    frame.layoutMode = element.layoutMode;
    
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    }
    
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    }
    
    // Apply alignment
    if (element.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = element.primaryAxisAlignItems;
    }
    
    if (element.counterAxisAlignItems) {
      frame.counterAxisAlignItems = element.counterAxisAlignItems;
    }
    
    // Apply spacing and padding
    frame.itemSpacing = element.itemSpacing || 0;
    frame.paddingTop = element.paddingTop || 0;
    frame.paddingRight = element.paddingRight || 0;
    frame.paddingBottom = element.paddingBottom || 0;
    frame.paddingLeft = element.paddingLeft || 0;
  }
  
  // Process children
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      const childNode = await createFigmaNode(child);
      if (childNode) {
        frame.appendChild(childNode);
        
        // Apply fill/hug constraints for Auto Layout children
        if (frame.layoutMode !== 'NONE' && 'layoutSizingHorizontal' in childNode) {
          if (child.shouldFillParent || child.fillParentWidth) {
            (childNode as any).layoutSizingHorizontal = 'FILL';
          }
          (childNode as any).layoutSizingVertical = 'HUG';
        }
      }
    }
  }
  
  return frame;
}