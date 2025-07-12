// Enhanced CSS property extractor for accurate parsing
export class CSSPropertyExtractor {
  static extractAllProperties(element: any, computedStyles: any): any {
    const properties: any = {};
    
    // Extract layout properties
    Object.assign(properties, this.extractLayoutProperties(computedStyles));
    
    // Extract visual properties
    Object.assign(properties, this.extractVisualProperties(computedStyles));
    
    // Extract text properties
    Object.assign(properties, this.extractTextProperties(computedStyles));
    
    // Extract sizing properties
    Object.assign(properties, this.extractSizingProperties(computedStyles));
    
    console.log('[CSS Extractor] Extracted properties:', properties);
    return properties;
  }
  
  static extractLayoutProperties(styles: any): any {
    const properties: any = {};
    
    // Display type
    properties.display = styles.display || 'block';
    
    // Flexbox properties
    if (properties.display === 'flex') {
      properties.flexDirection = styles.flexDirection || styles['flex-direction'] || 'row';
      properties.justifyContent = styles.justifyContent || styles['justify-content'] || 'flex-start';
      properties.alignItems = styles.alignItems || styles['align-items'] || 'stretch';
      properties.flexWrap = styles.flexWrap || styles['flex-wrap'] || 'nowrap';
    }
    
    // Grid properties
    if (properties.display === 'grid') {
      properties.gridTemplateColumns = styles.gridTemplateColumns || styles['grid-template-columns'] || '';
      properties.gridTemplateRows = styles.gridTemplateRows || styles['grid-template-rows'] || '';
      properties.gridAutoFlow = styles.gridAutoFlow || styles['grid-auto-flow'] || 'row';
    }
    
    // Gap (works for both flex and grid)
    const gap = styles.gap || styles.gridGap || styles['grid-gap'];
    if (gap) {
      properties.gap = this.parseDimension(gap);
    }
    
    // Column and row gaps
    const columnGap = styles.columnGap || styles['column-gap'] || styles.gridColumnGap || styles['grid-column-gap'];
    const rowGap = styles.rowGap || styles['row-gap'] || styles.gridRowGap || styles['grid-row-gap'];
    
    if (columnGap) {
      properties.columnGap = this.parseDimension(columnGap);
    }
    if (rowGap) {
      properties.rowGap = this.parseDimension(rowGap);
    }
    
    // Padding
    properties.padding = this.parsePadding(styles);
    
    // Margin
    properties.margin = styles.margin || '';
    
    return properties;
  }
  
  static extractVisualProperties(styles: any): any {
    const properties: any = {};
    
    // Background
    const bgColor = styles.backgroundColor || styles['background-color'];
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      properties.backgroundColor = bgColor;
    }
    
    // Border
    const border = styles.border;
    if (border && border !== 'none') {
      const borderParts = this.parseBorder(border);
      if (borderParts) {
        properties.borderWidth = borderParts.width;
        properties.borderStyle = borderParts.style;
        properties.borderColor = borderParts.color;
      }
    } else {
      // Check individual border properties
      const borderWidth = styles.borderWidth || styles['border-width'];
      const borderColor = styles.borderColor || styles['border-color'];
      const borderStyle = styles.borderStyle || styles['border-style'];
      
      if (borderWidth && borderWidth !== '0px') {
        properties.borderWidth = this.parseDimension(borderWidth);
      }
      if (borderColor && borderColor !== 'transparent') {
        properties.borderColor = borderColor;
      }
      if (borderStyle && borderStyle !== 'none') {
        properties.borderStyle = borderStyle;
      }
    }
    
    // Border radius
    const borderRadius = styles.borderRadius || styles['border-radius'];
    if (borderRadius && borderRadius !== '0px') {
      properties.borderRadius = this.parseDimension(borderRadius);
    }
    
    // Box shadow
    const boxShadow = styles.boxShadow || styles['box-shadow'];
    if (boxShadow && boxShadow !== 'none') {
      properties.boxShadow = boxShadow;
    }
    
    // Opacity
    const opacity = styles.opacity;
    if (opacity && opacity !== '1') {
      properties.opacity = parseFloat(opacity);
    }
    
