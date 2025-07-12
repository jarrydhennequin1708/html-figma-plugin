/**
 * Accurate Figma Mapper
 * 
 * Maps computed CSS layout to Figma properties with zero interpretation.
 * This ensures pixel-perfect accuracy by directly translating computed values.
 */

import { ComputedStyle, LayoutBox } from '../engine/css-engine';

export interface FigmaNodeConfig {
  // Dimensions
  width: number;
  height: number;
  
  // Auto Layout
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  layoutAlign?: 'STRETCH' | 'INHERIT';
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  
  // Visual properties
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius?: number;
  opacity?: number;
  
  // Text properties (for text nodes)
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
  letterSpacing?: { value: number; unit: 'PIXELS' | 'PERCENT' };
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
}

export class AccurateFigmaMapper {
  
  /**
   * Map computed layout to Figma node configuration
   */
  static mapLayoutToFigma(
    element: Element,
    computedStyles: ComputedStyle,
    layoutBox: LayoutBox,
    children: LayoutBox[],
    childElements: Element[] = []
  ): FigmaNodeConfig {
    
    const config: FigmaNodeConfig = {
      width: Math.round(layoutBox.width),
      height: Math.round(layoutBox.height)
    };
    
    // Determine node type and apply appropriate mappings
    const display = computedStyles.display as string;
    const isText = this.isTextElement(element);
    
    if (isText) {
      this.mapTextProperties(config, element, computedStyles);
    } else {
      this.mapLayoutProperties(config, computedStyles, layoutBox, children.length > 0);
      this.mapVisualProperties(config, computedStyles);
    }
    
    return config;
  }
  
  /**
   * Map layout properties (Auto Layout)
   */
  private static mapLayoutProperties(
    config: FigmaNodeConfig,
    computedStyles: ComputedStyle,
    layoutBox: LayoutBox,
    hasChildren: boolean
  ): void {
    
    const display = computedStyles.display as string;
    
    // Auto Layout for flex containers
    if (display === 'flex' && hasChildren) {
      const flexDirection = computedStyles['flex-direction'] as string || 'row';
      config.layoutMode = flexDirection.includes('column') ? 'VERTICAL' : 'HORIZONTAL';
      
      // Item spacing (gap)
      const gap = this.resolveNumber(computedStyles['gap']) || 
                  this.resolveNumber(computedStyles['column-gap']) || 
                  0;
      config.itemSpacing = Math.round(gap);
      
      // Padding
      config.paddingTop = Math.round(layoutBox.paddingTop);
      config.paddingRight = Math.round(layoutBox.paddingRight);
      config.paddingBottom = Math.round(layoutBox.paddingBottom);
      config.paddingLeft = Math.round(layoutBox.paddingLeft);
      
      // Sizing mode
      config.layoutSizingHorizontal = this.determineSizingMode(
        computedStyles,
        'horizontal',
        layoutBox.width,
        hasChildren
      );
      config.layoutSizingVertical = this.determineSizingMode(
        computedStyles,
        'vertical',
        layoutBox.height,
        hasChildren
      );
      
      // Alignment
      config.primaryAxisAlignItems = this.mapJustifyContent(
        computedStyles['justify-content'] as string
      );
      config.counterAxisAlignItems = this.mapAlignItems(
        computedStyles['align-items'] as string
      );
    }
    // Grid containers also use Auto Layout
    else if (display === 'grid' && hasChildren) {
      // For grid, we'll use horizontal auto layout by default
      config.layoutMode = 'HORIZONTAL';
      
      // Use column gap as item spacing
      const columnGap = this.resolveNumber(computedStyles['column-gap']) || 
                        this.resolveNumber(computedStyles['gap']) || 
                        0;
      config.itemSpacing = Math.round(columnGap);
      
      // Padding
      config.paddingTop = Math.round(layoutBox.paddingTop);
      config.paddingRight = Math.round(layoutBox.paddingRight);
      config.paddingBottom = Math.round(layoutBox.paddingBottom);
      config.paddingLeft = Math.round(layoutBox.paddingLeft);
      
      // Grid items typically have fixed sizes
      config.layoutSizingHorizontal = 'FIXED';
      config.layoutSizingVertical = 'HUG';
    }
    // Regular block elements
    else {
      config.layoutMode = 'NONE';
      
      // Still apply padding for non-auto-layout frames
      if (layoutBox.paddingTop || layoutBox.paddingRight || 
          layoutBox.paddingBottom || layoutBox.paddingLeft) {
        config.paddingTop = Math.round(layoutBox.paddingTop);
        config.paddingRight = Math.round(layoutBox.paddingRight);
        config.paddingBottom = Math.round(layoutBox.paddingBottom);
        config.paddingLeft = Math.round(layoutBox.paddingLeft);
      }
    }
  }
  
