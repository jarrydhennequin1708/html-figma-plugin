import { ComputedElementData, FigmaNodeData } from '../types/element-data';
import * as StyleParser from '../utils/style-parser';

export class ComputedToFigmaConverter {
  async convert(data: ComputedElementData): Promise<FigmaNodeData> {
    // Determine if this should be a text node
    if (this.shouldBeTextNode(data)) {
      return this.createTextNode(data);
    }
    
    // Create frame node
    return this.createFrameNode(data);
  }
  
  private shouldBeTextNode(data: ComputedElementData): boolean {
    // Text node if: has text content, no children, and is inline or text element
    const hasOnlyText = data.textContent && data.children.length === 0;
    const isInline = data.computedStyles.display.includes('inline');
    const isTextTag = /^(span|a|em|strong|b|i|u|label|p|h[1-6])$/.test(data.tagName);
    
    return !!(hasOnlyText && (isInline || isTextTag));
  }
  
  private async createTextNode(data: ComputedElementData): Promise<FigmaNodeData> {
    const { computedStyles } = data;
    
    const fontSize = StyleParser.parsePixelValue(computedStyles.fontSize);
    
    return {
      type: 'TEXT',
      name: this.getNodeName(data),
      characters: data.textContent || '',
      fontSize: fontSize,
      fontName: {
        family: StyleParser.parseFontFamily(computedStyles.fontFamily),
        style: StyleParser.parseFontWeight(computedStyles.fontWeight)
      },
      textAlignHorizontal: StyleParser.parseTextAlign(computedStyles.textAlign),
      fills: this.getTextFills(computedStyles),
      lineHeight: StyleParser.parseLineHeight(computedStyles.lineHeight, fontSize),
      letterSpacing: StyleParser.parseLetterSpacing(computedStyles.letterSpacing),
      // Let Figma handle text sizing
      width: data.rect.width,
      height: data.rect.height
    };
  }
  
  private async createFrameNode(data: ComputedElementData): Promise<FigmaNodeData> {
    const { computedStyles, rect } = data;
    
    const node: FigmaNodeData = {
      type: 'FRAME',
      name: this.getNodeName(data),
      width: rect.width,
      height: rect.height,
      fills: this.getBackgroundFills(computedStyles),
      strokes: this.getBorderStrokes(computedStyles),
      strokeWeight: this.getBorderWidth(computedStyles),
      effects: StyleParser.parseBoxShadow(computedStyles.boxShadow),
      
      // Auto Layout
      ...this.getAutoLayoutProperties(computedStyles),
      
      // Process children
      children: []
    };
    
    // Add corner radius if present
    const cornerRadius = StyleParser.parseBorderRadius(
      computedStyles.borderTopLeftRadius,
      computedStyles.borderTopRightRadius,
      computedStyles.borderBottomRightRadius,
      computedStyles.borderBottomLeftRadius
    );
    if (cornerRadius > 0) {
      node.cornerRadius = cornerRadius;
    }
    
    // Convert children
    for (const child of data.children) {
      const childNode = await this.convert(child);
      node.children!.push(childNode);
    }
    
    return node;
  }
  
  private getAutoLayoutProperties(styles: any): any {
    const isAutoLayout = styles.display === 'flex' || styles.display === 'grid';
    
    if (!isAutoLayout) {
      return { layoutMode: 'NONE' };
    }
    
    // Determine direction
    const isVertical = styles.flexDirection === 'column' || 
                       styles.flexDirection === 'column-reverse';
    
    // Calculate gap
    let gap = 0;
    if (styles.gap && styles.gap !== 'normal' && styles.gap !== '0px') {
      // Handle single value gap or row/column gap
      const gapParts = styles.gap.split(' ');
      const gapMatch = gapParts[0].match(/([\d.]+)px/);
      gap = gapMatch ? parseFloat(gapMatch[1]) : 0;
    }
    
    // For grid layouts, check grid-gap as fallback
    if (styles.display === 'grid' && gap === 0) {
      const gridGap = StyleParser.parsePixelValue(styles.gridGap || '0');
      if (gridGap > 0) gap = gridGap;
    }
    
    return {
      layoutMode: isVertical ? 'VERTICAL' : 'HORIZONTAL',
      
      // Let Figma determine sizing based on content
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      
      // Padding
      paddingTop: StyleParser.parsePixelValue(styles.paddingTop),
      paddingRight: StyleParser.parsePixelValue(styles.paddingRight),
      paddingBottom: StyleParser.parsePixelValue(styles.paddingBottom),
      paddingLeft: StyleParser.parsePixelValue(styles.paddingLeft),
      
      // Gap
      itemSpacing: gap,
      
      // Alignment
      primaryAxisAlignItems: this.mapJustifyContent(styles.justifyContent),
      counterAxisAlignItems: this.mapAlignItems(styles.alignItems),
      
      // Wrap for grid simulation
      layoutWrap: styles.flexWrap === 'wrap' ? 'WRAP' : 'NO_WRAP'
    };
  }
  
