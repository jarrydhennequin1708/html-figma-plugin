export class DynamicGridCalculator {
  static calculateGridItemWidth(
    parentGridStyles: Record<string, string>,
    parentWidth: number
  ): number | null {
    const gridColumns = parentGridStyles['grid-template-columns'];
    const gap = this.parseSpacing(parentGridStyles.gap || parentGridStyles['grid-gap'] || '0');
    
    if (!gridColumns) return null;
    
    // Parse repeat(auto-fit, minmax(Xpx, Y)) pattern
    const autoFitMatch = gridColumns.match(/repeat\s*\(\s*auto-fit\s*,\s*minmax\s*\(\s*(\d+)px\s*,\s*([^)]+)\s*\)\s*\)/);
    if (autoFitMatch) {
      const minWidth = parseInt(autoFitMatch[1]);
      const maxWidth = autoFitMatch[2].trim();
      
      // Calculate items per row based on actual container width and constraints
      const itemsPerRow = Math.floor((parentWidth + gap) / (minWidth + gap));
      const actualWidth = Math.max(
        (parentWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
        minWidth
      );
      
      console.log(`[DYNAMIC GRID] Auto-fit calculation:`, {
        gridColumns,
        parentWidth,
        gap,
        minWidth,
        maxWidth,
        itemsPerRow,
        calculatedWidth: Math.round(actualWidth)
      });
      
      return Math.round(actualWidth);
    }
    
    // Parse repeat(auto-fill, minmax(Xpx, Y)) pattern
    const autoFillMatch = gridColumns.match(/repeat\s*\(\s*auto-fill\s*,\s*minmax\s*\(\s*(\d+)px\s*,\s*([^)]+)\s*\)\s*\)/);
    if (autoFillMatch) {
      const minWidth = parseInt(autoFillMatch[1]);
      const maxWidth = autoFillMatch[2].trim();
      
      // Similar calculation for auto-fill
      const itemsPerRow = Math.floor((parentWidth + gap) / (minWidth + gap));
      const actualWidth = Math.max(
        (parentWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
        minWidth
      );
      
      console.log(`[DYNAMIC GRID] Auto-fill calculation:`, {
        gridColumns,
        parentWidth,
        gap,
        minWidth,
        maxWidth,
        itemsPerRow,
        calculatedWidth: Math.round(actualWidth)
      });
      
      return Math.round(actualWidth);
    }
    
    // Parse fixed column patterns: "1fr 1fr", "200px 200px", etc.
    const columnParts = gridColumns.split(/\s+/).filter(part => part.trim());
    if (columnParts.length > 0) {
      // Count actual columns (skip repeat() functions)
      let columns = 0;
      for (const part of columnParts) {
        if (part.includes('repeat(')) {
          // Extract repeat count
          const repeatMatch = part.match(/repeat\s*\(\s*(\d+)/);
          if (repeatMatch) {
            columns += parseInt(repeatMatch[1]);
          }
        } else if (part && !part.includes('(') && !part.includes(')')) {
          columns++;
        }
      }
      
      if (columns > 0) {
        const availableWidth = parentWidth - (gap * (columns - 1));
        const itemWidth = availableWidth / columns;
        
        console.log(`[DYNAMIC GRID] Fixed columns calculation:`, {
          gridColumns,
          columns,
          parentWidth,
          gap,
          calculatedWidth: Math.round(itemWidth)
        });
        
        return Math.round(itemWidth);
      }
    }
    
    return null;
  }
  
  private static parseSpacing(value: string): number {
    if (!value || value === 'auto' || value === 'none') return 0;
    const match = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|%)?$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      
      // Handle different units
      if (unit === 'em' || unit === 'rem') {
        return num * 16; // Default 1em/rem = 16px
      }
      return num;
    }
    return 0;
  }
}