    return properties;
  }
  
  static extractTextProperties(styles: any): any {
    const properties: any = {};
    
    // Font family - preserve the full CSS value
    const fontFamily = styles.fontFamily || styles['font-family'];
    if (fontFamily) {
      properties.fontFamily = fontFamily;
    }
    
    // Font size
    const fontSize = styles.fontSize || styles['font-size'];
    if (fontSize) {
      properties.fontSize = fontSize;
    }
    
    // Font weight
    const fontWeight = styles.fontWeight || styles['font-weight'];
    if (fontWeight) {
      properties.fontWeight = fontWeight;
    }
    
    // Text color
    const color = styles.color;
    if (color) {
      properties.color = color;
    }
    
    // Text alignment
    const textAlign = styles.textAlign || styles['text-align'];
    if (textAlign) {
      properties.textAlign = textAlign;
    }
    
    // Line height
    const lineHeight = styles.lineHeight || styles['line-height'];
    if (lineHeight && lineHeight !== 'normal') {
      properties.lineHeight = lineHeight;
    }
    
    // Letter spacing
    const letterSpacing = styles.letterSpacing || styles['letter-spacing'];
    if (letterSpacing && letterSpacing !== 'normal') {
      properties.letterSpacing = letterSpacing;
    }
    
    // Text transform
    const textTransform = styles.textTransform || styles['text-transform'];
    if (textTransform && textTransform !== 'none') {
      properties.textTransform = textTransform;
    }
    
    return properties;
  }
  
  static extractSizingProperties(styles: any): any {
    const properties: any = {};
    
    // Width
    const width = styles.width;
    if (width && width !== 'auto') {
      const parsedWidth = this.parseDimension(width);
      if (parsedWidth > 0) {
        properties.width = parsedWidth;
      }
    }
    
    // Height
    const height = styles.height;
    if (height && height !== 'auto') {
      const parsedHeight = this.parseDimension(height);
      if (parsedHeight > 0) {
        properties.height = parsedHeight;
      }
    }
    
    // Max width
    const maxWidth = styles.maxWidth || styles['max-width'];
    if (maxWidth && maxWidth !== 'none') {
      const parsedMaxWidth = this.parseDimension(maxWidth);
      if (parsedMaxWidth > 0) {
        properties.maxWidth = parsedMaxWidth;
      }
    }
    
    // Min width
    const minWidth = styles.minWidth || styles['min-width'];
    if (minWidth && minWidth !== '0px') {
      const parsedMinWidth = this.parseDimension(minWidth);
      if (parsedMinWidth > 0) {
        properties.minWidth = parsedMinWidth;
      }
    }
    
    // Max height
    const maxHeight = styles.maxHeight || styles['max-height'];
    if (maxHeight && maxHeight !== 'none') {
      const parsedMaxHeight = this.parseDimension(maxHeight);
      if (parsedMaxHeight > 0) {
        properties.maxHeight = parsedMaxHeight;
      }
    }
    
    // Min height
    const minHeight = styles.minHeight || styles['min-height'];
    if (minHeight && minHeight !== '0px') {
      const parsedMinHeight = this.parseDimension(minHeight);
      if (parsedMinHeight > 0) {
        properties.minHeight = parsedMinHeight;
      }
    }
    
    return properties;
  }
  
  static parsePadding(styles: any): any {
    const result = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    
    // Check individual padding values first
    if (styles.paddingTop || styles['padding-top']) {
      result.top = this.parseDimension(styles.paddingTop || styles['padding-top']);
    }
    if (styles.paddingRight || styles['padding-right']) {
      result.right = this.parseDimension(styles.paddingRight || styles['padding-right']);
    }
    if (styles.paddingBottom || styles['padding-bottom']) {
      result.bottom = this.parseDimension(styles.paddingBottom || styles['padding-bottom']);
    }
    if (styles.paddingLeft || styles['padding-left']) {
      result.left = this.parseDimension(styles.paddingLeft || styles['padding-left']);
    }
    
    // Handle shorthand padding
    const padding = styles.padding;
    if (padding && padding !== '0px') {
      const parts = padding.trim().split(/\s+/).map((p: string) => this.parseDimension(p));
      
      switch (parts.length) {
        case 1:
          // padding: 10px
          result.top = result.right = result.bottom = result.left = parts[0];
          break;
        case 2:
          // padding: 10px 20px (vertical horizontal)
          result.top = result.bottom = parts[0];
          result.right = result.left = parts[1];
          break;
        case 3:
          // padding: 10px 20px 30px (top horizontal bottom)
          result.top = parts[0];
          result.right = result.left = parts[1];
          result.bottom = parts[2];
          break;
        case 4:
          // padding: 10px 20px 30px 40px (top right bottom left)
          result.top = parts[0];
          result.right = parts[1];
          result.bottom = parts[2];
          result.left = parts[3];
          break;
      }
    }
    
    return result;
  }
  
  static parseBorder(border: string): any | null {
    if (!border || border === 'none') return null;
    
    // Parse border shorthand (e.g., "1px solid #333")
    const parts = border.trim().split(/\s+/);
    if (parts.length < 2) return null;
    
    const width = this.parseDimension(parts[0]);
    const style = parts[1];
    const color = parts.slice(2).join(' ');
    
    return {
      width,
      style,
      color: color || '#000000'
    };
  }
  
  static parseDimension(value: string | number | undefined): number {
    if (!value) return 0;
    
    const str = value.toString().trim().toLowerCase();
    const num = parseFloat(str);
    
    if (isNaN(num)) return 0;
    
    // Handle different units
    if (str.includes('rem')) {
      return num * 16; // 1rem = 16px
    } else if (str.includes('em')) {
      return num * 16; // Simplified: 1em = 16px
    } else if (str.includes('vh')) {
      return num * 10; // Approximate: 1vh = 10px
    } else if (str.includes('vw')) {
      return num * 14; // Approximate: 1vw = 14px
    } else if (str.includes('%')) {
      // For now, return the percentage value
      // The parent component will need to calculate actual pixels
      return num;
    }
    
    // Default: assume pixels
    return num;
  }
}