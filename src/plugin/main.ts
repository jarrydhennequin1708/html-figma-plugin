// Enhanced Figma Plugin - Complete CSS to Figma Conversion
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { FontManager } from '../converter/FontManager';
import { LayoutUtils } from '../converter/layout-utils';

// Show the UI
figma.showUI(__html__, { width: 400, height: 500 });

// Enhanced conversion function with full CSS support
async function convertToFigma(htmlContent: string, cssContent: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('====================================');
    console.log('[CONVERSION START] Enhanced CSS to Figma');
    console.log('[INPUT] HTML length:', htmlContent?.length || 0);
    console.log('[INPUT] CSS length:', cssContent?.length || 0);
    console.log('====================================');
    
    // Pre-load fonts using enhanced font manager
    console.log('[FONTS] Pre-loading common fonts...');
    await FontManager.preloadCommonFonts();
    console.log('[FONTS] Pre-loading complete');
    
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
    console.log('[CONVERTER] Starting HTML/CSS conversion...');
    const elements = await converter.convert(htmlContent, cssContent);
    console.log('[CONVERTER] Successfully converted to', elements.length, 'elements');
    
    if (elements.length === 0) {
      console.error('[ERROR] No elements found to convert');
      throw new Error('No elements found to convert. Please check your HTML input.');
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
    console.log('[PROCESSING] Converting', elements.length, 'elements to Figma nodes...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      console.log(`\n[ELEMENT ${i + 1}/${elements.length}] Processing:`, element.name);
      
      if (element.fills || element.strokes || element.effects) {
        console.log('[VISUAL] Has visual properties:', {
          fills: !!element.fills,
          strokes: !!element.strokes,
          effects: !!element.effects
        });
      }
      
      try {
        const figmaNode = await createEnhancedFigmaNode(element, mainContainer);
        console.log(`[SUCCESS] Created node: ${figmaNode.name}`);
        successCount++;
      } catch (elementError) {
        console.error(`[ERROR] Failed to create element: ${element.name}`);
        console.error('[ERROR DETAILS]', elementError);
        errorCount++;
      }
    }
    
    console.log(`\n[SUMMARY] Conversion complete:`);
    console.log(`  - Success: ${successCount} elements`);
    console.log(`  - Errors: ${errorCount} elements`);
    console.log(`  - Total time: ${Date.now() - startTime}ms`);
    
    // Add to page and focus
    figma.currentPage.appendChild(mainContainer);
    figma.currentPage.selection = [mainContainer];
    figma.viewport.scrollAndZoomIntoView([mainContainer]);
    
    console.log('\n====================================');
    console.log('[CONVERSION COMPLETE] Success!');
    console.log('====================================\n');
    
    figma.ui.postMessage({ 
      type: 'success',
      stats: {
        totalElements: elements.length,
        successCount,
        errorCount,
        duration: Date.now() - startTime
      }
    });
    
  } catch (error) {
    console.error('\n====================================');
    console.error('[CONVERSION FAILED]');
    console.error('[ERROR TYPE]:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[ERROR MESSAGE]:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('[STACK TRACE]:', error.stack);
    }
    console.error('====================================\n');
    
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
  console.log('[TEXT] Creating text node:', element.characters?.substring(0, 50) || '[empty]');
  
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
  console.log('[FRAME] Creating frame:', element.name);
  
  // Log visual properties if present
  if (element.fills || element.strokes || element.effects) {
    console.log('[VISUAL] Frame has visual properties:', {
      fills: element.fills?.length || 0,
      strokes: element.strokes?.length || 0,
      effects: element.effects?.length || 0,
      cornerRadius: element.cornerRadius || 0
    });
  }
  
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // STEP 1: Add to parent immediately (required for Auto Layout)
  parent.appendChild(frame);
  
  // STEP 2: Apply visual properties BEFORE Auto Layout (Critical!)
  // Background
  if (element.fills && Array.isArray(element.fills) && element.fills.length > 0) {
    const validFills = element.fills.filter((fill: any) => 
      fill.type && fill.color && 
      typeof fill.color.r === 'number' &&
      typeof fill.color.g === 'number' &&
      typeof fill.color.b === 'number'
    );
    
    if (validFills.length > 0) {
      frame.fills = validFills;
      console.log('[VISUAL PROPS] Applied fills:', validFills);
    }
  }
  
  // Borders
  if (element.strokes && Array.isArray(element.strokes) && element.strokes.length > 0) {
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
      console.log('[VISUAL PROPS] Applied strokes:', validStrokes, 'weight:', element.strokeWeight);
    }
  }
  
  // Border radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
    console.log('[VISUAL PROPS] Applied corner radius:', element.cornerRadius);
  }
  
  // Effects (shadows, etc.)
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
    console.log('[VISUAL PROPS] Applied effects:', element.effects);
  }
  
  // Opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
    console.log('[VISUAL PROPS] Applied opacity:', element.opacity);
  }
  
  // Store padding for later Auto Layout use
  if (element.paddingTop || element.paddingRight || element.paddingBottom || element.paddingLeft) {
    frame.setPluginData('padding', JSON.stringify({
      top: element.paddingTop || 0,
      right: element.paddingRight || 0,
      bottom: element.paddingBottom || 0,
      left: element.paddingLeft || 0
    }));
  }
  
  // STEP 3: NOW apply Auto Layout if needed
  try {
    // Check for absolute positioning first
    if (element.computedStyles?.position === 'absolute') {
      const absFrame = LayoutUtils.handleAbsolutePosition(element, parent);
      if (absFrame) {
        // Copy visual properties to absolute frame
        absFrame.fills = frame.fills;
        absFrame.strokes = frame.strokes;
        absFrame.strokeWeight = frame.strokeWeight;
        absFrame.cornerRadius = frame.cornerRadius;
        absFrame.effects = frame.effects;
        absFrame.opacity = frame.opacity;
        // Remove the regular frame and use absolute frame instead
        frame.remove();
        return absFrame;
      }
    }
    
    // Apply Auto Layout for flex/grid
    const styles = element.computedStyles || {};
    if (styles.display === 'flex' || styles.display === 'inline-flex') {
      await LayoutUtils.setupAutoLayout(frame, styles);
    } else if (styles.display === 'grid') {
      LayoutUtils.convertGridToAutoLayout(frame, styles);
    } else if (element.layoutMode && element.layoutMode !== 'NONE') {
      // Fallback to element's layout mode
      frame.layoutMode = element.layoutMode;
      
      // Apply stored padding
      const paddingData = frame.getPluginData('padding');
      if (paddingData) {
        const padding = JSON.parse(paddingData);
        frame.paddingTop = padding.top;
        frame.paddingRight = padding.right;
        frame.paddingBottom = padding.bottom;
        frame.paddingLeft = padding.left;
      }
      
      // Apply spacing
      frame.itemSpacing = element.itemSpacing || 0;
    }
  } catch (layoutError) {
    console.error('[LAYOUT ERROR] Failed to apply layout:', layoutError);
  }
  
  // STEP 4: Set dimensions (after Auto Layout to respect sizing modes)
  const width = element.width || 300;
  const height = element.height || 100;
  if (!element.layoutMode || element.layoutMode === 'NONE') {
    frame.resize(width, height);
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

// Comprehensive CSS color parser
function parseColor(cssColor: string): RGB | null {
  if (!cssColor || cssColor === 'transparent') return null;
  
  // Remove spaces and lowercase
  const color = cssColor.replace(/\s/g, '').toLowerCase();
  
  // 3-digit hex: #rgb
  if (/^#[0-9a-f]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split('').map(c => 
      parseInt(c + c, 16) / 255
    );
    return { r, g, b };
  }
  
  // 6-digit hex: #rrggbb
  if (/^#[0-9a-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  
  // 8-digit hex: #rrggbbaa (ignore alpha)
  if (/^#[0-9a-f]{8}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  
  // rgb(r, g, b) or rgb(r g b)
  const rgbMatch = color.match(/^rgb\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\)$/);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255
    };
  }
  
  // rgba(r, g, b, a) - ignore alpha
  const rgbaMatch = color.match(/^rgba\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\s*,?\s*[\d.]+\)$/);
  if (rgbaMatch) {
    const [_, r, g, b] = rgbaMatch;
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255
    };
  }
  
  // hsl/hsla conversion
  const hslMatch = color.match(/^hsla?\((\d+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/);
  if (hslMatch) {
    const [_, h, s, l] = hslMatch;
    const hNum = parseInt(h) / 360;
    const sNum = parseFloat(s) / 100;
    const lNum = parseFloat(l) / 100;
    return hslToRgb(hNum, sNum, lNum);
  }
  
  // Extended named colors
  const namedColors: Record<string, RGB> = {
    'aliceblue': { r: 0.94, g: 0.97, b: 1 },
    'antiquewhite': { r: 0.98, g: 0.92, b: 0.84 },
    'aqua': { r: 0, g: 1, b: 1 },
    'aquamarine': { r: 0.5, g: 1, b: 0.83 },
    'azure': { r: 0.94, g: 1, b: 1 },
    'beige': { r: 0.96, g: 0.96, b: 0.86 },
    'bisque': { r: 1, g: 0.89, b: 0.77 },
    'black': { r: 0, g: 0, b: 0 },
    'blanchedalmond': { r: 1, g: 0.92, b: 0.8 },
    'blue': { r: 0, g: 0, b: 1 },
    'blueviolet': { r: 0.54, g: 0.17, b: 0.89 },
    'brown': { r: 0.65, g: 0.16, b: 0.16 },
    'burlywood': { r: 0.87, g: 0.72, b: 0.53 },
    'cadetblue': { r: 0.37, g: 0.62, b: 0.63 },
    'chartreuse': { r: 0.5, g: 1, b: 0 },
    'chocolate': { r: 0.82, g: 0.41, b: 0.12 },
    'coral': { r: 1, g: 0.5, b: 0.31 },
    'cornflowerblue': { r: 0.39, g: 0.58, b: 0.93 },
    'cornsilk': { r: 1, g: 0.97, b: 0.86 },
    'crimson': { r: 0.86, g: 0.08, b: 0.24 },
    'cyan': { r: 0, g: 1, b: 1 },
    'darkblue': { r: 0, g: 0, b: 0.55 },
    'darkcyan': { r: 0, g: 0.55, b: 0.55 },
    'darkgoldenrod': { r: 0.72, g: 0.53, b: 0.04 },
    'darkgray': { r: 0.66, g: 0.66, b: 0.66 },
    'darkgrey': { r: 0.66, g: 0.66, b: 0.66 },
    'darkgreen': { r: 0, g: 0.39, b: 0 },
    'darkkhaki': { r: 0.74, g: 0.72, b: 0.42 },
    'darkmagenta': { r: 0.55, g: 0, b: 0.55 },
    'darkolivegreen': { r: 0.33, g: 0.42, b: 0.18 },
    'darkorange': { r: 1, g: 0.55, b: 0 },
    'darkorchid': { r: 0.6, g: 0.2, b: 0.8 },
    'darkred': { r: 0.55, g: 0, b: 0 },
    'darksalmon': { r: 0.91, g: 0.59, b: 0.48 },
    'darkseagreen': { r: 0.56, g: 0.74, b: 0.56 },
    'darkslateblue': { r: 0.28, g: 0.24, b: 0.55 },
    'darkslategray': { r: 0.18, g: 0.31, b: 0.31 },
    'darkslategrey': { r: 0.18, g: 0.31, b: 0.31 },
    'darkturquoise': { r: 0, g: 0.81, b: 0.82 },
    'darkviolet': { r: 0.58, g: 0, b: 0.83 },
    'deeppink': { r: 1, g: 0.08, b: 0.58 },
    'deepskyblue': { r: 0, g: 0.75, b: 1 },
    'dimgray': { r: 0.41, g: 0.41, b: 0.41 },
    'dimgrey': { r: 0.41, g: 0.41, b: 0.41 },
    'dodgerblue': { r: 0.12, g: 0.56, b: 1 },
    'firebrick': { r: 0.7, g: 0.13, b: 0.13 },
    'floralwhite': { r: 1, g: 0.98, b: 0.94 },
    'forestgreen': { r: 0.13, g: 0.55, b: 0.13 },
    'fuchsia': { r: 1, g: 0, b: 1 },
    'gainsboro': { r: 0.86, g: 0.86, b: 0.86 },
    'ghostwhite': { r: 0.97, g: 0.97, b: 1 },
    'gold': { r: 1, g: 0.84, b: 0 },
    'goldenrod': { r: 0.85, g: 0.65, b: 0.13 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 },
    'grey': { r: 0.5, g: 0.5, b: 0.5 },
    'green': { r: 0, g: 0.5, b: 0 },
    'greenyellow': { r: 0.68, g: 1, b: 0.18 },
    'honeydew': { r: 0.94, g: 1, b: 0.94 },
    'hotpink': { r: 1, g: 0.41, b: 0.71 },
    'indianred': { r: 0.8, g: 0.36, b: 0.36 },
    'indigo': { r: 0.29, g: 0, b: 0.51 },
    'ivory': { r: 1, g: 1, b: 0.94 },
    'khaki': { r: 0.94, g: 0.9, b: 0.55 },
    'lavender': { r: 0.9, g: 0.9, b: 0.98 },
    'lavenderblush': { r: 1, g: 0.94, b: 0.96 },
    'lawngreen': { r: 0.49, g: 0.99, b: 0 },
    'lemonchiffon': { r: 1, g: 0.98, b: 0.8 },
    'lightblue': { r: 0.68, g: 0.85, b: 0.9 },
    'lightcoral': { r: 0.94, g: 0.5, b: 0.5 },
    'lightcyan': { r: 0.88, g: 1, b: 1 },
    'lightgoldenrodyellow': { r: 0.98, g: 0.98, b: 0.82 },
    'lightgray': { r: 0.83, g: 0.83, b: 0.83 },
    'lightgrey': { r: 0.83, g: 0.83, b: 0.83 },
    'lightgreen': { r: 0.56, g: 0.93, b: 0.56 },
    'lightpink': { r: 1, g: 0.71, b: 0.76 },
    'lightsalmon': { r: 1, g: 0.63, b: 0.48 },
    'lightseagreen': { r: 0.13, g: 0.7, b: 0.67 },
    'lightskyblue': { r: 0.53, g: 0.81, b: 0.98 },
    'lightslategray': { r: 0.47, g: 0.53, b: 0.6 },
    'lightslategrey': { r: 0.47, g: 0.53, b: 0.6 },
    'lightsteelblue': { r: 0.69, g: 0.77, b: 0.87 },
    'lightyellow': { r: 1, g: 1, b: 0.88 },
    'lime': { r: 0, g: 1, b: 0 },
    'limegreen': { r: 0.2, g: 0.8, b: 0.2 },
    'linen': { r: 0.98, g: 0.94, b: 0.9 },
    'magenta': { r: 1, g: 0, b: 1 },
    'maroon': { r: 0.5, g: 0, b: 0 },
    'mediumaquamarine': { r: 0.4, g: 0.8, b: 0.67 },
    'mediumblue': { r: 0, g: 0, b: 0.8 },
    'mediumorchid': { r: 0.73, g: 0.33, b: 0.83 },
    'mediumpurple': { r: 0.58, g: 0.44, b: 0.86 },
    'mediumseagreen': { r: 0.24, g: 0.7, b: 0.44 },
    'mediumslateblue': { r: 0.48, g: 0.41, b: 0.93 },
    'mediumspringgreen': { r: 0, g: 0.98, b: 0.6 },
    'mediumturquoise': { r: 0.28, g: 0.82, b: 0.8 },
    'mediumvioletred': { r: 0.78, g: 0.08, b: 0.52 },
    'midnightblue': { r: 0.1, g: 0.1, b: 0.44 },
    'mintcream': { r: 0.96, g: 1, b: 0.98 },
    'mistyrose': { r: 1, g: 0.89, b: 0.88 },
    'moccasin': { r: 1, g: 0.89, b: 0.71 },
    'navajowhite': { r: 1, g: 0.87, b: 0.68 },
    'navy': { r: 0, g: 0, b: 0.5 },
    'oldlace': { r: 0.99, g: 0.96, b: 0.9 },
    'olive': { r: 0.5, g: 0.5, b: 0 },
    'olivedrab': { r: 0.42, g: 0.56, b: 0.14 },
    'orange': { r: 1, g: 0.65, b: 0 },
    'orangered': { r: 1, g: 0.27, b: 0 },
    'orchid': { r: 0.85, g: 0.44, b: 0.84 },
    'palegoldenrod': { r: 0.93, g: 0.91, b: 0.67 },
    'palegreen': { r: 0.6, g: 0.98, b: 0.6 },
    'paleturquoise': { r: 0.69, g: 0.93, b: 0.93 },
    'palevioletred': { r: 0.86, g: 0.44, b: 0.58 },
    'papayawhip': { r: 1, g: 0.94, b: 0.84 },
    'peachpuff': { r: 1, g: 0.85, b: 0.73 },
    'peru': { r: 0.8, g: 0.52, b: 0.25 },
    'pink': { r: 1, g: 0.75, b: 0.8 },
    'plum': { r: 0.87, g: 0.63, b: 0.87 },
    'powderblue': { r: 0.69, g: 0.88, b: 0.9 },
    'purple': { r: 0.5, g: 0, b: 0.5 },
    'rebeccapurple': { r: 0.4, g: 0.2, b: 0.6 },
    'red': { r: 1, g: 0, b: 0 },
    'rosybrown': { r: 0.74, g: 0.56, b: 0.56 },
    'royalblue': { r: 0.25, g: 0.41, b: 0.88 },
    'saddlebrown': { r: 0.55, g: 0.27, b: 0.07 },
    'salmon': { r: 0.98, g: 0.5, b: 0.45 },
    'sandybrown': { r: 0.96, g: 0.64, b: 0.38 },
    'seagreen': { r: 0.18, g: 0.55, b: 0.34 },
    'seashell': { r: 1, g: 0.96, b: 0.93 },
    'sienna': { r: 0.63, g: 0.32, b: 0.18 },
    'silver': { r: 0.75, g: 0.75, b: 0.75 },
    'skyblue': { r: 0.53, g: 0.81, b: 0.92 },
    'slateblue': { r: 0.42, g: 0.35, b: 0.8 },
    'slategray': { r: 0.44, g: 0.5, b: 0.56 },
    'slategrey': { r: 0.44, g: 0.5, b: 0.56 },
    'snow': { r: 1, g: 0.98, b: 0.98 },
    'springgreen': { r: 0, g: 1, b: 0.5 },
    'steelblue': { r: 0.27, g: 0.51, b: 0.71 },
    'tan': { r: 0.82, g: 0.71, b: 0.55 },
    'teal': { r: 0, g: 0.5, b: 0.5 },
    'thistle': { r: 0.85, g: 0.75, b: 0.85 },
    'tomato': { r: 1, g: 0.39, b: 0.28 },
    'turquoise': { r: 0.25, g: 0.88, b: 0.82 },
    'violet': { r: 0.93, g: 0.51, b: 0.93 },
    'wheat': { r: 0.96, g: 0.87, b: 0.7 },
    'white': { r: 1, g: 1, b: 1 },
    'whitesmoke': { r: 0.96, g: 0.96, b: 0.96 },
    'yellow': { r: 1, g: 1, b: 0 },
    'yellowgreen': { r: 0.6, g: 0.8, b: 0.2 }
  };
  
  return namedColors[color] || null;
}

// HSL to RGB conversion helper
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return { r, g, b };
}

// Type definition
interface RGB {
  r: number;
  g: number;
  b: number;
}

// Enhanced debugging for element properties
function debugElementProperties(element: any): void {
  if (!element) return;
  
  const visualProps = {
    name: element.name,
    type: element.type,
    fills: element.fills?.length || 0,
    strokes: element.strokes?.length || 0,
    effects: element.effects?.length || 0,
    opacity: element.opacity,
    cornerRadius: element.cornerRadius
  };
  
  const layoutProps = {
    layoutMode: element.layoutMode,
    width: element.width,
    height: element.height,
    primaryAxisSizing: element.primaryAxisSizingMode,
    counterAxisSizing: element.counterAxisSizingMode
  };
  
  console.log('[DEBUG] Element properties:', {
    visual: visualProps,
    layout: layoutProps
  });
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert') {
    console.log('[FINAL PLUGIN] Received conversion request');
    await convertToFigma(msg.html || '', msg.css || '');
  }
};