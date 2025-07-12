// Enhanced Figma Plugin - Complete CSS to Figma Conversion
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { FontManager } from '../converter/FontManager';

// Show the UI
figma.showUI(__html__, { width: 400, height: 500 });

// Enhanced conversion function with full CSS support
async function convertToFigma(htmlContent: string, cssContent: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('[FINAL PLUGIN] Starting enhanced CSS conversion');
    console.log('[FINAL PLUGIN] HTML length:', htmlContent?.length || 0);
    console.log('[FINAL PLUGIN] CSS length:', cssContent?.length || 0);
    
    // Pre-load fonts using enhanced font manager
    await FontManager.preloadCommonFonts();
    
    // Use existing converter with enhanced options
    const converter = new HTMLToFigmaConverter({
      useAutoLayout: true,
      createLocalStyles: true,
      useExistingStyles: false,
      detectComponents: true,
      preserveHyperlinks: true,
      highResImages: true,
      fontFallbacks: "auto" as const
    });
    
    // Convert using existing system
    const elements = await converter.convert(htmlContent, cssContent);
    console.log('[FINAL PLUGIN] Converted to', elements.length, 'elements');
    
    if (elements.length === 0) {
      throw new Error('No elements found to convert');
    }
    
    // Create main container
    const mainContainer = figma.createFrame();
    mainContainer.name = 'HTML to Figma Conversion (Enhanced)';
    
    // Position in viewport center
    mainContainer.x = Math.round(figma.viewport.center.x - 700);
    mainContainer.y = Math.round(figma.viewport.center.y - 400);
    mainContainer.resize(1400, 100); // Will expand with content
    
    // Apply main container styling
    mainContainer.layoutMode = 'VERTICAL';
    mainContainer.primaryAxisSizingMode = 'AUTO'; // Hug content height
    mainContainer.counterAxisSizingMode = 'FIXED'; // Fixed width
    mainContainer.itemSpacing = 24;
    mainContainer.paddingTop = 40;
    mainContainer.paddingRight = 40;
    mainContainer.paddingBottom = 40;
    mainContainer.paddingLeft = 40;
    
    // CRITICAL FIX: Check if first element has body styles applied
    let mainContainerFills: Paint[] = [{ type: 'SOLID' as const, color: { r: 0, g: 0, b: 0 }, opacity: 1 }]; // Default black
    if (elements.length > 0 && elements[0].fills && (elements[0].fills as any).length > 0) {
      console.log('[BODY STYLES] First element has fills from body CSS:', elements[0].fills);
      mainContainerFills = elements[0].fills as Paint[];
    }
    mainContainer.fills = mainContainerFills;
    
    // CRITICAL DEBUG: Analyze visual properties in converted elements
    console.log('[CONVERSION DEBUG] Sample element analysis:');
    elements.slice(0, 3).forEach((el, idx) => {
      console.log(`Element ${idx}:`, {
        name: el.name,
        hasFills: !!(el.fills && (el.fills as any).length > 0),
        fillColors: el.fills?.map((f: any) => f.color),
        hasStrokes: !!(el.strokes && (el.strokes as any).length > 0),
        strokeWeight: (el as any).strokeWeight,
        fontSize: el.fontSize,
        fontWeight: el.fontName?.style
      });
    });
    
    // Convert elements with FULL CSS support
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      console.log('[FINAL PLUGIN] Processing element', i + 1, ':', element.name);
      debugElementProperties(element);
      
      try {
        const figmaNode = await createEnhancedFigmaNode(element, mainContainer);
        console.log('[FINAL PLUGIN] Element created successfully:', figmaNode.name);
      } catch (elementError) {
        console.error('[FINAL PLUGIN] Failed to create element:', element.name, elementError);
      }
    }
    
    // Add to page and focus
    figma.currentPage.appendChild(mainContainer);
    figma.currentPage.selection = [mainContainer];
    figma.viewport.scrollAndZoomIntoView([mainContainer]);
    
    console.log(`[FINAL PLUGIN] Conversion completed in ${Date.now() - startTime}ms`);
    figma.ui.postMessage({ type: 'success' });
    
  } catch (error) {
    console.error('[FINAL PLUGIN] Conversion failed:', error);
    figma.ui.postMessage({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Create Figma node with COMPLETE CSS properties
async function createEnhancedFigmaNode(element: any, parent: FrameNode): Promise<SceneNode> {
  if (element.type === 'TEXT') {
    return await createEnhancedTextNode(element, parent);
  } else {
    return await createEnhancedFrameNode(element, parent);
  }
}

// Create text node with full CSS text properties
async function createEnhancedTextNode(element: any, parent: FrameNode): Promise<TextNode> {
  console.log('[FINAL PLUGIN] Creating text:', element.characters?.substring(0, 50));
  
  // Extract ALL text styles
  const styles = extractCompleteTextStyles(element);
  
  // CRITICAL FIX: Determine font properties BEFORE creating the text node
  let fontFamily = 'Inter'; // Default to Inter instead of Arial
  let fontStyle = 'Regular';
  
  // Extract font from element or styles
  if (element.fontName) {
    fontFamily = element.fontName.family || fontFamily;
    fontStyle = element.fontName.style || fontStyle;
  } else if (styles['font-family']) {
    const fonts = styles['font-family'].split(',').map(f => f.trim().replace(/['\"]/g, ''));
    const firstFont = fonts[0];
    
    if (firstFont.toLowerCase().includes('arial')) fontFamily = 'Arial';
    else if (firstFont.toLowerCase().includes('inter')) fontFamily = 'Inter';
    else if (firstFont.toLowerCase().includes('roboto')) fontFamily = 'Roboto';
  }
  
  if (styles['font-weight'] === '700' || styles['font-weight'] === 'bold') {
    fontStyle = 'Bold';
  }
  
  // CRITICAL FIX: Load font FIRST before any text operations
  try {
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
    console.log('[FONT LOADING] Successfully loaded font:', fontFamily, fontStyle);
  } catch (error) {
    console.log('[FONT LOADING] Failed to load font:', fontFamily, fontStyle, '- falling back to Inter Regular');
    fontFamily = 'Inter';
    fontStyle = 'Regular';
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  }
  
  // Create text node AFTER font is loaded
  const textNode = figma.createText();
  textNode.name = element.name || 'Text';
  
  // Add to parent IMMEDIATELY after creation
  parent.appendChild(textNode);
  
  // Set font properties BEFORE setting characters
  textNode.fontName = { family: fontFamily, style: fontStyle };
  
  // THEN set the text content
  textNode.characters = element.characters || element.textContent || '';
  
  // Apply text-specific properties from element
  if (element.fontSize) {
    textNode.fontSize = element.fontSize;
  }
  
  // Apply text color if available
  if (element.fills && element.fills.length > 0) {
    textNode.fills = element.fills;
  }
  
  // Apply text alignment
  if (element.textAlignHorizontal) {
    textNode.textAlignHorizontal = element.textAlignHorizontal;
  }
  
  // Apply line height
  if (element.lineHeight) {
    textNode.lineHeight = element.lineHeight;
  }
  
  // Apply letter spacing
  if (element.letterSpacing) {
    textNode.letterSpacing = element.letterSpacing;
  }
  
  // Apply Auto Layout text constraints
  textNode.textAutoResize = 'HEIGHT'; // Always hug height
  
  // CRITICAL FIX: Text elements should fill parent containers
  if (parent.layoutMode !== 'NONE') {
    console.log('[TEXT AUTO LAYOUT] Setting text to FILL parent:', element.name || 'Text');
    if ('layoutSizingHorizontal' in textNode) {
      (textNode as any).layoutSizingHorizontal = 'FILL';
    }
    if ('layoutGrow' in textNode) {
      (textNode as any).layoutGrow = 1;
    }
    
    // Always hug height for text
    if ('layoutSizingVertical' in textNode) {
      (textNode as any).layoutSizingVertical = 'HUG';
    }
  }
  
  return textNode;
}

// Create frame node with COMPLETE CSS visual properties
async function createEnhancedFrameNode(element: any, parent: FrameNode): Promise<FrameNode> {
  console.log('[FINAL PLUGIN] Creating frame:', element.name);
  
  // CRITICAL DEBUG: Visual properties before Figma node creation
  console.log('[VISUAL DEBUG] Element visual data:', {
    fills: element.fills,
    strokes: element.strokes,
    strokeWeight: element.strokeWeight,
    hasVisualStyles: !!(element.fills || element.strokes),
    __cssProperties: element.__cssProperties
  });
  
  console.log('[CSS DEBUG] Frame element full data:', JSON.stringify({
    name: element.name,
    fills: element.fills,
    strokes: element.strokes,
    strokeWeight: element.strokeWeight,
    cornerRadius: element.cornerRadius,
    effects: element.effects,
    opacity: element.opacity
  }, null, 2));
  
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // Add to parent FIRST (critical for Auto Layout)
  parent.appendChild(frame);
  
  // Set dimensions
  const width = element.width || 300;
  const height = element.height || 100;
  frame.resize(width, height);
  
  // CRITICAL FIX: Apply visual styles BEFORE Auto Layout
  // This prevents Auto Layout from overriding visual properties
  if (element.fills !== undefined) {
    // CRITICAL: Handle both filled and transparent elements
    if (Array.isArray(element.fills) && element.fills.length > 0) {
      // Validate fill structure
      const validFills = element.fills.filter((fill: any) => 
        fill.type && fill.color && 
        typeof fill.color.r === 'number' &&
        typeof fill.color.g === 'number' &&
        typeof fill.color.b === 'number'
      );
      
      if (validFills.length > 0) {
        frame.fills = validFills;
        console.log('[CSS APPLICATION] Applied fills BEFORE Auto Layout:', validFills);
      } else {
        // Invalid fills - set transparent
        frame.fills = [];
        console.log('[CSS APPLICATION] Invalid fills - setting transparent');
      }
    } else if (Array.isArray(element.fills) && element.fills.length === 0) {
      // CRITICAL: Empty fills array = transparent
      frame.fills = [];
      console.log('[CSS APPLICATION] Applied transparent fills (empty array)');
    }
  } else {
    // No fills specified - default to transparent to prevent white background
    frame.fills = [];
    console.log('[CSS APPLICATION] No fills specified - defaulting to transparent');
  }
  
  // Apply borders/strokes BEFORE Auto Layout
  if (element.strokes && Array.isArray(element.strokes) && element.strokes.length > 0) {
    // Validate stroke structure
    const validStrokes = element.strokes.filter((stroke: any) => 
      stroke.type && stroke.color && 
      typeof stroke.color.r === 'number' &&
      typeof stroke.color.g === 'number' &&
      typeof stroke.color.b === 'number'
    );
    
    if (validStrokes.length > 0) {
      frame.strokes = validStrokes;
      frame.strokeWeight = element.strokeWeight || 1;
      frame.strokeAlign = 'INSIDE';
      console.log('[CSS APPLICATION] Applied strokes BEFORE Auto Layout:', validStrokes);
    }
  }
  
  // Apply corner radius BEFORE Auto Layout
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
    console.log('[CSS APPLICATION] Applied corner radius BEFORE Auto Layout:', element.cornerRadius);
  }
  
  // Apply effects BEFORE Auto Layout
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
    console.log('[CSS APPLICATION] Applied effects BEFORE Auto Layout:', element.effects);
  }
  
  // Apply opacity BEFORE Auto Layout
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
    console.log('[CSS APPLICATION] Applied opacity BEFORE Auto Layout:', element.opacity);
  }
  
  // Apply Auto Layout if element has it
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    frame.layoutMode = element.layoutMode;
    
    // Apply sizing modes from element
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    } else {
      frame.primaryAxisSizingMode = 'AUTO'; // Default to HUG
    }
    
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    } else {
      frame.counterAxisSizingMode = 'AUTO'; // Default to HUG
    }
    
    // CRITICAL FIX: Apply CSS alignment properties
    if (element.justifyContent) {
      console.log('[ALIGNMENT FIX] Applying justify-content:', element.justifyContent);
      switch (element.justifyContent) {
        case 'space-between':
          frame.primaryAxisAlignItems = 'SPACE_BETWEEN';
          break;
        case 'center':
          frame.primaryAxisAlignItems = 'CENTER';
          break;
        case 'flex-end':
        case 'end':
          frame.primaryAxisAlignItems = 'MAX';
          break;
        case 'flex-start':
        case 'start':
        default:
          frame.primaryAxisAlignItems = 'MIN';
          break;
      }
    }
    
    if (element.alignItems) {
      console.log('[ALIGNMENT FIX] Applying align-items:', element.alignItems);
      switch (element.alignItems) {
        case 'center':
          frame.counterAxisAlignItems = 'CENTER';
          break;
        case 'flex-end':
        case 'end':
          frame.counterAxisAlignItems = 'MAX';
          break;
        case 'flex-start':
        case 'start':
        default:
          frame.counterAxisAlignItems = 'MIN';
          break;
      }
    }
    
    // Apply spacing and padding
    frame.itemSpacing = element.itemSpacing || 0;
    frame.paddingTop = element.paddingTop || 0;
    frame.paddingRight = element.paddingRight || 0;
    frame.paddingBottom = element.paddingBottom || 0;
    frame.paddingLeft = element.paddingLeft || 0;
    
    // CRITICAL FIX: Apply grid wrapping properties
    if (element.isAutoFitGrid && element.layoutWrap) {
      console.log('[GRID WRAPPING] Applying wrap properties for:', element.name);
      if ('layoutWrap' in frame) {
        (frame as any).layoutWrap = element.layoutWrap;
      }
      if (element.counterAxisSpacing && 'counterAxisSpacing' in frame) {
        (frame as any).counterAxisSpacing = element.counterAxisSpacing;
      }
      console.log('[GRID WRAPPING] Applied layoutWrap and counterAxisSpacing');
    }
  }
  
  // NOTE: Visual styles already applied BEFORE Auto Layout to prevent overrides
  
  // CRITICAL FIX: Check for tracked CSS properties and reapply if needed
  if (element.__cssProperties) {
    console.log('[CSS RECOVERY] Found tracked CSS properties:', element.__cssProperties);
    
    // Reapply background if not set
    if ((!frame.fills || (frame.fills as any).length === 0) && element.__cssProperties.backgroundColor) {
      console.log('[CSS RECOVERY] Reapplying background color:', element.__cssProperties.backgroundColor);
      const color = parseColor(element.__cssProperties.backgroundColor);
      frame.fills = [{ type: 'SOLID', color, opacity: 1 }];
    }
    
    // Reapply border if not set
    if ((!frame.strokes || (frame.strokes as any).length === 0) && element.__cssProperties.borderColor) {
      console.log('[CSS RECOVERY] Reapplying border:', element.__cssProperties.borderColor, element.__cssProperties.borderWidth);
      const borderColor = parseColor(element.__cssProperties.borderColor);
      frame.strokes = [{ type: 'SOLID', color: borderColor, opacity: 1 }];
      frame.strokeWeight = element.__cssProperties.borderWidth || 1;
    }
  }
  
  // CRITICAL FIX: Apply Auto Layout child constraints for dashboard-container
  if (parent.layoutMode !== 'NONE') {
    // Dashboard container should FILL the main container width
    if (element.name && element.name.includes('dashboard-container')) {
      console.log('[AUTO LAYOUT FIX] Dashboard container: setting FILL width');
      if ('layoutSizingHorizontal' in frame) {
        (frame as any).layoutSizingHorizontal = 'FILL';
      }
      if ('layoutGrow' in frame) {
        (frame as any).layoutGrow = 1;
      }
    }
    
    // Check for special sizing flags from converter
    if (element.shouldFillParent || element.fillParentWidth) {
      console.log('[AUTO LAYOUT FIX] Element should fill parent:', element.name);
      if ('layoutSizingHorizontal' in frame) {
        (frame as any).layoutSizingHorizontal = 'FILL';
      }
      if ('layoutGrow' in frame) {
        (frame as any).layoutGrow = 1;
      }
    }
    
    // Apply centering for margin: 0 auto elements
    if (element.isCentered) {
      console.log('[AUTO LAYOUT FIX] Centering element with margin: 0 auto:', element.name);
      if ('layoutSizingHorizontal' in frame) {
        (frame as any).layoutSizingHorizontal = 'HUG';
      }
      // Parent container should center this element
      if (parent && 'primaryAxisAlignItems' in parent && parent.layoutMode === 'VERTICAL') {
        parent.primaryAxisAlignItems = 'CENTER';
      }
    }
    
    // Always hug content vertically unless specified
    if (!element.fixedHeight && 'layoutSizingVertical' in frame) {
      (frame as any).layoutSizingVertical = 'HUG';
    }
  }
  
  // Process children recursively
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      await createEnhancedFigmaNode(child, frame);
    }
  }
  
  return frame;
}

