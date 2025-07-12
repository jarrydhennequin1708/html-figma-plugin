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

export class DynamicWidthDetector {
  static getEffectiveParentWidth(
    element: SimpleElement,
    parentElement: SimpleElement | null,
    cssParser: SimpleCSSParser
  ): number {
    // Start with the parent element or the element itself
    let currentElement = parentElement || element;
    let containerWidth = 1400; // Default viewport width
    const checkedElements: string[] = [];
    
    // Traverse up the DOM tree
    while (currentElement) {
      const elementId = currentElement.className || currentElement.tagName;
      checkedElements.push(elementId);
      
      const styles = cssParser.getStylesForElement(currentElement);
      
      // Check for explicit width constraints
      const maxWidth = this.parseWidth(styles['max-width']);
      const width = this.parseWidth(styles.width);
      
      // Priority 1: max-width (most common for containers)
      if (maxWidth && maxWidth > 0) {
        containerWidth = maxWidth;
        console.log(`[DYNAMIC WIDTH] Found max-width: ${maxWidth}px on ${elementId}`);
        break;
      }
      
      // Priority 2: fixed width (not percentage)
      if (width && width > 0 && !styles.width?.includes('%')) {
        containerWidth = width;
        console.log(`[DYNAMIC WIDTH] Found width: ${width}px on ${elementId}`);
        break;
      }
      
      // Move up to parent
      if (!currentElement.parent) break;
      currentElement = currentElement.parent;
    }
    
    console.log(`[DYNAMIC WIDTH] Effective width: ${containerWidth}px (checked: ${checkedElements.join(' → ')})`);
    return containerWidth;
  }
  
  static getElementWidth(
    element: SimpleElement,
    cssParser: SimpleCSSParser
  ): number | null {
    const styles = cssParser.getStylesForElement(element);
    
    // Check for explicit width
    const width = this.parseWidth(styles.width);
    if (width && width > 0) {
      console.log(`[DYNAMIC WIDTH] Element ${element.className} has width: ${width}px`);
      return width;
    }
    
    // Check for max-width as a constraint
    const maxWidth = this.parseWidth(styles['max-width']);
    if (maxWidth && maxWidth > 0) {
      console.log(`[DYNAMIC WIDTH] Element ${element.className} has max-width: ${maxWidth}px`);
      return maxWidth;
    }
    
    return null;
  }
  
  private static parseWidth(value: string | undefined): number | null {
    if (!value || value === 'auto' || value === 'none' || value === 'inherit') return null;
    
    // Skip percentage widths for container calculation
    if (value.includes('%')) return null;
    
    // Handle calc() expressions
    if (value.includes('calc')) {
      // Try to extract a pixel value from calc
      const calcMatch = value.match(/(\d+(?:\.\d+)?)\s*px/);
      if (calcMatch) {
        return parseFloat(calcMatch[1]);
      }
      return null;
    }
    
    // Standard parsing
    const match = value.match(/^(\d+(?:\.\d+)?)\s*(px|em|rem|vw|vh)?$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      
      // Convert units to pixels
      switch (unit) {
        case 'em':
        case 'rem':
          return num * 16; // Default 1em/rem = 16px
        case 'vw':
          return num * 14; // Assuming 1400px viewport
        case 'vh':
          return num * 8; // Assuming 800px viewport height
        default:
          return num;
      }
    }
    
    return null;
  }
}