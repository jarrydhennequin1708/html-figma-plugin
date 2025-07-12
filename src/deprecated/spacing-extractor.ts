interface SpacingData {
  gap: number;
  marginBottom: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  gridConstraints?: {
    minWidth: number;
    maxWidth: string;
    isAutoFit: boolean;
  };
}

export class SpacingExtractor {
  static extractAllSpacing(
    element: any, // SimpleElement type
    cssStyles: Record<string, string>,
    children?: any[], // SimpleElement[] type
    cssParser?: any // SimpleCSSParser type
  ): SpacingData {
    const spacing: SpacingData = {
      gap: this.extractGapSpacing(cssStyles),
      marginBottom: this.extractMarginSpacing(cssStyles),
      padding: this.extractPaddingSpacing(cssStyles),
      gridConstraints: this.extractGridConstraints(cssStyles)
    };
    
    // Dashboard-specific: Extract spacing from children's margins
    if (element.className?.includes('dashboard') && children && cssParser) {
      const childSpacing = this.extractChildMarginSpacing(children, cssParser);
      if (childSpacing > spacing.gap) {
        spacing.gap = childSpacing;
        console.log(`[DASHBOARD SPACING] Using child margin-bottom: ${childSpacing}px`);
      }
    }
    
    return spacing;
  }
  
  private static extractGapSpacing(styles: Record<string, string>): number {
    const gap = styles.gap || styles['grid-gap'] || styles['column-gap'];
    return gap ? parseFloat(gap.replace('px', '')) || 0 : 0;
  }
  
  private static extractMarginSpacing(styles: Record<string, string>): number {
    const marginBottom = styles['margin-bottom'];
    return marginBottom ? parseFloat(marginBottom.replace('px', '')) || 0 : 0;
  }
  
  private static extractPaddingSpacing(styles: Record<string, string>): {
    top: number; right: number; bottom: number; left: number;
  } {
    const padding = styles.padding;
    if (padding) {
      // Handle shorthand padding
      const parts = padding.split(/\s+/).map(p => parseFloat(p.replace('px', '')) || 0);
      if (parts.length === 1) {
        const value = parts[0];
        return { top: value, right: value, bottom: value, left: value };
      } else if (parts.length === 2) {
        return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
      } else if (parts.length === 3) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
      } else if (parts.length === 4) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
      }
    }
    
    return {
      top: parseFloat(styles['padding-top']?.replace('px', '') || '0'),
      right: parseFloat(styles['padding-right']?.replace('px', '') || '0'),
      bottom: parseFloat(styles['padding-bottom']?.replace('px', '') || '0'),
      left: parseFloat(styles['padding-left']?.replace('px', '') || '0')
    };
  }
  
  private static extractGridConstraints(styles: Record<string, string>) {
    const gridColumns = styles['grid-template-columns'];
    if (!gridColumns) return undefined;
    
    // Parse repeat(auto-fit, minmax(300px, 1fr))
    const autoFitMatch = gridColumns.match(/repeat\(auto-fit,\s*minmax\((\d+)px,\s*([^)]+)\)/);
    if (autoFitMatch) {
      return {
        minWidth: parseInt(autoFitMatch[1]),
        maxWidth: autoFitMatch[2],
        isAutoFit: true
      };
    }
    
    return undefined;
  }
  
  // CRITICAL: Extract spacing from children's margin-bottom
  private static extractChildMarginSpacing(children: any[], cssParser: any): number {
    const margins: number[] = [];
    
    children.forEach(child => {
      if (!child.className) return;
      
      const childStyles = cssParser.getStylesForElement(child) || {};
      const marginBottom = this.extractMarginSpacing(childStyles);
      
      if (marginBottom > 0) {
        margins.push(marginBottom);
        console.log(`[CHILD MARGIN] ${child.className}: ${marginBottom}px`);
      }
    });
    
    // Return the most common or maximum margin
    if (margins.length > 0) {
      const maxMargin = Math.max(...margins);
      console.log(`[CHILD MARGINS] Found margins: ${margins.join(', ')}px, using: ${maxMargin}px`);
      return maxMargin;
    }
    
    return 0;
  }
}