  /**
   * Determine Figma sizing mode based on CSS
   */
  private static determineSizingMode(
    styles: ComputedStyle,
    direction: 'horizontal' | 'vertical',
    computedSize: number,
    hasChildren: boolean
  ): 'FIXED' | 'HUG' | 'FILL' {
    
    const property = direction === 'horizontal' ? 'width' : 'height';
    const cssValue = styles[property];
    
    // Explicit pixel value = FIXED
    if (typeof cssValue === 'number' && cssValue > 0) {
      return 'FIXED';
    }
    
    // Percentage or flex-grow > 0 = FILL
    const flexGrow = parseFloat(styles['flex-grow'] as string) || 0;
    if (flexGrow > 0) {
      return 'FILL';
    }
    
    // For flex items with flex-basis
    const flexBasis = styles['flex-basis'];
    if (flexBasis && flexBasis !== 'auto') {
      return 'FIXED';
    }
    
    // Auto sizing
    if (cssValue === 'auto' || !cssValue) {
      // Containers with children typically hug content
      if (hasChildren) {
        return 'HUG';
      }
      // Elements without explicit size in flex containers fill
      if (styles.display === 'flex' || styles.display === 'grid') {
        return 'FILL';
      }
      // Default to hug
      return 'HUG';
    }
    
    // Width/height 100% = FILL
    if (typeof cssValue === 'string' && cssValue.includes('100%')) {
      return 'FILL';
    }
    
    return 'FIXED';
  }
  
