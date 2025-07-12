/**
 * CSS Value Resolver
 * 
 * Resolves CSS values from their authored form to computed values.
 * Handles units, keywords, and complex value types.
 */

export interface ResolverContext {
  fontSize: number;
  parentFontSize: number;
  rootFontSize: number;
  viewportWidth: number;
  viewportHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export class ValueResolver {
  
  /**
   * Resolve any CSS value to its computed form
   */
  static resolve(
    property: string,
    value: string | number,
    context: ResolverContext
  ): string | number {
    
    // Already a number
    if (typeof value === 'number') {
      return value;
    }
    
    // Clean the value
    const cleanValue = value.trim();
    
    // Handle special keywords
    if (this.isKeyword(cleanValue)) {
      return this.resolveKeyword(property, cleanValue, context);
    }
    
    // Handle calc()
    if (cleanValue.includes('calc(')) {
      return this.resolveCalc(cleanValue, context);
    }
    
    // Handle var() custom properties
    if (cleanValue.includes('var(')) {
      return this.resolveVar(cleanValue, context);
    }
    
    // Handle units
    return this.resolveUnits(cleanValue, property, context);
  }
  
  /**
   * Check if value is a CSS keyword
   */
  private static isKeyword(value: string): boolean {
    const keywords = [
      'auto', 'none', 'normal', 'inherit', 'initial', 'unset',
      'center', 'left', 'right', 'top', 'bottom',
      'flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly',
      'stretch', 'baseline', 'start', 'end',
      'contain', 'cover', 'fill', 'scale-down',
      'repeat', 'no-repeat', 'repeat-x', 'repeat-y',
      'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset',
      'thin', 'medium', 'thick',
      'transparent', 'currentColor'
    ];
    
    return keywords.includes(value);
  }
  
  /**
   * Resolve CSS keywords to computed values
   */
  private static resolveKeyword(
    property: string,
    keyword: string,
    context: ResolverContext
  ): string | number {
    
    // Border width keywords
    if (property.includes('border') && property.includes('width')) {
      const borderWidths: Record<string, number> = {
        'thin': 1,
        'medium': 3,
        'thick': 5
      };
      if (borderWidths[keyword] !== undefined) {
        return borderWidths[keyword];
      }
    }
    
    // Font weight keywords
    if (property === 'font-weight') {
      const fontWeights: Record<string, number> = {
        'normal': 400,
        'bold': 700,
        'lighter': 300,
        'bolder': 900
      };
      if (fontWeights[keyword] !== undefined) {
        return fontWeights[keyword];
      }
    }
    
    // Line height keywords
    if (property === 'line-height' && keyword === 'normal') {
      // Normal line-height is typically 1.2x font-size
      return context.fontSize * 1.2;
    }
    
    // Return as-is for other keywords
    return keyword;
  }
  
  /**
   * Resolve CSS units to pixels
   */
  private static resolveUnits(
    value: string,
    property: string,
    context: ResolverContext
  ): string | number {
    
    // Match number and unit
    const match = value.match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
    if (!match) {
      return value; // Return as-is if not a unit value
    }
    
    const num = parseFloat(match[1]);
    const unit = match[2] || '';
    
    // No unit = pixels for most properties
    if (!unit) {
      // Some properties are unitless (like opacity, flex-grow)
      const unitlessProperties = ['opacity', 'flex-grow', 'flex-shrink', 'z-index'];
      if (unitlessProperties.includes(property)) {
        return num;
      }
      // Default to pixels
      return num;
    }
    
    // Absolute units
    switch (unit) {
      case 'px':
        return num;
        
      case 'pt':
        return num * 1.333333; // 1pt = 4/3px
        
      case 'pc':
        return num * 16; // 1pc = 16px
        
      case 'in':
        return num * 96; // 1in = 96px
        
      case 'cm':
        return num * 37.795275; // 1cm = 37.795275px
        
      case 'mm':
        return num * 3.7795275; // 1mm = 3.7795275px
        
      // Relative units
      case 'em':
        return num * context.fontSize;
        
      case 'rem':
        return num * context.rootFontSize;
        
      case 'ex':
        // Approximate ex as 0.5em
        return num * context.fontSize * 0.5;
        
      case 'ch':
        // Approximate ch as 0.5em
        return num * context.fontSize * 0.5;
        
      // Viewport units
      case 'vw':
        return num * context.viewportWidth / 100;
        
      case 'vh':
        return num * context.viewportHeight / 100;
        
      case 'vmin':
        return num * Math.min(context.viewportWidth, context.viewportHeight) / 100;
        
      case 'vmax':
        return num * Math.max(context.viewportWidth, context.viewportHeight) / 100;
        
      // Percentage
      case '%':
        return this.resolvePercentage(num, property, context);
        
      default:
        return value; // Return as-is for unknown units
    }
  }
  
  /**
   * Resolve percentage values based on property context
   */
  private static resolvePercentage(
    percentage: number,
    property: string,
    context: ResolverContext
  ): number | string {
    
    const factor = percentage / 100;
    
    // Width percentages
    if (property === 'width' || 
        property === 'max-width' || 
        property === 'min-width' ||
        property === 'left' || 
        property === 'right') {
      return factor * context.containerWidth;
    }
    
    // Height percentages
    if (property === 'height' || 
        property === 'max-height' || 
        property === 'min-height' ||
        property === 'top' || 
        property === 'bottom') {
      // Height percentages only work if container has explicit height
      if (context.containerHeight > 0) {
        return factor * context.containerHeight;
      }
      return 'auto'; // Fallback to auto
    }
    
    // Padding/margin percentages (always relative to width)
    if (property.includes('padding') || property.includes('margin')) {
      return factor * context.containerWidth;
    }
    
    // Font-size percentage
    if (property === 'font-size') {
      return factor * context.parentFontSize;
    }
    
    // Line-height percentage
    if (property === 'line-height') {
      return factor * context.fontSize;
    }
    
    return percentage + '%'; // Return as-is for other properties
  }
  
  /**
   * Resolve calc() expressions
   */
  private static resolveCalc(
    calcStr: string,
    context: ResolverContext
  ): number {
    
    // Extract expression from calc()
    const match = calcStr.match(/calc\((.*)\)/);
    if (!match) return 0;
    
    let expression = match[1].trim();
    
    // Replace CSS values with computed values
    expression = expression.replace(
      /(-?\d*\.?\d+)(px|em|rem|%|vw|vh|vmin|vmax)?/g,
      (match, num, unit) => {
        const value = parseFloat(num);
        
        if (!unit || unit === 'px') {
          return String(value);
        }
        
        const resolved = this.resolveUnits(
          value + unit,
          'width', // Default context
          context
        );
        
        return String(typeof resolved === 'number' ? resolved : 0);
      }
    );
    
    // Evaluate the expression safely
    try {
      // Create a safe evaluation function
      const func = new Function('return ' + expression);
      const result = func();
      return isNaN(result) ? 0 : result;
    } catch (e) {
      console.warn('Failed to evaluate calc expression:', expression);
      return 0;
    }
  }
  
  /**
   * Resolve CSS custom properties (var())
   */
  private static resolveVar(
    varStr: string,
    context: ResolverContext
  ): string {
    // For now, return the fallback value if provided
    const match = varStr.match(/var\([^,]+,\s*([^)]+)\)/);
    if (match) {
      return match[1].trim();
    }
    
    // No fallback - return a default
    return 'initial';
  }
  
