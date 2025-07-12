// Enhanced Figma Plugin - Complete CSS to Figma Conversion
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { FontManager } from '../utils/font-manager';
import { LayoutUtils } from '../utils/layout-utils';
import { parseColor, parseBorderWidth, type RGB } from '../utils/color-parser';

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

// Color parsing functions are now imported from utils/color-parser

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