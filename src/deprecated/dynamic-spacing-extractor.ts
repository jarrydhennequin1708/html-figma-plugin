interface SimpleElement {
  tagName: string;
  className?: string;
  children: SimpleElement[];
  parent?: SimpleElement;
  attributes?: Record<string, string>;
  style?: Record<string, string>;
}

interface SimpleCSSParser {
  getStylesForElement(element: SimpleElement): Record<string, string>;
}

export class DynamicSpacingExtractor {
  static extractContainerSpacing(
    element: SimpleElement,
    elementStyles: Record<string, string>,
    cssParser: SimpleCSSParser
  ): number {
    // Priority 1: Explicit CSS gap
    const explicitGap = this.parseSpacing(elementStyles.gap || elementStyles['grid-gap'] || elementStyles['column-gap'] || '');
    if (explicitGap > 0) {
      console.log(`[DYNAMIC SPACING] Using explicit gap: ${explicitGap}px`);
      return explicitGap;
    }
    
    // Priority 2: Extract from children's margin-bottom
    if (element.children && element.children.length >= 2) {
      const childMargins = this.extractChildMargins(element.children, cssParser);
      if (childMargins.length > 0) {
        // Use the most common margin value
        const marginCounts = new Map<number, number>();
        childMargins.forEach(margin => {
          marginCounts.set(margin, (marginCounts.get(margin) || 0) + 1);
        });
        
        let maxCount = 0;
        let mostCommonMargin = 0;
        marginCounts.forEach((count, margin) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonMargin = margin;
          }
        });
        
        console.log(`[DYNAMIC SPACING] Using child margins: ${mostCommonMargin}px from ${childMargins}`);
        return mostCommonMargin;
      }
    }
    
    // Priority 3: No spacing
    console.log(`[DYNAMIC SPACING] No spacing found for ${element.className || element.tagName}`);
    return 0;
  }
  
  private static extractChildMargins(
    children: SimpleElement[],
    cssParser: SimpleCSSParser
  ): number[] {
    const margins: number[] = [];
    
    children.forEach((child, index) => {
      // Skip last child (no margin needed after last element)
      if (index === children.length - 1) return;
      
      const childStyles = cssParser.getStylesForElement(child);
      const marginBottom = this.parseSpacing(childStyles['margin-bottom'] || '');
      
      if (marginBottom > 0) {
        margins.push(marginBottom);
        console.log(`[CHILD MARGIN] ${child.className || child.tagName}: ${marginBottom}px`);
      }
    });
    
    return margins;
  }
  
  static parseSpacing(value: string): number {
    if (!value || value === 'auto' || value === 'none' || value === 'normal') return 0;
    
    // Handle calc() expressions by trying to extract a number
    if (value.includes('calc')) {
      const calcMatch = value.match(/(\d+(?:\.\d+)?)\s*px/);
      if (calcMatch) {
        return parseFloat(calcMatch[1]);
      }
      return 0;
    }
    
    // Standard parsing
    const match = value.match(/^(\d+(?:\.\d+)?)\s*(px|em|rem|%)?$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      
      // Handle different units
      if (unit === 'em' || unit === 'rem') {
        return num * 16; // Default 1em/rem = 16px
      } else if (unit === '%') {
        // For spacing, percentage doesn't make sense without context
        return 0;
      }
      return num;
    }
    return 0;
  }
}