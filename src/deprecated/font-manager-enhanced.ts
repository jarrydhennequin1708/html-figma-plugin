// Enhanced font manager with proper preloading and fallback
export class EnhancedFontManager {
  private static loadedFonts = new Set<string>();
  private static fontCache = new Map<string, FontName>();
  
  // Font mapping from CSS to Figma
  private static readonly FONT_MAPPING: Record<string, string> = {
    // System fonts
    'system-ui': 'Inter',
    '-apple-system': 'Inter',
    'BlinkMacSystemFont': 'Inter',
    'Segoe UI': 'Inter',
    
    // Common web fonts
    'Arial': 'Inter',
    'Helvetica': 'Inter',
    'Helvetica Neue': 'Inter',
    'sans-serif': 'Inter',
    'Roboto': 'Inter',
    
    // Serif fonts
    'Times New Roman': 'Inter',
    'Georgia': 'Inter',
    'serif': 'Inter',
    
    // Monospace fonts
    'Courier': 'Roboto Mono',
    'Courier New': 'Roboto Mono',
    'monospace': 'Roboto Mono',
    'Monaco': 'Roboto Mono',
    'Consolas': 'Roboto Mono'
  };
  
  static async preloadCommonFonts(): Promise<void> {
    console.log('[FontManager] Starting font preload...');
    
    const commonFonts: FontName[] = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Extra Bold' },
      { family: 'Roboto', style: 'Regular' },
      { family: 'Roboto', style: 'Bold' },
      { family: 'Roboto Mono', style: 'Regular' }
    ];
    
    for (const font of commonFonts) {
      await this.loadFont(font);
    }
    
    console.log('[FontManager] Font preload complete');
  }
  
  static async loadFont(font: FontName): Promise<boolean> {
    const key = `${font.family}-${font.style}`;
    
    if (this.loadedFonts.has(key)) {
      return true;
    }
    
    try {
      await figma.loadFontAsync(font);
      this.loadedFonts.add(key);
      this.fontCache.set(key, font);
      console.log(`[FontManager] Loaded font: ${key}`);
      return true;
    } catch (error) {
      console.warn(`[FontManager] Failed to load font ${key}:`, error);
      return false;
    }
  }
  
  static mapCSSFontToFigma(cssFontFamily: string): string {
    if (!cssFontFamily) return 'Inter';
    
    // Split font stack and process first font
    const fonts = cssFontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
    
    for (const font of fonts) {
      const mapped = this.FONT_MAPPING[font];
      if (mapped) {
        console.log(`[FontManager] Mapped font '${font}' to '${mapped}'`);
        return mapped;
      }
      
      // Check if font contains a mapped keyword
      for (const [key, value] of Object.entries(this.FONT_MAPPING)) {
        if (font.toLowerCase().includes(key.toLowerCase())) {
          console.log(`[FontManager] Mapped font '${font}' to '${value}' (partial match)`);
          return value;
        }
      }
    }
    
    console.log(`[FontManager] No mapping found for '${cssFontFamily}', using Inter`);
    return 'Inter';
  }
  
  static mapFontWeightToStyle(fontWeight: string | number): string {
    const weight = typeof fontWeight === 'string' ? 
      (fontWeight === 'bold' ? 700 : fontWeight === 'normal' ? 400 : parseInt(fontWeight)) : 
      fontWeight;
    
    if (isNaN(weight as number)) return 'Regular';
    
    const weightNum = weight as number;
    
    if (weightNum >= 800) return 'Extra Bold';
    if (weightNum >= 700) return 'Bold';
    if (weightNum >= 600) return 'Semi Bold';
    if (weightNum >= 500) return 'Medium';
    if (weightNum >= 300) return 'Light';
    if (weightNum >= 200) return 'Extra Light';
    if (weightNum >= 100) return 'Thin';
    
    return 'Regular';
  }
  
  static async createTextNodeSafely(
    content: string,
    styles: any = {},
    parent?: FrameNode | PageNode
  ): Promise<TextNode> {
    // Map CSS font to Figma font
    const fontFamily = this.mapCSSFontToFigma(styles.fontFamily || 'Inter');
    const fontStyle = this.mapFontWeightToStyle(styles.fontWeight || 'normal');
    
    // Build font object
    let font: FontName = { family: fontFamily, style: fontStyle };
    
    // Try to load the font, fall back if needed
    const loaded = await this.loadFont(font);
    if (!loaded) {
      // Try fallback combinations
      const fallbacks: FontName[] = [
        { family: fontFamily, style: 'Regular' },
        { family: 'Inter', style: fontStyle },
        { family: 'Inter', style: 'Regular' }
      ];
      
      for (const fallback of fallbacks) {
        if (await this.loadFont(fallback)) {
          font = fallback;
          console.log(`[FontManager] Using fallback font: ${fallback.family} ${fallback.style}`);
          break;
        }
      }
    }
    
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
    
    // Apply text styles
    if (styles.fontSize) {
      textNode.fontSize = parseFloat(styles.fontSize);
    }
    
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
    
    if (styles.letterSpacing) {
      const letterSpacing = parseFloat(styles.letterSpacing);
      if (!isNaN(letterSpacing)) {
        textNode.letterSpacing = { value: letterSpacing, unit: 'PIXELS' };
      }
    }
    
    if (styles.textAlign) {
      const alignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
        'left': 'LEFT',
        'center': 'CENTER',
        'right': 'RIGHT',
        'justify': 'JUSTIFIED'
      };
      textNode.textAlignHorizontal = alignMap[styles.textAlign] || 'LEFT';
    }
    
    if (styles.textTransform) {
      switch (styles.textTransform) {
        case 'uppercase':
          textNode.textCase = 'UPPER';
          break;
        case 'lowercase':
          textNode.textCase = 'LOWER';
          break;
        case 'capitalize':
          textNode.textCase = 'TITLE';
          break;
      }
    }
    
    console.log(`[FontManager] Created text node with font: ${font.family} ${font.style}`);
    return textNode;
  }
}