// Final main.ts with all critical fixes
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { ColorParser } from '../utils/color-parser-enhanced';
import { FixedFontManager } from '../utils/font-manager-fixed';
import { CSSPropertyExtractor } from '../utils/css-property-extractor';
import { SizingStrategy } from '../utils/sizing-strategy';

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
      await FixedFontManager.preloadFonts();
      
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
      container.counterAxisSizingMode = 'AUTO';
      container.fills = []; // Transparent background
      container.itemSpacing = 0;
      
      // Add to page first
      figma.currentPage.appendChild(container);
      
      // CRITICAL: Set container to reasonable size to avoid 1px issues
      container.resize(1400, 800);
      
      // Create nodes with all fixes applied
      for (const element of elements) {
        try {
          const node = await createNodeWithFixes(element, container);
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

// Create node with all fixes applied
async function createNodeWithFixes(element: any, parent: FrameNode): Promise<SceneNode | null> {
  console.log('[CREATE NODE] Creating:', element.type, element.name);
  console.log('[CREATE NODE] Properties:', {
    gap: element.gap,
    padding: element.padding,
    fontWeight: element.fontWeight,
    backgroundColor: element.backgroundColor,
    width: element.width,
    maxWidth: element.maxWidth
  });
  
  // Extract all CSS properties using the enhanced extractor
  const properties = CSSPropertyExtractor.extractAllProperties(element, {
    ...element,
    display: element.layoutMode ? (element.layoutMode === 'HORIZONTAL' ? 'flex' : 'flex') : 'block',
    'flex-direction': element.layoutMode === 'VERTICAL' ? 'column' : 'row',
    gap: element.gap,
    padding: element.padding,
    'background-color': element.backgroundColor,
    'border-radius': element.borderRadius,
    'font-family': element.fontFamily,
    'font-weight': element.fontWeight,
    'font-size': element.fontSize,
    color: element.color,
    'text-align': element.textAlign,
    'line-height': element.lineHeight,
    'letter-spacing': element.letterSpacing,
    'max-width': element.maxWidth,
    'justify-content': element.justifyContent,
    'align-items': element.alignItems
  });
  
  if (element.type === 'TEXT') {
    return await createTextNodeWithFixes(element, parent, properties);
  } else {
    return await createFrameNodeWithFixes(element, parent, properties);
  }
}

// Create text node with font fixes
async function createTextNodeWithFixes(element: any, parent: FrameNode, properties: any): Promise<TextNode> {
  console.log('[TEXT NODE] Creating text with properties:', properties);
  
  // Use the fixed font manager to create text node
  const textNode = await FixedFontManager.createTextNode(
    element.characters || '',
    properties,
    parent
  );
  
  // Apply any additional properties from the element
  if (element.fills && element.fills.length > 0) {
    textNode.fills = element.fills;
  }
  
  if (element.textAlignHorizontal) {
    textNode.textAlignHorizontal = element.textAlignHorizontal;
  }
  
  return textNode;
}

// Create frame node with all fixes
async function createFrameNodeWithFixes(element: any, parent: FrameNode, properties: any): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // Don't set any initial size - let Auto Layout handle everything
  
  // STEP 1: Add to parent immediately (enables all properties)
  parent.appendChild(frame);
  console.log('[ORDER] Step 1: Added frame to parent');
  
  // STEP 2: Apply visual properties BEFORE layout
  
  // Background color
  if (element.fills && element.fills.length > 0) {
    frame.fills = element.fills;
  } else if (properties.backgroundColor) {
    const bgColor = ColorParser.parseColor(properties.backgroundColor);
    if (bgColor) {
      frame.fills = [{
        type: 'SOLID',
        color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }
      }];
    }
  } else {
    frame.fills = []; // Transparent
  }
  
  // Borders
  if (element.strokes && element.strokes.length > 0) {
    frame.strokes = element.strokes;
    frame.strokeWeight = element.strokeWeight || 1;
    frame.strokeAlign = 'INSIDE';
  } else if (properties.borderWidth && properties.borderColor) {
    const borderColor = ColorParser.parseColor(properties.borderColor);
    if (borderColor) {
      frame.strokes = [{
        type: 'SOLID',
        color: { r: borderColor.r, g: borderColor.g, b: borderColor.b }
      }];
      frame.strokeWeight = properties.borderWidth;
      frame.strokeAlign = 'INSIDE';
    }
  }
  
  // Border radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
  } else if (properties.borderRadius) {
    frame.cornerRadius = properties.borderRadius;
  }
  
  // Effects
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
  }
  
  // Opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
  } else if (properties.opacity !== undefined && properties.opacity < 1) {
    frame.opacity = properties.opacity;
  }
  
  console.log('[ORDER] Step 2: Applied all visual properties');
  
  // STEP 3: Skip initial sizing - let sizing strategy handle everything
  // The sizing strategy in Step 5 will properly set dimensions and sizing modes
  console.log('[ORDER] Step 3: Skipping initial resize - will be handled by sizing strategy');
  
  // STEP 4: Apply Auto Layout with actual CSS values
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    // Apply layout properties using sizing strategy
    SizingStrategy.applyLayoutProperties(frame, properties);
    
    // Override with element-specific layout properties if they exist
    if (element.layoutMode) {
      frame.layoutMode = element.layoutMode;
    }
    
    // REMOVED: Don't override sizing modes from element data
    // The SizingStrategy should handle this intelligently
    /*
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    }
    
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    }
    */
    
    if (element.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = element.primaryAxisAlignItems;
    }
    
    if (element.counterAxisAlignItems) {
      frame.counterAxisAlignItems = element.counterAxisAlignItems;
    }
    
    // Handle wrapped layouts
    if (element.layoutWrap === 'WRAP' && 'layoutWrap' in frame) {
      (frame as any).layoutWrap = 'WRAP';
      
      if (element.counterAxisSpacing && 'counterAxisSpacing' in frame) {
        (frame as any).counterAxisSpacing = element.counterAxisSpacing;
      }
    }
    
    console.log('[ORDER] Step 4: Applied Auto Layout with actual CSS values');
  }
  
  // STEP 5: Apply intelligent sizing strategy
  const isChild = parent.name !== 'Converted HTML';
  
  // Check if element is marked to fill parent
  const shouldFillParent = element.shouldFillParent || 
                          element.fillParentWidth || 
                          (isChild && !properties.width && !properties.maxWidth) ||
                          // Common container patterns that should fill
                          (isChild && element.name && (
                            element.name.includes('header') ||
                            element.name.includes('grid') ||
                            element.name.includes('section') ||
                            element.name.includes('container') ||
                            element.name.includes('wrapper')
                          ));
  
  SizingStrategy.applySizing(frame, {
    ...properties,
    shouldFillParent
  }, {
    isChild,
    parentDisplay: parent.layoutMode !== 'NONE' ? 'flex' : 'block',
    parentWidth: parent.width
  });
  
  console.log('[ORDER] Step 5: Applied sizing strategy', {
    name: frame.name,
    shouldFillParent,
    width: frame.width,
    horizontalSizing: (frame as any).layoutSizingHorizontal
  });
  
  // STEP 6: Process children
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      const childNode = await createNodeWithFixes(child, frame);
      
      // Apply child constraints
      if (childNode && frame.layoutMode !== 'NONE') {
        const childProperties = CSSPropertyExtractor.extractAllProperties(child, {
          ...child,
          width: child.width,
          height: child.height,
          'min-width': child.minWidth
        });
        
        SizingStrategy.applyChildConstraints(childNode as any, frame, childProperties);
      }
    }
    console.log('[ORDER] Step 6: Processed', element.children.length, 'children');
  }
  
  return frame;
}