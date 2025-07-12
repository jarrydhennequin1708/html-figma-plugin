// Enhanced main.ts with proper spacing, sizing, and font weight handling
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { ColorParser } from '../utils/color-parser-enhanced';

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Enhanced font manager with proper weight mapping
class EnhancedFontManager {
  private static loadedFonts = new Set<string>();
  
  // Map CSS font weights to Figma font styles
  private static WEIGHT_TO_STYLE: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black'
  };
  
  static async preloadCommonFonts(): Promise<void> {
    console.log('[FontManager] Starting font preload...');
    
    // Load Inter font family with all weights
    const interWeights = ['Thin', 'Extra Light', 'Light', 'Regular', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold', 'Black'];
    
    for (const style of interWeights) {
      try {
        await figma.loadFontAsync({ family: 'Inter', style });
        this.loadedFonts.add(`Inter-${style}`);
        console.log(`[FontManager] Loaded Inter ${style}`);
      } catch (e) {
        console.warn(`[FontManager] Could not load Inter ${style}`);
      }
    }
  }
  
  static mapFontWeight(cssWeight: string | number | undefined): string {
    if (!cssWeight) return 'Regular';
    
    const weight = cssWeight.toString();
    
    // Handle named weights
    if (weight === 'bold') return 'Bold';
    if (weight === 'normal') return 'Regular';
    if (weight === 'lighter') return 'Light';
    if (weight === 'bolder') return 'Extra Bold';
    
    // Handle numeric weights
    return this.WEIGHT_TO_STYLE[weight] || 'Regular';
  }
  
  static async loadFontForWeight(family: string, cssWeight: string | number | undefined): Promise<FontName> {
    const style = this.mapFontWeight(cssWeight);
    const fontKey = `${family}-${style}`;
    
    // Try to load the specific weight
    try {
      if (!this.loadedFonts.has(fontKey)) {
        await figma.loadFontAsync({ family, style });
        this.loadedFonts.add(fontKey);
      }
      return { family, style };
    } catch (e) {
      // Fallback to Regular if specific weight not available
      console.warn(`[FontManager] Falling back to ${family} Regular`);
      await figma.loadFontAsync({ family, style: 'Regular' });
      return { family, style: 'Regular' };
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
      container.counterAxisSizingMode = 'AUTO';
      container.fills = []; // Transparent background
      container.itemSpacing = 0;
      
      // Add to page first
      figma.currentPage.appendChild(container);
      
      // Create nodes with enhanced handling
      for (const element of elements) {
        try {
          const node = await createEnhancedFigmaNode(element, container);
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

// Parse CSS dimension values properly
function parseDimension(value: string | undefined): number {
  if (!value || value === 'auto') return 0;
  
  const cleanValue = value.toString().trim();
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) return 0;
  
  // Handle different units
  if (cleanValue.includes('rem')) {
    return numericValue * 16; // 1rem = 16px
  } else if (cleanValue.includes('em')) {
    return numericValue * 16; // Simplified: 1em = 16px
  }
  
  return numericValue;
}

// Parse padding shorthand
function parsePadding(padding: string | undefined): { top: number; right: number; bottom: number; left: number } {
  if (!padding) return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const parts = padding.trim().split(/\s+/).map(p => parseDimension(p));
  
  switch (parts.length) {
    case 1: return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2: return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default: return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

// Create enhanced Figma node with proper handling
async function createEnhancedFigmaNode(element: any, parent: FrameNode): Promise<SceneNode | null> {
  console.log('[CREATE NODE] Creating:', element.type, element.name);
  
  if (element.type === 'TEXT') {
    return await createEnhancedTextNode(element, parent);
  } else {
    return await createEnhancedFrameNode(element, parent);
  }
}

// Create text node with proper font weight
async function createEnhancedTextNode(element: any, parent: FrameNode): Promise<TextNode> {
  // Load font with proper weight
  const fontFamily = element.fontFamily || 'Inter';
  const fontName = await EnhancedFontManager.loadFontForWeight(fontFamily, element.fontWeight);
  
  const textNode = figma.createText();
  
  // Add to parent first
  parent.appendChild(textNode);
  
  // Set font and content
  textNode.fontName = fontName;
  textNode.characters = element.characters || '';
  
  // Apply font size
  if (element.fontSize) {
    textNode.fontSize = parseDimension(element.fontSize.toString());
  }
  
  // Apply color
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
  
  // Apply text properties
  if (element.textAlignHorizontal) {
    textNode.textAlignHorizontal = element.textAlignHorizontal;
  }
  
  if (element.lineHeight) {
    const lineHeight = parseDimension(element.lineHeight.toString());
    if (lineHeight > 0) {
      if (element.lineHeight.toString().includes('%')) {
        textNode.lineHeight = { value: lineHeight, unit: 'PERCENT' };
      } else if (lineHeight < 3) {
        // Unitless multiplier
        textNode.lineHeight = { value: lineHeight * 100, unit: 'PERCENT' };
      } else {
        textNode.lineHeight = { value: lineHeight, unit: 'PIXELS' };
      }
    }
  }
  
  if (element.letterSpacing) {
    textNode.letterSpacing = { value: parseDimension(element.letterSpacing.toString()), unit: 'PIXELS' };
  }
  
  textNode.textAutoResize = 'HEIGHT';
  
  console.log('[TEXT] Created text with font:', fontName.family, fontName.style);
  
  return textNode;
}

// Create frame node with enhanced spacing and sizing
async function createEnhancedFrameNode(element: any, parent: FrameNode): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.name || 'Frame';
  
  // STEP 1: Add to parent immediately
  parent.appendChild(frame);
  
  // STEP 2: Apply visual properties first
  
  // Background color
  if (element.fills && element.fills.length > 0) {
    frame.fills = element.fills;
  } else if (element.backgroundColor) {
    const bgColor = ColorParser.parseColor(element.backgroundColor);
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
  }
  
  // Border radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
  } else if (element.borderRadius) {
    frame.cornerRadius = parseDimension(element.borderRadius.toString());
  }
  
  // Effects
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
  }
  
  // Opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
  }
  
  // STEP 3: Apply initial size
  const width = element.width || 100;
  const height = element.height || 100;
  frame.resize(width, height);
  
  // STEP 4: Apply Auto Layout with proper spacing
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    frame.layoutMode = element.layoutMode;
    
    // CRITICAL: Parse actual gap value, not default
    if (element.gap !== undefined) {
      frame.itemSpacing = parseDimension(element.gap.toString());
      console.log('[SPACING] Applied gap:', element.gap, '→', frame.itemSpacing);
    } else if (element.itemSpacing !== undefined) {
      frame.itemSpacing = element.itemSpacing;
    } else {
      frame.itemSpacing = 0; // No default gap
    }
    
    // CRITICAL: Parse actual padding values
    if (element.padding) {
      const padding = parsePadding(element.padding.toString());
      frame.paddingTop = padding.top;
      frame.paddingRight = padding.right;
      frame.paddingBottom = padding.bottom;
      frame.paddingLeft = padding.left;
      console.log('[SPACING] Applied padding:', element.padding, '→', padding);
    } else {
      // Apply individual padding values
      frame.paddingTop = element.paddingTop || 0;
      frame.paddingRight = element.paddingRight || 0;
      frame.paddingBottom = element.paddingBottom || 0;
      frame.paddingLeft = element.paddingLeft || 0;
    }
    
    // Apply sizing modes for responsive behavior
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    } else {
      // Smart defaults based on content
      frame.primaryAxisSizingMode = 'AUTO';
    }
    
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    } else {
      // Check for max-width pattern
      if (element.maxWidth || element.styles?.maxWidth) {
        frame.counterAxisSizingMode = 'FIXED';
        const maxWidth = parseDimension((element.maxWidth || element.styles?.maxWidth || '').toString());
        if (maxWidth > 0) {
          frame.resize(maxWidth, frame.height);
        }
      } else {
        frame.counterAxisSizingMode = 'AUTO';
      }
    }
    
    // Apply alignment
    if (element.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = element.primaryAxisAlignItems;
    } else if (element.justifyContent) {
      const alignMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'space-between': 'SPACE_BETWEEN'
      };
      frame.primaryAxisAlignItems = alignMap[element.justifyContent] || 'MIN';
    }
    
    if (element.counterAxisAlignItems) {
      frame.counterAxisAlignItems = element.counterAxisAlignItems;
    } else if (element.alignItems) {
      const alignMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX'
      };
      frame.counterAxisAlignItems = alignMap[element.alignItems] || 'MIN';
    }
    
    // Handle grid wrapping
    if (element.layoutWrap === 'WRAP' && 'layoutWrap' in frame) {
      (frame as any).layoutWrap = 'WRAP';
      
      if (element.counterAxisSpacing && 'counterAxisSpacing' in frame) {
        (frame as any).counterAxisSpacing = element.counterAxisSpacing;
      }
    }
  }
  
  // STEP 5: Process children
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      const childNode = await createEnhancedFigmaNode(child, frame);
      
      // Apply responsive sizing to children
      if (childNode && frame.layoutMode !== 'NONE' && 'layoutSizingHorizontal' in childNode) {
        // Check if child should fill parent
        if (child.shouldFillParent || child.fillParentWidth || 
            child.layoutSizingHorizontal === 'FILL' ||
            (!child.width && !child.maxWidth)) {
          (childNode as any).layoutSizingHorizontal = 'FILL';
        }
        
        // Vertical sizing
        if (!child.height || child.layoutSizingVertical === 'HUG') {
          (childNode as any).layoutSizingVertical = 'HUG';
        }
      }
    }
  }
  
  return frame;
}