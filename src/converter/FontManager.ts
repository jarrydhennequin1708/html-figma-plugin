// Font Manager for safe font loading in Figma
export class FontManager {
  static async preloadCommonFonts(): Promise<void> {
    const commonFonts = [
      { family: 'Arial', style: 'Regular' },
      { family: 'Arial', style: 'Bold' },
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Roboto', style: 'Regular' },
      { family: 'Roboto', style: 'Bold' }
    ];
    
    for (const font of commonFonts) {
      try {
        await figma.loadFontAsync(font);
        console.log(`[FontManager] Loaded ${font.family} ${font.style}`);
      } catch (error) {
        console.log(`[FontManager] Failed to load ${font.family} ${font.style}:`, error);
      }
    }
  }
  
  static async createTextNodeSafely(
    text: string,
    styles: Record<string, string>,
    name: string
  ): Promise<TextNode> {
    // Default to Inter Regular (Figma's default)
    let fontFamily = 'Inter';
    let fontStyle = 'Regular';
    
    // Extract font from styles
    if (styles['font-family']) {
      const fonts = styles['font-family'].split(',').map(f => f.trim().replace(/['"]/g, ''));
      const firstFont = fonts[0];
      
      if (firstFont.toLowerCase().includes('arial')) fontFamily = 'Arial';
      else if (firstFont.toLowerCase().includes('inter')) fontFamily = 'Inter';
      else if (firstFont.toLowerCase().includes('roboto')) fontFamily = 'Roboto';
      else fontFamily = 'Inter'; // Default fallback
    }
    
    if (styles['font-weight'] === '700' || styles['font-weight'] === 'bold') {
      fontStyle = 'Bold';
    }
    
    // Try to load the font
    try {
      await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
    } catch (error) {
      console.log(`[FontManager] Failed to load ${fontFamily} ${fontStyle}, falling back to Inter Regular`);
      fontFamily = 'Inter';
      fontStyle = 'Regular';
      await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
    }
    
    // Create text node
    const textNode = figma.createText();
    textNode.name = name;
    textNode.fontName = { family: fontFamily, style: fontStyle };
    textNode.characters = text;
    
    return textNode;
  }
}