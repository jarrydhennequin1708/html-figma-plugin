// Enhanced Font Manager with intelligent fallback system
export class FontManager {
  private static loadedFonts = new Set<string>();
  private static fontCache = new Map<string, FontName>();
  
  static async preloadCommonFonts(): Promise<void> {
    const commonFonts = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Roboto', style: 'Regular' },
      { family: 'Roboto', style: 'Bold' },
      { family: 'Roboto', style: 'Medium' }
    ];
    
    console.log('[FontManager] Preloading common fonts...');
    for (const font of commonFonts) {
      await this.loadFont(font);
    }
    console.log('[FontManager] Preloading complete');
  }
  
  static async loadFont(font: FontName): Promise<boolean> {
    const key = `${font.family}-${font.style}`;
    if (this.loadedFonts.has(key)) return true;
    
    try {
      await figma.loadFontAsync(font);
      this.loadedFonts.add(key);
      this.fontCache.set(key, font);
      console.log(`[FontManager] Successfully loaded ${key}`);
      return true;
    } catch (error) {
      console.warn(`[FontManager] Failed to load font ${key}:`, error);
      return false;
    }
  }
  
  static async createTextNode(
    content: string,
    styles: any,
    parent: FrameNode | PageNode
  ): Promise<TextNode> {
    // Map CSS font to Figma font
    const fontFamily = this.mapCSSFontToFigma(styles.fontFamily);
    const fontWeight = styles.fontWeight || 'normal';
    const fontStyle = this.mapFontWeightToStyle(fontWeight);
    
    const font = { family: fontFamily, style: fontStyle };
    
    // Try to load requested font, fall back if needed
    const loaded = await this.loadFont(font);
    if (!loaded) {
      console.log(`[FontManager] Falling back from ${font.family} ${font.style} to Inter Regular`);
      font.family = 'Inter';
      font.style = 'Regular';
      await this.loadFont(font);
    }
    
    // NOW create text node (after font is loaded)
    const textNode = figma.createText();
    parent.appendChild(textNode);
    
    // Set font AFTER loading
    textNode.fontName = font;
    textNode.characters = content;
    
    // Apply other text styles
    if (styles.fontSize) {
      textNode.fontSize = parseFloat(styles.fontSize);
    }
    if (styles.color) {
      const color = this.parseColor(styles.color);
      if (color) {
        textNode.fills = [{
          type: 'SOLID',
          color: { r: color.r, g: color.g, b: color.b }
        }];
      }
    }
    
    // Text alignment
    if (styles.textAlign) {
      const alignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
        'left': 'LEFT',
        'center': 'CENTER',
        'right': 'RIGHT',
        'justify': 'JUSTIFIED'
      };
      textNode.textAlignHorizontal = alignMap[styles.textAlign] || 'LEFT';
    }
    
    // Line height
    if (styles.lineHeight) {
      const lineHeight = parseFloat(styles.lineHeight);
      if (!isNaN(lineHeight)) {
        if (styles.lineHeight.includes('%')) {
          textNode.lineHeight = { value: lineHeight, unit: 'PERCENT' };
        } else if (styles.lineHeight.includes('px')) {
          textNode.lineHeight = { value: lineHeight, unit: 'PIXELS' };
        } else if (lineHeight > 0 && lineHeight < 3) {
          // Unitless values are typically multipliers
          textNode.lineHeight = { value: lineHeight * 100, unit: 'PERCENT' };
        }
      }
    }
    
    // Letter spacing
    if (styles.letterSpacing) {
      const letterSpacing = parseFloat(styles.letterSpacing);
      if (!isNaN(letterSpacing)) {
        if (styles.letterSpacing.includes('px')) {
          textNode.letterSpacing = { value: letterSpacing, unit: 'PIXELS' };
        } else if (styles.letterSpacing.includes('em')) {
          textNode.letterSpacing = { value: letterSpacing * 100, unit: 'PERCENT' };
        }
      }
    }
    
    // Text decoration
    if (styles.textDecoration) {
      if (styles.textDecoration.includes('underline')) {
        textNode.textDecoration = 'UNDERLINE';
      } else if (styles.textDecoration.includes('line-through')) {
        textNode.textDecoration = 'STRIKETHROUGH';
      }
    }
    
    // Text transform
    if (styles.textTransform) {
      if (styles.textTransform === 'uppercase') {
        textNode.textCase = 'UPPER';
      } else if (styles.textTransform === 'lowercase') {
        textNode.textCase = 'LOWER';
      } else if (styles.textTransform === 'capitalize') {
        textNode.textCase = 'TITLE';
      }
    }
    
    return textNode;
  }
  
  private static mapCSSFontToFigma(cssFont: string): string {
    if (!cssFont) return 'Inter';
    
    const fontMap: Record<string, string> = {
      'Arial': 'Inter',
      'Helvetica': 'Inter',
      'Helvetica Neue': 'Inter',
      'sans-serif': 'Inter',
      'system-ui': 'Inter',
      '-apple-system': 'Inter',
      'BlinkMacSystemFont': 'Inter',
      'Segoe UI': 'Inter',
      'Roboto': 'Roboto',
      'Times New Roman': 'Inter',
      'serif': 'Inter',
      'Georgia': 'Inter',
      'monospace': 'Roboto Mono',
      'Courier': 'Roboto Mono',
      'Courier New': 'Roboto Mono',
      'Monaco': 'Roboto Mono',
      'Consolas': 'Roboto Mono'
    };
    
    // Extract first font from font stack
    const fontName = cssFont?.split(',')[0]?.trim().replace(/['"]/g, '');
    return fontMap[fontName] || 'Inter';
  }
  
  private static mapFontWeightToStyle(weight: string | number): string {
    const weightNum = typeof weight === 'string' ? 
      (weight === 'bold' ? 700 : weight === 'normal' ? 400 : parseInt(weight)) : weight;
    
    if (isNaN(weightNum)) return 'Regular';
    
    if (weightNum >= 800) return 'Extra Bold';
    if (weightNum >= 700) return 'Bold';
    if (weightNum >= 600) return 'Semi Bold';
    if (weightNum >= 500) return 'Medium';
    if (weightNum >= 300) return 'Light';
    if (weightNum >= 200) return 'Extra Light';
    if (weightNum >= 100) return 'Thin';
    return 'Regular';
  }
  
  // CSS Color Parser (temporarily here, should be moved to utils)
  private static parseColor(cssColor: string): RGB | null {
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
    
    // rgb(r, g, b)
    const rgbMatch = color.match(/^rgb\((\d+),(\d+),(\d+)\)$/);
    if (rgbMatch) {
      const [_, r, g, b] = rgbMatch;
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255
      };
    }
    
    // rgba(r, g, b, a) - ignore alpha for now
    const rgbaMatch = color.match(/^rgba\((\d+),(\d+),(\d+),[\d.]+\)$/);
    if (rgbaMatch) {
      const [_, r, g, b] = rgbaMatch;
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
      'lime': { r: 0, g: 1, b: 0 },
      'blue': { r: 0, g: 0, b: 1 },
      'yellow': { r: 1, g: 1, b: 0 },
      'cyan': { r: 0, g: 1, b: 1 },
      'magenta': { r: 1, g: 0, b: 1 },
      'silver': { r: 0.75, g: 0.75, b: 0.75 },
      'gray': { r: 0.5, g: 0.5, b: 0.5 },
      'grey': { r: 0.5, g: 0.5, b: 0.5 },
      'maroon': { r: 0.5, g: 0, b: 0 },
      'olive': { r: 0.5, g: 0.5, b: 0 },
      'navy': { r: 0, g: 0, b: 0.5 },
      'purple': { r: 0.5, g: 0, b: 0.5 },
      'teal': { r: 0, g: 0.5, b: 0.5 },
      'orange': { r: 1, g: 0.65, b: 0 },
      'pink': { r: 1, g: 0.75, b: 0.8 },
      'brown': { r: 0.65, g: 0.16, b: 0.16 }
    };
    
    return namedColors[color] || null;
  }
  
  static async findAvailableFont(requestedFamily: string): Promise<FontName> {
    const fallbackChain = [
      'Inter',
      'Roboto',
      'Arial',
      'Helvetica'
    ];
    
    // Try requested font first with different styles
    for (const style of ['Regular', 'Normal']) {
      try {
        const font = { family: requestedFamily, style };
        await figma.loadFontAsync(font);
        return font;
      } catch {}
    }
    
    // Try fallback chain
    for (const family of fallbackChain) {
      try {
        const font = { family, style: 'Regular' };
        await figma.loadFontAsync(font);
        console.log(`[FontManager] Fell back from ${requestedFamily} to ${family}`);
        return font;
      } catch {}
    }
    
    throw new Error('No fonts available');
  }
}

// Type definitions
interface RGB {
  r: number;
  g: number;
  b: number;
}