  private mapJustifyContent(value: string): string {
    switch (value) {
      case 'flex-start': 
      case 'start': 
        return 'MIN';
      case 'center': 
        return 'CENTER';
      case 'flex-end': 
      case 'end': 
        return 'MAX';
      case 'space-between': 
        return 'SPACE_BETWEEN';
      case 'space-around': 
        return 'SPACE_AROUND';
      case 'space-evenly': 
        return 'SPACE_EVENLY';
      default: 
        return 'MIN';
    }
  }
  
  private mapAlignItems(value: string): string {
    switch (value) {
      case 'flex-start': 
      case 'start': 
        return 'MIN';
      case 'center': 
        return 'CENTER';
      case 'flex-end': 
      case 'end': 
        return 'MAX';
      case 'stretch': 
        return 'STRETCH';
      case 'baseline': 
        return 'BASELINE';
      default: 
        return 'MIN';
    }
  }
  
  private getBackgroundFills(styles: any): any[] {
    const color = StyleParser.parseColor(styles.backgroundColor);
    if (color) {
      return [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a * parseFloat(styles.opacity || '1')
      }];
    }
    return [];
  }
  
  private getTextFills(styles: any): any[] {
    const color = StyleParser.parseColor(styles.color);
    if (color) {
      return [{
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a
      }];
    }
    return [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }]; // Default black
  }
  
  private getBorderStrokes(styles: any): any[] {
    // Check if any border has width
    const topWidth = StyleParser.parsePixelValue(styles.borderTopWidth);
    const rightWidth = StyleParser.parsePixelValue(styles.borderRightWidth);
    const bottomWidth = StyleParser.parsePixelValue(styles.borderBottomWidth);
    const leftWidth = StyleParser.parsePixelValue(styles.borderLeftWidth);
    
    if (topWidth > 0 || rightWidth > 0 || bottomWidth > 0 || leftWidth > 0) {
      // Use the first non-zero border color
      let borderColor = null;
      if (topWidth > 0) borderColor = StyleParser.parseColor(styles.borderTopColor);
      else if (rightWidth > 0) borderColor = StyleParser.parseColor(styles.borderRightColor);
      else if (bottomWidth > 0) borderColor = StyleParser.parseColor(styles.borderBottomColor);
      else if (leftWidth > 0) borderColor = StyleParser.parseColor(styles.borderLeftColor);
      
      if (borderColor) {
        return [{
          type: 'SOLID',
          color: { r: borderColor.r, g: borderColor.g, b: borderColor.b },
          opacity: borderColor.a
        }];
      }
    }
    return [];
  }
  
  private getBorderWidth(styles: any): number {
    // Return the maximum border width
    const widths = [
      StyleParser.parsePixelValue(styles.borderTopWidth),
      StyleParser.parsePixelValue(styles.borderRightWidth),
      StyleParser.parsePixelValue(styles.borderBottomWidth),
      StyleParser.parsePixelValue(styles.borderLeftWidth)
    ];
    return Math.max(...widths, 0);
  }
  
  private getNodeName(data: ComputedElementData): string {
    // Try to get a meaningful name
    if (data.tagName === 'div' && data.computedStyles.display === 'flex') {
      return 'Flex Container';
    }
    if (data.tagName === 'div' && data.computedStyles.display === 'grid') {
      return 'Grid Container';
    }
    if (data.textContent && data.textContent.length < 20) {
      return data.textContent;
    }
    
    // Use tag name with common ones prettified
    const tagNameMap: Record<string, string> = {
      'div': 'Container',
      'section': 'Section',
      'article': 'Article',
      'header': 'Header',
      'footer': 'Footer',
      'nav': 'Navigation',
      'main': 'Main',
      'aside': 'Sidebar',
      'h1': 'Heading 1',
      'h2': 'Heading 2',
      'h3': 'Heading 3',
      'h4': 'Heading 4',
      'h5': 'Heading 5',
      'h6': 'Heading 6',
      'p': 'Paragraph',
      'span': 'Text',
      'a': 'Link',
      'button': 'Button',
      'img': 'Image',
      'ul': 'List',
      'ol': 'Numbered List',
      'li': 'List Item'
    };
    
    return tagNameMap[data.tagName] || data.tagName;
  }
}