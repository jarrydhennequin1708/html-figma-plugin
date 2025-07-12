// Fixed font manager with proper font family parsing
export class FixedFontManager {
  private static loadedFonts = new Set<string>();
  
  // Map CSS font names to Figma fonts
  private static FONT_FAMILY_MAPPING: Record<string, string> = {
    '-apple-system': 'Inter',
    'BlinkMacSystemFont': 'Inter',
    'Segoe UI': 'Inter',
    'Roboto': 'Inter',
    'Helvetica Neue': 'Inter',
    'Helvetica': 'Inter',
    'Arial': 'Inter',
    'sans-serif': 'Inter',
    'system-ui': 'Inter',
    'ui-sans-serif': 'Inter',
    
    // Serif fonts
    'Times New Roman': 'Inter',
    'Times': 'Inter',
    'Georgia': 'Inter',
    'serif': 'Inter',
    
    // Monospace fonts
    'Courier': 'Roboto Mono',
    'Courier New': 'Roboto Mono',
    'Consolas': 'Roboto Mono',
    'Monaco': 'Roboto Mono',
    'monospace': 'Roboto Mono',
    'ui-monospace': 'Roboto Mono'
  };
  
  // Map CSS font weights to Figma styles
  private static FONT_WEIGHT_MAPPING: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black',
    'normal': 'Regular',
    'bold': 'Bold',
    'lighter': 'Light',
    'bolder': 'Extra Bold'
  };
  
  static parseFontFamily(cssFont: string): string {
    if (!cssFont) return 'Inter';
    
    console.log('[FontManager] Parsing font family:', cssFont);
    
    // Split by comma and clean up each font
    const fonts = cssFont.split(',').map(f => f.trim().replace(/['"]/g, ''));
    
    // Find first available font in our mapping
    for (const font of fonts) {
      const cleanFont = font.trim();
      
      // Direct match
      if (this.FONT_FAMILY_MAPPING[cleanFont]) {
        console.log(`[FontManager] Mapped '${cleanFont}' to '${this.FONT_FAMILY_MAPPING[cleanFont]}'`);
        return this.FONT_FAMILY_MAPPING[cleanFont];
      }
      
      // Partial match (for fonts with variations)
      for (const [key, value] of Object.entries(this.FONT_FAMILY_MAPPING)) {
        if (cleanFont.toLowerCase().includes(key.toLowerCase())) {
          console.log(`[FontManager] Partial match '${cleanFont}' to '${value}'`);
          return value;
        }
      }
    }
    
    console.log(`[FontManager] No mapping found for '${cssFont}', using Inter`);
    return 'Inter';
  }
  
  static parseFontWeight(cssWeight: string | number | undefined): string {
    if (!cssWeight) return 'Regular';
    
    const weight = cssWeight.toString().trim();
    const mapped = this.FONT_WEIGHT_MAPPING[weight];
    
    if (mapped) {
      console.log(`[FontManager] Mapped weight '${weight}' to '${mapped}'`);
      return mapped;
    }
    
    // Handle numeric ranges
    const numWeight = parseInt(weight);
    if (!isNaN(numWeight)) {
      if (numWeight <= 100) return 'Thin';
      if (numWeight <= 200) return 'Extra Light';
      if (numWeight <= 300) return 'Light';
      if (numWeight <= 400) return 'Regular';
      if (numWeight <= 500) return 'Medium';
      if (numWeight <= 600) return 'Semi Bold';
      if (numWeight <= 700) return 'Bold';
      if (numWeight <= 800) return 'Extra Bold';
      return 'Black';
    }
    
    console.log(`[FontManager] Unknown weight '${weight}', using Regular`);
    return 'Regular';
  }
  
  static async preloadFonts(): Promise<void> {
    console.log('[FontManager] Preloading common fonts...');
    
    const fontsToLoad: FontName[] = [
      // Inter with all weights
      { family: 'Inter', style: 'Thin' },
      { family: 'Inter', style: 'Extra Light' },
      { family: 'Inter', style: 'Light' },
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Extra Bold' },
      { family: 'Inter', style: 'Black' },
      
      // Roboto Mono for code
      { family: 'Roboto Mono', style: 'Regular' },
      { family: 'Roboto Mono', style: 'Bold' }
    ];
    
    for (const font of fontsToLoad) {
      const key = `${font.family}-${font.style}`;
      if (!this.loadedFonts.has(key)) {
        try {
          await figma.loadFontAsync(font);
          this.loadedFonts.add(key);
          console.log(`[FontManager] Loaded ${key}`);
        } catch (e) {
          console.warn(`[FontManager] Could not load ${key}`);
        }
      }
    }
  }
  
  static async loadFont(family: string, style: string): Promise<FontName> {
    const key = `${family}-${style}`;
    
    // Try to load the exact font
    try {
      if (!this.loadedFonts.has(key)) {
        await figma.loadFontAsync({ family, style });
        this.loadedFonts.add(key);
        console.log(`[FontManager] Loaded ${key}`);
      }
      return { family, style };
    } catch (e) {
      console.warn(`[FontManager] Failed to load ${key}, trying fallbacks`);
      
      // Try fallback styles for the same family
      const fallbackStyles = ['Regular', 'Medium', 'Bold'];
      for (const fallbackStyle of fallbackStyles) {
        const fallbackKey = `${family}-${fallbackStyle}`;
        try {
          if (!this.loadedFonts.has(fallbackKey)) {
            await figma.loadFontAsync({ family, style: fallbackStyle });
            this.loadedFonts.add(fallbackKey);
          }
          console.log(`[FontManager] Using fallback ${fallbackKey}`);
          return { family, style: fallbackStyle };
        } catch (e2) {
          // Continue to next fallback
        }
      }
      
      // Final fallback to Inter Regular
      const defaultKey = 'Inter-Regular';
      if (!this.loadedFonts.has(defaultKey)) {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        this.loadedFonts.add(defaultKey);
      }
      console.log(`[FontManager] Using final fallback Inter Regular`);
      return { family: 'Inter', style: 'Regular' };
    }
  }
  
  static async createTextNode(
    content: string,
    styles: any,
    parent?: FrameNode
  ): Promise<TextNode> {
    // Parse font properties
    const fontFamily = this.parseFontFamily(styles.fontFamily || 'Inter');
    const fontStyle = this.parseFontWeight(styles.fontWeight);
    
    // Load font
    const font = await this.loadFont(fontFamily, fontStyle);
    
    // Create text node
    const textNode = figma.createText();
    
    // Add to parent if provided
    if (parent) {
      parent.appendChild(textNode);
    }
    
    // Set font AFTER loading
    textNode.fontName = font;
    textNode.characters = content;
    textNode.textAutoResize = 'HEIGHT';
    
    // Apply font size
    if (styles.fontSize) {
      const size = this.parseDimension(styles.fontSize);
      if (size > 0) {
        textNode.fontSize = size;
      }
    }
    
    // Apply text color
    if (styles.color) {
      const color = this.parseColor(styles.color);
      if (color) {
        textNode.fills = [{
          type: 'SOLID',
          color: { r: color.r, g: color.g, b: color.b }
        }];
      }
    }
    
    // Apply text alignment
    if (styles.textAlign) {
      const alignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
        'left': 'LEFT',
        'center': 'CENTER',
        'right': 'RIGHT',
        'justify': 'JUSTIFIED'
      };
      textNode.textAlignHorizontal = alignMap[styles.textAlign] || 'LEFT';
    }
    
    // Apply line height
    if (styles.lineHeight) {
      const lineHeight = this.parseDimension(styles.lineHeight);
      if (lineHeight > 0) {
        if (styles.lineHeight.includes('%')) {
          textNode.lineHeight = { value: lineHeight, unit: 'PERCENT' };
        } else if (lineHeight < 3) {
          // Unitless multiplier
          textNode.lineHeight = { value: lineHeight * 100, unit: 'PERCENT' };
        } else {
          textNode.lineHeight = { value: lineHeight, unit: 'PIXELS' };
        }
      }
    }
    
    // Apply letter spacing
    if (styles.letterSpacing) {
      const letterSpacing = this.parseDimension(styles.letterSpacing);
      if (!isNaN(letterSpacing)) {
        textNode.letterSpacing = { value: letterSpacing, unit: 'PIXELS' };
      }
    }
    
    console.log(`[FontManager] Created text node: "${content.substring(0, 20)}..." with ${font.family} ${font.style}`);
    
    return textNode;
  }
  
  private static parseDimension(value: string | number | undefined): number {
    if (!value) return 0;
    
    const str = value.toString().trim();
    const num = parseFloat(str);
    
    if (isNaN(num)) return 0;
    
    if (str.includes('rem')) {
      return num * 16;
    } else if (str.includes('em')) {
      return num * 16;
    } else if (str.includes('%')) {
      return num;
    }
    
    return num;
  }
  
  private static parseColor(cssColor: string): RGB | null {
    if (!cssColor || cssColor === 'transparent') {
      return null;
    }
    
    const color = cssColor.trim().toLowerCase();
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        const [r, g, b] = hex.split('').map(c => parseInt(c + c, 16) / 255);
        return { r, g, b };
      }
      if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        return { r, g, b };
      }
    }
    
    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255
      };
    }
    
    // Named colors
    const namedColors: Record<string, RGB> = {
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 1, g: 1, b: 1 },
      'red': { r: 1, g: 0, b: 0 },
      'green': { r: 0, g: 0.5, b: 0 },
      'blue': { r: 0, g: 0, b: 1 },
      'yellow': { r: 1, g: 1, b: 0 },
      'cyan': { r: 0, g: 1, b: 1 },
      'magenta': { r: 1, g: 0, b: 1 },
      'gray': { r: 0.5, g: 0.5, b: 0.5 },
      'grey': { r: 0.5, g: 0.5, b: 0.5 }
    };
    
    if (namedColors[color]) {
      return namedColors[color];
    }
    
    console.warn(`[FontManager] Could not parse color: ${cssColor}`);
    return { r: 0, g: 0, b: 0 };
  }
}

// Type definitions
interface RGB {
  r: number;
  g: number;
  b: number;
}