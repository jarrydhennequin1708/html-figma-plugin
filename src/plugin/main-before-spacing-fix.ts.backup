// Fixed main.ts with correct order of operations
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { ColorParser } from '../utils/color-parser-enhanced';
import { EnhancedFontManager } from '../utils/font-manager-enhanced';

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  console.log('[PLUGIN] Received message:', msg.type);
  
  if (msg.type === 'convert') {
    try {
      // Update UI
      figma.ui.postMessage({ type: 'status', message: 'Loading fonts...' });
      
      // Pre-load common fonts
      await EnhancedFontManager.preloadCommonFonts();
      
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
      
      // Create container for all elements
      const container = figma.createFrame();
      container.name = 'Converted HTML';
      container.layoutMode = 'VERTICAL';
      container.primaryAxisSizingMode = 'AUTO';
      container.counterAxisSizingMode = 'FIXED';
      container.resize(1400, 100); // Will auto-expand height
      container.fills = []; // Transparent background
      container.itemSpacing = 0;
      
      // Add to page first
      figma.currentPage.appendChild(container);
      
      // Create nodes with correct order of operations
      for (const element of elements) {
        try {
          const node = await createFigmaNodeCorrectly(element, container);
          console.log('[PLUGIN] Created node:', node?.name);
        } catch (error) {
          console.error('[PLUGIN] Failed to create node:', error);
        }
      }
      
      // Select and zoom
      figma.currentPage.selection = [container];
      figma.viewport.scrollAndZoomIntoView([container]);
      
      figma.ui.postMessage({ 
        type: 'success', 
        message: `Created ${elements.length} elements` 
      });
      
    } catch (error) {
      console.error('[PLUGIN] Conversion error:', error);
      figma.ui.postMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Conversion failed' 
      });
    }
  }
};

// Create Figma node with CORRECT order of operations
async function createFigmaNodeCorrectly(element: any, parent: FrameNode): Promise<SceneNode | null> {
  console.log('[CREATE NODE] Creating:', element.type, element.name);
  console.log('[CREATE NODE] Visual properties:', {
    fills: element.fills,
    strokes: element.strokes,
    backgroundColor: element.backgroundColor,
    borderColor: element.borderColor
  });
  
  if (element.type === 'TEXT') {
    return await createTextNodeCorrectly(element, parent);
  } else {
    return await createFrameNodeCorrectly(element, parent);
  }
}

// Create text node with proper font handling
async function createTextNodeCorrectly(element: any, parent: FrameNode): Promise<TextNode> {
  const styles = {
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    fontSize: element.fontSize,
    color: element.color,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    textTransform: element.textTransform
  };
  
  // Create text using safe font manager
  const textNode = await EnhancedFontManager.createTextNodeSafely(
    element.characters || '',
    styles,
    parent
  );
  
  // Apply color if provided
  if (element.fills && element.fills.length > 0) {
    textNode.fills = element.fills;
  } else if (element.color) {
    const color = ColorParser.parseColor(element.color);
    if (color) {
      textNode.fills = [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b }
      }];
    }
  }
  
  return textNode;
}

