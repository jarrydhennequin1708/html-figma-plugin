// Enhanced color parser that handles all CSS color formats
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export class ColorParser {
  static parseColor(cssColor: string): RGB | null {
    if (!cssColor || cssColor === 'transparent' || cssColor === 'none') {
      return null;
    }
    
    // Remove whitespace and convert to lowercase
    const color = cssColor.trim().toLowerCase();
    
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.parseHexColor(color);
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      return this.parseRgbColor(color);
    }
    
    // Handle hsl/hsla colors
    if (color.startsWith('hsl')) {
      return this.parseHslColor(color);
    }
    
    // Handle named colors
    return this.parseNamedColor(color);
  }
  
  private static parseHexColor(hex: string): RGB | null {
    const color = hex.slice(1);
    
    // 3-digit hex (#333)
    if (color.length === 3) {
      const [r, g, b] = color.split('').map(c => 
        parseInt(c + c, 16) / 255
      );
      console.log(`[ColorParser] Parsed 3-digit hex ${hex} to rgb(${r}, ${g}, ${b})`);
      return { r, g, b };
    }
    
    // 6-digit hex (#333333)
    if (color.length === 6) {
      const r = parseInt(color.slice(0, 2), 16) / 255;
      const g = parseInt(color.slice(2, 4), 16) / 255;
      const b = parseInt(color.slice(4, 6), 16) / 255;
      console.log(`[ColorParser] Parsed 6-digit hex ${hex} to rgb(${r}, ${g}, ${b})`);
      return { r, g, b };
    }
    
    // 8-digit hex with alpha (#333333FF) - ignore alpha
    if (color.length === 8) {
      const r = parseInt(color.slice(0, 2), 16) / 255;
      const g = parseInt(color.slice(2, 4), 16) / 255;
      const b = parseInt(color.slice(4, 6), 16) / 255;
      console.log(`[ColorParser] Parsed 8-digit hex ${hex} to rgb(${r}, ${g}, ${b}) (alpha ignored)`);
      return { r, g, b };
    }
    
    console.warn(`[ColorParser] Invalid hex format: ${hex}`);
    return null;
  }
  
  private static parseRgbColor(rgb: string): RGB | null {
    // Match both rgb(r, g, b) and rgba(r, g, b, a) formats
    const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/);
    
    if (match) {
      const [, r, g, b] = match;
      const result = {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255
      };
      console.log(`[ColorParser] Parsed ${rgb} to rgb(${result.r}, ${result.g}, ${result.b})`);
      return result;
    }
    
    console.warn(`[ColorParser] Invalid RGB format: ${rgb}`);
    return null;
  }
  
  private static parseHslColor(hsl: string): RGB | null {
    const match = hsl.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+)?\s*\)/);
    
    if (match) {
      const [, h, s, l] = match;
      const hNum = parseInt(h) / 360;
      const sNum = parseInt(s) / 100;
      const lNum = parseInt(l) / 100;
      
      const result = this.hslToRgb(hNum, sNum, lNum);
      console.log(`[ColorParser] Parsed ${hsl} to rgb(${result.r}, ${result.g}, ${result.b})`);
      return result;
    }
    
    console.warn(`[ColorParser] Invalid HSL format: ${hsl}`);
    return null;
  }
  
  private static hslToRgb(h: number, s: number, l: number): RGB {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // Achromatic
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
  
  private static parseNamedColor(colorName: string): RGB | null {
    const namedColors: Record<string, RGB> = {
      // Common colors
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 1, g: 1, b: 1 },
      'red': { r: 1, g: 0, b: 0 },
      'green': { r: 0, g: 0.5, b: 0 },
      'blue': { r: 0, g: 0, b: 1 },
      'yellow': { r: 1, g: 1, b: 0 },
      'cyan': { r: 0, g: 1, b: 1 },
      'magenta': { r: 1, g: 0, b: 1 },
      
      // Grays
      'gray': { r: 0.5, g: 0.5, b: 0.5 },
      'grey': { r: 0.5, g: 0.5, b: 0.5 },
      'darkgray': { r: 0.66, g: 0.66, b: 0.66 },
      'darkgrey': { r: 0.66, g: 0.66, b: 0.66 },
      'lightgray': { r: 0.83, g: 0.83, b: 0.83 },
      'lightgrey': { r: 0.83, g: 0.83, b: 0.83 },
      'silver': { r: 0.75, g: 0.75, b: 0.75 },
      
      // Extended colors
      'orange': { r: 1, g: 0.65, b: 0 },
      'purple': { r: 0.5, g: 0, b: 0.5 },
      'brown': { r: 0.65, g: 0.16, b: 0.16 },
      'pink': { r: 1, g: 0.75, b: 0.8 },
      'lime': { r: 0, g: 1, b: 0 },
      'navy': { r: 0, g: 0, b: 0.5 },
      'teal': { r: 0, g: 0.5, b: 0.5 },
      'olive': { r: 0.5, g: 0.5, b: 0 },
      'maroon': { r: 0.5, g: 0, b: 0 }
    };
    
    const result = namedColors[colorName];
    if (result) {
      console.log(`[ColorParser] Parsed named color '${colorName}' to rgb(${result.r}, ${result.g}, ${result.b})`);
      return result;
    }
    
    console.warn(`[ColorParser] Unknown color name: ${colorName}`);
    return null;
  }
  
  // Helper to parse border shorthand (e.g., "1px solid #333")
  static parseBorder(borderValue: string): {
    width: number;
    style: string;
    color: RGB | null;
  } | null {
    if (!borderValue || borderValue === 'none') return null;
    
    const parts = borderValue.trim().split(/\s+/);
    if (parts.length < 3) return null;
    
    const width = parseFloat(parts[0]);
    const style = parts[1];
    const color = this.parseColor(parts.slice(2).join(' '));
    
    console.log(`[ColorParser] Parsed border '${borderValue}' to width: ${width}, style: ${style}, color:`, color);
    
    return { width, style, color };
  }
}