  /**
   * Map CSS justify-content to Figma primaryAxisAlignItems
   */
  private static mapJustifyContent(value: string): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
    const mapping: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'> = {
      'flex-start': 'MIN',
      'start': 'MIN',
      'left': 'MIN',
      'center': 'CENTER',
      'flex-end': 'MAX',
      'end': 'MAX',
      'right': 'MAX',
      'space-between': 'SPACE_BETWEEN',
      'space-around': 'SPACE_BETWEEN',
      'space-evenly': 'SPACE_BETWEEN'
    };
    
    return mapping[value] || 'MIN';
  }
  
  /**
   * Map CSS align-items to Figma counterAxisAlignItems
   */
  private static mapAlignItems(value: string): 'MIN' | 'CENTER' | 'MAX' {
    const mapping: Record<string, 'MIN' | 'CENTER' | 'MAX'> = {
      'flex-start': 'MIN',
      'start': 'MIN',
      'top': 'MIN',
      'center': 'CENTER',
      'flex-end': 'MAX',
      'end': 'MAX',
      'bottom': 'MAX',
      'stretch': 'CENTER', // Stretch is handled via FILL sizing
      'baseline': 'MIN'
    };
    
    return mapping[value] || 'MIN';
  }
  
  /**
   * Map visual properties (fills, strokes, etc.)
   */
  private static mapVisualProperties(
    config: FigmaNodeConfig,
    computedStyles: ComputedStyle
  ): void {
    
    // Background color
    const backgroundColor = computedStyles['background-color'] as string;
    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      config.fills = [{
        type: 'SOLID',
        color: this.cssColorToFigma(backgroundColor),
        opacity: this.extractOpacity(backgroundColor)
      }];
    }
    
    // Border
    const borderWidth = this.resolveNumber(computedStyles['border-top-width']);
    if (borderWidth > 0) {
      const borderColor = computedStyles['border-top-color'] as string || '#000000';
      const borderStyle = computedStyles['border-top-style'] as string;
      
      if (borderStyle !== 'none') {
        config.strokes = [{
          type: 'SOLID',
          color: this.cssColorToFigma(borderColor),
          opacity: this.extractOpacity(borderColor)
        }];
        config.strokeWeight = borderWidth;
        config.strokeAlign = 'INSIDE';
      }
    }
    
    // Border radius
    const borderRadius = this.resolveNumber(computedStyles['border-top-left-radius']) || 
                        this.resolveNumber(computedStyles['border-radius']);
    if (borderRadius > 0) {
      config.cornerRadius = borderRadius;
    }
    
    // Opacity
    const opacity = this.resolveNumber(computedStyles['opacity']);
    if (opacity !== undefined && opacity < 1) {
      config.opacity = opacity;
    }
  }
  
  /**
   * Map text properties
   */
  private static mapTextProperties(
    config: FigmaNodeConfig,
    element: Element,
    computedStyles: ComputedStyle
  ): void {
    
    // Text content
    config.characters = element.textContent || '';
    
    // Font size
    const fontSize = this.resolveNumber(computedStyles['font-size']);
    if (fontSize) {
      config.fontSize = fontSize;
    }
    
    // Font family
    const fontFamily = computedStyles['font-family'] as string;
    if (fontFamily) {
      // Extract first font from font stack
      const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      config.fontFamily = this.mapFontFamily(primaryFont);
    }
    
    // Font weight
    const fontWeight = computedStyles['font-weight'];
    if (fontWeight) {
      config.fontWeight = this.normalizeFontWeight(fontWeight);
    }
    
    // Line height
    const lineHeight = computedStyles['line-height'];
    if (lineHeight && lineHeight !== 'normal') {
      if (typeof lineHeight === 'number') {
        config.lineHeight = {
          value: lineHeight,
          unit: 'PIXELS'
        };
      }
    }
    
    // Letter spacing
    const letterSpacing = computedStyles['letter-spacing'];
    if (letterSpacing && letterSpacing !== 'normal') {
      const value = this.resolveNumber(letterSpacing);
      if (value) {
        config.letterSpacing = {
          value: value,
          unit: 'PIXELS'
        };
      }
    }
    
    // Text alignment
    const textAlign = computedStyles['text-align'] as string;
    if (textAlign) {
      config.textAlignHorizontal = this.mapTextAlign(textAlign);
    }
    
    // Text decoration
    const textDecoration = computedStyles['text-decoration'] as string;
    if (textDecoration && textDecoration !== 'none') {
      if (textDecoration.includes('underline')) {
        config.textDecoration = 'UNDERLINE';
      } else if (textDecoration.includes('line-through')) {
        config.textDecoration = 'STRIKETHROUGH';
      }
    }
    
    // Text transform
    const textTransform = computedStyles['text-transform'] as string;
    if (textTransform) {
      config.textCase = this.mapTextTransform(textTransform);
    }
    
    // Text color
    const color = computedStyles['color'] as string;
    if (color) {
      config.fills = [{
        type: 'SOLID',
        color: this.cssColorToFigma(color),
        opacity: this.extractOpacity(color)
      }];
    }
  }
  
  /**
   * Check if element is a text element
   */
  private static isTextElement(element: Element): boolean {
    const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th'];
    return textTags.includes(element.tagName.toLowerCase());
  }
  
  /**
   * Convert CSS color to Figma RGB
   */
  private static cssColorToFigma(cssColor: string): { r: number; g: number; b: number } {
    // Handle hex colors
    if (cssColor.startsWith('#')) {
      const hex = cssColor.substring(1);
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      return { r, g, b };
    }
    
    // Handle rgb/rgba
    const rgbMatch = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]) / 255,
        g: parseInt(rgbMatch[2]) / 255,
        b: parseInt(rgbMatch[3]) / 255
      };
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }
  
  /**
   * Extract opacity from rgba color
   */
  private static extractOpacity(cssColor: string): number {
    const rgbaMatch = cssColor.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
    if (rgbaMatch) {
      return parseFloat(rgbaMatch[1]);
    }
    return 1;
  }
  
  /**
   * Map font family to Figma font
   */
  private static mapFontFamily(fontFamily: string): string {
    // Map common web fonts to Figma equivalents
    const fontMap: Record<string, string> = {
      'Arial': 'Arial',
      'Helvetica': 'Helvetica',
      'Helvetica Neue': 'Helvetica Neue',
      'Times New Roman': 'Times New Roman',
      'Georgia': 'Georgia',
      'Verdana': 'Verdana',
      'Roboto': 'Roboto',
      'Inter': 'Inter',
      'sans-serif': 'Arial',
      'serif': 'Times New Roman',
      'monospace': 'Courier New'
    };
    
    return fontMap[fontFamily] || 'Inter';
  }
  
  /**
   * Normalize font weight to number
   */
  private static normalizeFontWeight(weight: string | number): number {
    if (typeof weight === 'number') return weight;
    
    const weightMap: Record<string, number> = {
      'normal': 400,
      'bold': 700,
      'lighter': 300,
      'bolder': 900
    };
    
    return weightMap[weight] || parseInt(weight) || 400;
  }
  
  /**
   * Map text alignment
   */
  private static mapTextAlign(align: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
    const alignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
      'left': 'LEFT',
      'center': 'CENTER',
      'right': 'RIGHT',
      'justify': 'JUSTIFIED'
    };
    
    return alignMap[align] || 'LEFT';
  }
  
  /**
   * Map text transform
   */
  private static mapTextTransform(transform: string): 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' {
    const transformMap: Record<string, 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'> = {
      'none': 'ORIGINAL',
      'uppercase': 'UPPER',
      'lowercase': 'LOWER',
      'capitalize': 'TITLE'
    };
    
    return transformMap[transform] || 'ORIGINAL';
  }
  
  /**
   * Resolve numeric value from CSS
   */
  private static resolveNumber(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }
}