// Extract ALL text styles from element
function extractCompleteTextStyles(element: any): Record<string, string> {
  const styles: Record<string, string> = {};
  
  // Default to Inter (Figma's default font)
  styles['font-family'] = 'Inter';
  
  // Extract font weight
  if (element.fontName?.style) {
    styles['font-weight'] = element.fontName.style === 'Bold' ? '700' : '400';
  }
  
  // Extract font size
  if (element.fontSize) {
    styles['font-size'] = element.fontSize + 'px';
  }
  
  // Extract text color
  if (element.fills?.[0]?.color) {
    const color = element.fills[0].color;
    styles['color'] = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
  }
  
  // Extract text alignment
  if (element.textAlignHorizontal) {
    styles['text-align'] = element.textAlignHorizontal.toLowerCase();
  }
  
  // Extract line height
  if (element.lineHeight) {
    if (typeof element.lineHeight === 'object') {
      styles['line-height'] = element.lineHeight.value + (element.lineHeight.unit === 'PIXELS' ? 'px' : '%');
    }
  }
  
  // Extract letter spacing
  if (element.letterSpacing) {
    if (typeof element.letterSpacing === 'object') {
      styles['letter-spacing'] = element.letterSpacing.value + (element.letterSpacing.unit === 'PIXELS' ? 'px' : 'em');
    }
  }
  
  return styles;
}