// Create frame node with VISUAL PROPERTIES FIRST
async function createFrameNodeCorrectly(element: any, parent: FrameNode): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // STEP 1: Add to parent IMMEDIATELY (enables all properties)
  parent.appendChild(frame);
  console.log('[ORDER] Step 1: Added frame to parent');
  
  // STEP 2: Apply VISUAL properties BEFORE layout
  
  // Background color
  if (element.fills && element.fills.length > 0) {
    frame.fills = element.fills;
    console.log('[VISUAL] Applied fills from element:', element.fills);
  } else if (element.backgroundColor) {
    const bgColor = ColorParser.parseColor(element.backgroundColor);
    if (bgColor) {
      frame.fills = [{
        type: 'SOLID',
        color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }
      }];
      console.log('[VISUAL] Applied background color:', element.backgroundColor, '→', bgColor);
    }
  } else {
    // Ensure transparent if no background specified
    frame.fills = [];
    console.log('[VISUAL] No background - set transparent');
  }
  
  // Borders
  if (element.strokes && element.strokes.length > 0) {
    frame.strokes = element.strokes;
    frame.strokeWeight = element.strokeWeight || 1;
    frame.strokeAlign = 'INSIDE';
    console.log('[VISUAL] Applied strokes from element');
  } else if (element.border || element.borderColor) {
    const borderData = element.border ? 
      ColorParser.parseBorder(element.border) : 
      { width: element.borderWidth || 1, style: 'solid', color: ColorParser.parseColor(element.borderColor || '#000') };
    
    if (borderData && borderData.color) {
      frame.strokes = [{
        type: 'SOLID',
        color: { r: borderData.color.r, g: borderData.color.g, b: borderData.color.b }
      }];
      frame.strokeWeight = borderData.width;
      frame.strokeAlign = 'INSIDE';
      console.log('[VISUAL] Applied border:', borderData);
    }
  }
  
  // Border radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
    console.log('[VISUAL] Applied corner radius:', element.cornerRadius);
  } else if (element.borderRadius) {
    const radius = parseFloat(element.borderRadius);
    if (!isNaN(radius)) {
      frame.cornerRadius = radius;
      console.log('[VISUAL] Applied border radius:', radius);
    }
  }
  
  // Effects (shadows, etc.)
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
    console.log('[VISUAL] Applied effects');
  }
  
  // Opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
    console.log('[VISUAL] Applied opacity:', element.opacity);
  }
  
  console.log('[ORDER] Step 2: Applied all visual properties');
  
  // STEP 3: Set size (before Auto Layout to prevent overrides)
  frame.resize(element.width || 100, element.height || 100);
  console.log('[ORDER] Step 3: Set size:', element.width, 'x', element.height);
  
  // STEP 4: NOW apply Auto Layout (won't override visual properties)
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    frame.layoutMode = element.layoutMode;
    console.log('[LAYOUT] Applied layout mode:', element.layoutMode);
    
    // Sizing modes
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    }
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    }
    
    // Alignment
    if (element.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = element.primaryAxisAlignItems;
    }
    if (element.counterAxisAlignItems) {
      frame.counterAxisAlignItems = element.counterAxisAlignItems;
    }
    
    // Handle flexbox alignment
    if (element.justifyContent) {
      const alignMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'space-between': 'SPACE_BETWEEN',
        'space-around': 'SPACE_BETWEEN',
        'space-evenly': 'SPACE_BETWEEN'
      };
      frame.primaryAxisAlignItems = alignMap[element.justifyContent] || 'MIN';
    }
    
    if (element.alignItems) {
      const alignMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'stretch': 'MIN', // Figma doesn't have stretch for counter axis
        'baseline': 'MIN'
      };
      frame.counterAxisAlignItems = alignMap[element.alignItems] || 'MIN';
    }
    
    // Spacing and padding
    frame.itemSpacing = element.itemSpacing || element.gap || 0;
    frame.paddingTop = element.paddingTop || 0;
    frame.paddingRight = element.paddingRight || 0;
    frame.paddingBottom = element.paddingBottom || 0;
    frame.paddingLeft = element.paddingLeft || 0;
    
    // Handle wrapped layouts (grid simulation)
    if (element.layoutWrap === 'WRAP' && 'layoutWrap' in frame) {
      (frame as any).layoutWrap = 'WRAP';
      
      if (element.counterAxisSpacing && 'counterAxisSpacing' in frame) {
        (frame as any).counterAxisSpacing = element.counterAxisSpacing;
      }
    }
    
    console.log('[ORDER] Step 4: Applied Auto Layout settings');
  }
  
  // STEP 5: Process children
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      const childNode = await createFigmaNodeCorrectly(child, frame);
      
      // Apply child layout properties
      if (childNode && frame.layoutMode !== 'NONE' && 'layoutSizingHorizontal' in childNode) {
        if (child.shouldFillParent || child.fillParentWidth || child.layoutSizingHorizontal === 'FILL') {
          (childNode as any).layoutSizingHorizontal = 'FILL';
        }
        if (child.layoutSizingVertical === 'HUG' || !child.height) {
          (childNode as any).layoutSizingVertical = 'HUG';
        }
      }
    }
    console.log('[ORDER] Step 5: Processed', element.children.length, 'children');
  }
  
  return frame;
}