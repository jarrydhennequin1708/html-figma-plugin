export class GridWidthCalculator {
  static calculateItemWidth(
    gridConstraints: any,
    containerWidth: number = 1320,
    gap: number = 24
  ): number {
    if (!gridConstraints?.isAutoFit) {
      return gridConstraints?.minWidth || 300;
    }
    
    const minWidth = gridConstraints.minWidth;
    
    // Calculate how many items fit per row
    const itemsPerRow = Math.floor((containerWidth + gap) / (minWidth + gap));
    
    // Calculate actual item width (never smaller than minWidth)
    const actualWidth = Math.max(
      (containerWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
      minWidth
    );
    
    console.log(`[GRID CALC] Container: ${containerWidth}px, Items: ${itemsPerRow}, Width: ${Math.round(actualWidth)}px`);
    
    return Math.round(actualWidth);
  }
  
  static isGridChild(element: any, parentElement?: any): boolean {
    if (!parentElement) return false;
    
    // Check if parent has grid display
    // This needs to be integrated with the CSS parser
    return false; // Will be implemented with CSS parser integration
  }
  
  static calculateGridDimensions(
    gridConstraints: any,
    containerWidth: number = 1320,
    gap: number = 24,
    itemCount: number = 6
  ): { itemWidth: number; rows: number; columns: number } {
    const itemWidth = this.calculateItemWidth(gridConstraints, containerWidth, gap);
    const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const rows = Math.ceil(itemCount / columns);
    
    console.log(`[GRID DIMENSIONS] ${itemCount} items in ${columns}x${rows} grid, ${itemWidth}px each`);
    
    return { itemWidth, rows, columns };
  }
  
  static calculateResponsiveBreakpoints(
    minWidth: number,
    gap: number = 24
  ): { small: number; medium: number; large: number } {
    // Calculate breakpoints where grid changes from 1 to 2 to 3 columns
    const small = minWidth; // 1 column
    const medium = (minWidth * 2) + gap; // 2 columns
    const large = (minWidth * 3) + (gap * 2); // 3 columns
    
    console.log(`[GRID BREAKPOINTS] ${small}px (1 col), ${medium}px (2 cols), ${large}px (3 cols)`);
    
    return { small, medium, large };
  }
}