// Apply COMPLETE visual styles from CSS
function applyCompleteVisualStyles(frame: FrameNode, element: any): void {
  console.log('[CSS APPLICATION] Applying visual styles to:', element.name);
  
  // CRITICAL: Apply background fills with validation
  if (element.fills && Array.isArray(element.fills) && element.fills.length > 0) {
    // Validate fill structure
    const validFills = element.fills.filter((fill: any) => 
      fill.type && fill.color && 
      typeof fill.color.r === 'number' &&
      typeof fill.color.g === 'number' &&
      typeof fill.color.b === 'number'
    );
    
    if (validFills.length > 0) {
      frame.fills = validFills;
      console.log('[CSS APPLICATION] Applied validated fills:', validFills);
    } else {
      console.log('[CSS APPLICATION] Invalid fill structure:', element.fills);
      frame.fills = [];
    }
  } else {
    // Ensure transparent background if no fills
    frame.fills = [];
    console.log('[CSS APPLICATION] No fills - set transparent');
  }
  
  // CRITICAL: Apply borders/strokes with validation
  if (element.strokes && Array.isArray(element.strokes) && element.strokes.length > 0) {
    // Validate stroke structure
    const validStrokes = element.strokes.filter((stroke: any) => 
      stroke.type && stroke.color && 
      typeof stroke.color.r === 'number' &&
      typeof stroke.color.g === 'number' &&
      typeof stroke.color.b === 'number'
    );
    
    if (validStrokes.length > 0) {
      frame.strokes = validStrokes;
      console.log('[CSS APPLICATION] Applied validated strokes:', validStrokes);
      
      // CRITICAL: Apply stroke weight (required for borders to appear)
      const strokeWeight = element.strokeWeight || 1;
      frame.strokeWeight = strokeWeight;
      console.log('[CSS APPLICATION] Applied stroke weight:', strokeWeight);
      
      // Apply stroke alignment (default to inside for CSS borders)
      frame.strokeAlign = 'INSIDE';
    } else {
      console.log('[CSS APPLICATION] Invalid stroke structure:', element.strokes);
    }
  } else {
    console.log('[CSS APPLICATION] No strokes found');
  }
  
  // CRITICAL: Apply effects (shadows, etc.)
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
    console.log('[CSS APPLICATION] Applied effects:', element.effects);
  }
  
  // Apply corner radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
    console.log('[CSS APPLICATION] Applied corner radius:', element.cornerRadius);
  }
  
  // Apply opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
    console.log('[CSS APPLICATION] Applied opacity:', element.opacity);
  }
  
  // Apply blend mode if specified
  if (element.blendMode) {
    frame.blendMode = element.blendMode;
    console.log('[CSS APPLICATION] Applied blend mode:', element.blendMode);
  }
  
  // Apply constraints if specified
  if (element.constraints) {
    frame.constraints = element.constraints;
    console.log('[CSS APPLICATION] Applied constraints:', element.constraints);
  }
}