  /**
   * Resolve color values to normalized format
   */
  static resolveColor(value: string): string {
    // Already hex
    if (value.startsWith('#')) {
      // Expand 3-digit hex
      if (value.length === 4) {
        const r = value[1];
        const g = value[2];
        const b = value[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      return value;
    }
    
    // RGB/RGBA
    const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    // HSL conversion would go here
    
    // Named colors
    const namedColors = this.getNamedColors();
    if (namedColors[value.toLowerCase()]) {
      return namedColors[value.toLowerCase()];
    }
    
    return value;
  }
  
  /**
   * Get CSS named colors
   */
  private static getNamedColors(): Record<string, string> {
    return {
      'aliceblue': '#f0f8ff',
      'antiquewhite': '#faebd7',
      'aqua': '#00ffff',
      'aquamarine': '#7fffd4',
      'azure': '#f0ffff',
      'beige': '#f5f5dc',
      'bisque': '#ffe4c4',
      'black': '#000000',
      'blanchedalmond': '#ffebcd',
      'blue': '#0000ff',
      'blueviolet': '#8a2be2',
      'brown': '#a52a2a',
      'burlywood': '#deb887',
      'cadetblue': '#5f9ea0',
      'chartreuse': '#7fff00',
      'chocolate': '#d2691e',
      'coral': '#ff7f50',
      'cornflowerblue': '#6495ed',
      'cornsilk': '#fff8dc',
      'crimson': '#dc143c',
      'cyan': '#00ffff',
      'darkblue': '#00008b',
      'darkcyan': '#008b8b',
      'darkgoldenrod': '#b8860b',
      'darkgray': '#a9a9a9',
      'darkgrey': '#a9a9a9',
      'darkgreen': '#006400',
      'darkkhaki': '#bdb76b',
      'darkmagenta': '#8b008b',
      'darkolivegreen': '#556b2f',
      'darkorange': '#ff8c00',
      'darkorchid': '#9932cc',
      'darkred': '#8b0000',
      'darksalmon': '#e9967a',
      'darkseagreen': '#8fbc8f',
      'darkslateblue': '#483d8b',
      'darkslategray': '#2f4f4f',
      'darkslategrey': '#2f4f4f',
      'darkturquoise': '#00ced1',
      'darkviolet': '#9400d3',
      'deeppink': '#ff1493',
      'deepskyblue': '#00bfff',
      'dimgray': '#696969',
      'dimgrey': '#696969',
      'dodgerblue': '#1e90ff',
      'firebrick': '#b22222',
      'floralwhite': '#fffaf0',
      'forestgreen': '#228b22',
      'fuchsia': '#ff00ff',
      'gainsboro': '#dcdcdc',
      'ghostwhite': '#f8f8ff',
      'gold': '#ffd700',
      'goldenrod': '#daa520',
      'gray': '#808080',
      'grey': '#808080',
      'green': '#008000',
      'greenyellow': '#adff2f',
      'honeydew': '#f0fff0',
      'hotpink': '#ff69b4',
      'indianred': '#cd5c5c',
      'indigo': '#4b0082',
      'ivory': '#fffff0',
      'khaki': '#f0e68c',
      'lavender': '#e6e6fa',
      'lavenderblush': '#fff0f5',
      'lawngreen': '#7cfc00',
      'lemonchiffon': '#fffacd',
      'lightblue': '#add8e6',
      'lightcoral': '#f08080',
      'lightcyan': '#e0ffff',
      'lightgoldenrodyellow': '#fafad2',
      'lightgray': '#d3d3d3',
      'lightgrey': '#d3d3d3',
      'lightgreen': '#90ee90',
      'lightpink': '#ffb6c1',
      'lightsalmon': '#ffa07a',
      'lightseagreen': '#20b2aa',
      'lightskyblue': '#87cefa',
      'lightslategray': '#778899',
      'lightslategrey': '#778899',
      'lightsteelblue': '#b0c4de',
      'lightyellow': '#ffffe0',
      'lime': '#00ff00',
      'limegreen': '#32cd32',
      'linen': '#faf0e6',
      'magenta': '#ff00ff',
      'maroon': '#800000',
      'mediumaquamarine': '#66cdaa',
      'mediumblue': '#0000cd',
      'mediumorchid': '#ba55d3',
      'mediumpurple': '#9370db',
      'mediumseagreen': '#3cb371',
      'mediumslateblue': '#7b68ee',
      'mediumspringgreen': '#00fa9a',
      'mediumturquoise': '#48d1cc',
      'mediumvioletred': '#c71585',
      'midnightblue': '#191970',
      'mintcream': '#f5fffa',
      'mistyrose': '#ffe4e1',
      'moccasin': '#ffe4b5',
      'navajowhite': '#ffdead',
      'navy': '#000080',
      'oldlace': '#fdf5e6',
      'olive': '#808000',
      'olivedrab': '#6b8e23',
      'orange': '#ffa500',
      'orangered': '#ff4500',
      'orchid': '#da70d6',
      'palegoldenrod': '#eee8aa',
      'palegreen': '#98fb98',
      'paleturquoise': '#afeeee',
      'palevioletred': '#db7093',
      'papayawhip': '#ffefd5',
      'peachpuff': '#ffdab9',
      'peru': '#cd853f',
      'pink': '#ffc0cb',
      'plum': '#dda0dd',
      'powderblue': '#b0e0e6',
      'purple': '#800080',
      'red': '#ff0000',
      'rosybrown': '#bc8f8f',
      'royalblue': '#4169e1',
      'saddlebrown': '#8b4513',
      'salmon': '#fa8072',
      'sandybrown': '#f4a460',
      'seagreen': '#2e8b57',
      'seashell': '#fff5ee',
      'sienna': '#a0522d',
      'silver': '#c0c0c0',
      'skyblue': '#87ceeb',
      'slateblue': '#6a5acd',
      'slategray': '#708090',
      'slategrey': '#708090',
      'snow': '#fffafa',
      'springgreen': '#00ff7f',
      'steelblue': '#4682b4',
      'tan': '#d2b48c',
      'teal': '#008080',
      'thistle': '#d8bfd8',
      'tomato': '#ff6347',
      'transparent': 'transparent',
      'turquoise': '#40e0d0',
      'violet': '#ee82ee',
      'wheat': '#f5deb3',
      'white': '#ffffff',
      'whitesmoke': '#f5f5f5',
      'yellow': '#ffff00',
      'yellowgreen': '#9acd32'
    };
  }
}