// Parse CSS color to Figma color format
function parseColor(colorString: string): { r: number; g: number; b: number } {
  if (!colorString) return { r: 0, g: 0, b: 0 };

  // Handle hex colors
  if (colorString.startsWith('#')) {
    const hex = colorString.slice(1);
    let r: number, g: number, b: number;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    }

    return { r, g, b };
  }

  // Handle rgb/rgba colors
  const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]) / 255,
      g: parseInt(rgbMatch[2]) / 255,
      b: parseInt(rgbMatch[3]) / 255
    };
  }

  // Named colors
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 1, g: 1, b: 1 },
    'red': { r: 1, g: 0, b: 0 },
    'green': { r: 0, g: 1, b: 0 },
    'blue': { r: 0, g: 0, b: 1 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 },
    'grey': { r: 0.5, g: 0.5, b: 0.5 }
  };

  return namedColors[colorString.toLowerCase()] || { r: 0, g: 0, b: 0 };
}

// CRITICAL DEBUGGING: Show all properties on elements
function debugElementProperties(element: any): void {
  console.log('=== ELEMENT DEBUG ===');
  console.log('Name:', element.name);
  console.log('Type:', element.type);
  console.log('Has fills:', !!element.fills, 'Count:', element.fills?.length);
  console.log('Fills:', JSON.stringify(element.fills));
  console.log('Has strokes:', !!element.strokes, 'Count:', element.strokes?.length);
  console.log('Strokes:', JSON.stringify(element.strokes));
  console.log('Stroke weight:', element.strokeWeight);
  console.log('Corner radius:', element.cornerRadius);
  console.log('Effects:', JSON.stringify(element.effects));
  console.log('Opacity:', element.opacity);
  console.log('Width/Height:', element.width, 'x', element.height);
  console.log('Layout mode:', element.layoutMode);
  console.log('All properties:', Object.keys(element));
  console.log('===================');
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert') {
    console.log('[FINAL PLUGIN] Received conversion request');
    await convertToFigma(msg.html || '', msg.css || '');
  }
};