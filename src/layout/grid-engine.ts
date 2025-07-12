/**
 * CSS Grid Layout Engine
 * 
 * Implements CSS Grid Layout specification with focus on auto-fit/auto-fill patterns.
 * Handles the most common grid patterns used in modern web design.
 */

import { ComputedStyle, LayoutBox } from '../engine/css-engine';

export interface GridItem {
  element: Element;
  computedStyles: ComputedStyle;
  
  // Grid placement
  gridRowStart: number | 'auto';
  gridRowEnd: number | 'auto';
  gridColumnStart: number | 'auto';
  gridColumnEnd: number | 'auto';
  
  // Computed placement
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  
  // Final layout
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridTrack {
  size: number;
  type: 'fixed' | 'flexible' | 'auto';
  minSize: number;
  maxSize: number;
}

export class GridLayoutEngine {
  
  /**
   * Main entry point: Calculate grid layout
   */
  static calculateGridLayout(
    container: Element,
    containerStyles: ComputedStyle,
    children: Element[],
    childrenStyles: ComputedStyle[]
  ): { containerBox: LayoutBox; itemBoxes: LayoutBox[] } {
    
    // Extract grid properties
    const gridTemplateColumns = (containerStyles['grid-template-columns'] as string) || 'none';
    const gridTemplateRows = (containerStyles['grid-template-rows'] as string) || 'none';
    const gridAutoFlow = (containerStyles['grid-auto-flow'] as string) || 'row';
    const gridAutoColumns = (containerStyles['grid-auto-columns'] as string) || 'auto';
    const gridAutoRows = (containerStyles['grid-auto-rows'] as string) || 'auto';
    
    // Container dimensions
    const containerWidth = this.resolveSize(containerStyles.width);
    const containerHeight = this.resolveSize(containerStyles.height);
    
    // Container padding
    const paddingTop = this.resolveSize(containerStyles['padding-top']);
    const paddingRight = this.resolveSize(containerStyles['padding-right']);
    const paddingBottom = this.resolveSize(containerStyles['padding-bottom']);
    const paddingLeft = this.resolveSize(containerStyles['padding-left']);
    
    // Available space
    const availableWidth = containerWidth - paddingLeft - paddingRight;
    const availableHeight = containerHeight === 'auto' ? Infinity : containerHeight - paddingTop - paddingBottom;
    
    // Gap
    const gap = this.resolveSize(containerStyles['gap']) || 0;
    const rowGap = this.resolveSize(containerStyles['row-gap']) || gap;
    const columnGap = this.resolveSize(containerStyles['column-gap']) || gap;
    
    // Parse grid template
    const columnTracks = this.parseGridTemplate(gridTemplateColumns, availableWidth, columnGap);
    const rowTracks = gridTemplateRows === 'none' ? [] : this.parseGridTemplate(gridTemplateRows, availableHeight, rowGap);
    
    // Create grid items
    const gridItems = this.createGridItems(children, childrenStyles);
    
    // Place items in grid
    this.placeGridItems(gridItems, columnTracks, rowTracks, gridAutoFlow);
    
    // Size tracks
    const finalColumnSizes = this.sizeGridTracks(columnTracks, availableWidth, columnGap);
    const finalRowSizes = this.calculateRowSizes(gridItems, rowTracks, gridAutoRows);
    
    // Position items
    this.positionGridItems(gridItems, finalColumnSizes, finalRowSizes, columnGap, rowGap, paddingLeft, paddingTop);
    
    // Calculate container height if auto
    let finalContainerHeight = containerHeight;
    if (containerHeight === 'auto') {
      const totalRowHeight = finalRowSizes.reduce((sum, size) => sum + size, 0);
      const totalRowGap = rowGap * Math.max(0, finalRowSizes.length - 1);
      finalContainerHeight = paddingTop + totalRowHeight + totalRowGap + paddingBottom;
    }
    
    return {
      containerBox: {
        width: containerWidth,
        height: finalContainerHeight,
        x: 0,
        y: 0,
        marginTop: this.resolveSize(containerStyles['margin-top']),
        marginRight: this.resolveSize(containerStyles['margin-right']),
        marginBottom: this.resolveSize(containerStyles['margin-bottom']),
        marginLeft: this.resolveSize(containerStyles['margin-left']),
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        borderTopWidth: this.resolveSize(containerStyles['border-top-width']),
        borderRightWidth: this.resolveSize(containerStyles['border-right-width']),
        borderBottomWidth: this.resolveSize(containerStyles['border-bottom-width']),
        borderLeftWidth: this.resolveSize(containerStyles['border-left-width'])
      },
      itemBoxes: gridItems.map(item => ({
        width: item.width,
        height: item.height,
        x: item.x,
        y: item.y,
        marginTop: this.resolveSize(item.computedStyles['margin-top']),
        marginRight: this.resolveSize(item.computedStyles['margin-right']),
        marginBottom: this.resolveSize(item.computedStyles['margin-bottom']),
        marginLeft: this.resolveSize(item.computedStyles['margin-left']),
        paddingTop: this.resolveSize(item.computedStyles['padding-top']),
        paddingRight: this.resolveSize(item.computedStyles['padding-right']),
        paddingBottom: this.resolveSize(item.computedStyles['padding-bottom']),
        paddingLeft: this.resolveSize(item.computedStyles['padding-left']),
        borderTopWidth: this.resolveSize(item.computedStyles['border-top-width']),
        borderRightWidth: this.resolveSize(item.computedStyles['border-right-width']),
        borderBottomWidth: this.resolveSize(item.computedStyles['border-bottom-width']),
        borderLeftWidth: this.resolveSize(item.computedStyles['border-left-width'])
      }))
    };
  }
  
  /**
   * Special handler for auto-fit grid pattern
   */
  static calculateAutoFitGrid(
    container: Element,
    containerStyles: ComputedStyle,
    children: Element[]
  ): { containerBox: LayoutBox; itemBoxes: LayoutBox[] } {
    
    const gridTemplateColumns = containerStyles['grid-template-columns'] as string;
    const gap = this.resolveSize(containerStyles['gap']) || 0;
    const containerWidth = this.resolveSize(containerStyles['width']);
    
    // Container padding
    const paddingTop = this.resolveSize(containerStyles['padding-top']);
    const paddingRight = this.resolveSize(containerStyles['padding-right']);
    const paddingBottom = this.resolveSize(containerStyles['padding-bottom']);
    const paddingLeft = this.resolveSize(containerStyles['padding-left']);
    
    const availableWidth = containerWidth - paddingLeft - paddingRight;
    
    // Parse minmax pattern
    const minmaxMatch = gridTemplateColumns.match(/repeat\(\s*(auto-fit|auto-fill)\s*,\s*minmax\(([^,]+),([^)]+)\)\)/);
    
    if (!minmaxMatch) {
      // Fallback to regular grid calculation
      return this.calculateGridLayout(container, containerStyles, children, children.map(() => ({})));
    }
    
    const isAutoFit = minmaxMatch[1] === 'auto-fit';
    const minSizeStr = minmaxMatch[2].trim();
    const maxSizeStr = minmaxMatch[3].trim();
    
    // Resolve min size
    const minSize = this.resolveTrackSize(minSizeStr, availableWidth);
    
    // Calculate how many columns fit
    const minColumns = Math.floor((availableWidth + gap) / (minSize + gap));
    const actualColumns = Math.max(1, minColumns);
    
    // For auto-fit, columns shrink if there are fewer items
    const columnsToUse = isAutoFit ? Math.min(actualColumns, children.length) : actualColumns;
    
    // Calculate actual column width
    let columnWidth: number;
    if (maxSizeStr === '1fr') {
      // Distribute available space evenly
      const totalGap = gap * (columnsToUse - 1);
      columnWidth = (availableWidth - totalGap) / columnsToUse;
    } else {
      // Use max size if specified
      const maxSize = this.resolveTrackSize(maxSizeStr, availableWidth);
      columnWidth = Math.min(maxSize, (availableWidth - gap * (columnsToUse - 1)) / columnsToUse);
    }
    
    // Ensure column width respects min size
    columnWidth = Math.max(columnWidth, minSize);
    
    // Create item boxes
    const itemBoxes: LayoutBox[] = [];
    const rows = Math.ceil(children.length / columnsToUse);
    
    children.forEach((child, index) => {
      const row = Math.floor(index / columnsToUse);
      const col = index % columnsToUse;
      
      // Get child's intrinsic height
      const childHeight = this.calculateItemHeight(child);
      
      itemBoxes.push({
        width: columnWidth,
        height: childHeight,
        x: paddingLeft + col * (columnWidth + gap),
        y: paddingTop + row * (childHeight + gap),
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0
      });
    });
    
    // Calculate container height
    const maxY = itemBoxes.reduce((max, box) => Math.max(max, box.y + box.height), 0);
    const containerHeight = maxY + paddingBottom;
    
    return {
      containerBox: {
        width: containerWidth,
        height: containerHeight,
        x: 0,
        y: 0,
        marginTop: this.resolveSize(containerStyles['margin-top']),
        marginRight: this.resolveSize(containerStyles['margin-right']),
        marginBottom: this.resolveSize(containerStyles['margin-bottom']),
        marginLeft: this.resolveSize(containerStyles['margin-left']),
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        borderTopWidth: this.resolveSize(containerStyles['border-top-width']),
        borderRightWidth: this.resolveSize(containerStyles['border-right-width']),
        borderBottomWidth: this.resolveSize(containerStyles['border-bottom-width']),
        borderLeftWidth: this.resolveSize(containerStyles['border-left-width'])
      },
      itemBoxes
    };
  }
  
  /**
   * Parse grid-template-columns/rows
   */
  private static parseGridTemplate(
    template: string,
    availableSize: number,
    gap: number
  ): GridTrack[] {
    
    const tracks: GridTrack[] = [];
    
    // Handle repeat() with auto-fit/auto-fill
    const repeatMatch = template.match(/repeat\(\s*(auto-fit|auto-fill|\d+)\s*,\s*([^)]+)\)/);
    if (repeatMatch) {
      const count = repeatMatch[1];
      const trackDef = repeatMatch[2].trim();
      
      if (count === 'auto-fit' || count === 'auto-fill') {
        // Parse minmax
        const minmaxMatch = trackDef.match(/minmax\(([^,]+),([^)]+)\)/);
        if (minmaxMatch) {
          const minSize = this.resolveTrackSize(minmaxMatch[1].trim(), availableSize);
          const maxSize = minmaxMatch[2].trim();
          
          // Calculate how many tracks fit
          const numTracks = Math.floor((availableSize + gap) / (minSize + gap));
          
          for (let i = 0; i < numTracks; i++) {
            tracks.push({
              size: 0,
              type: maxSize === '1fr' ? 'flexible' : 'fixed',
              minSize,
              maxSize: maxSize === '1fr' ? Infinity : this.resolveTrackSize(maxSize, availableSize)
            });
          }
        }
      } else {
        // Fixed repeat count
        const repeatCount = parseInt(count);
        const sizes = this.parseTrackSizes(trackDef, availableSize);
        
        for (let i = 0; i < repeatCount; i++) {
          tracks.push(...sizes);
        }
      }
    } else {
      // Parse individual track sizes
      tracks.push(...this.parseTrackSizes(template, availableSize));
    }
    
    return tracks;
  }
  
  /**
   * Parse individual track sizes
   */
  private static parseTrackSizes(sizesStr: string, availableSize: number): GridTrack[] {
    const tracks: GridTrack[] = [];
    
    // Split by spaces, but respect functions like minmax()
    const sizes = sizesStr.match(/[^\s]+(?:\([^)]*\))?/g) || [];
    
    sizes.forEach(size => {
      if (size.includes('minmax')) {
        const minmaxMatch = size.match(/minmax\(([^,]+),([^)]+)\)/);
        if (minmaxMatch) {
          const minSize = this.resolveTrackSize(minmaxMatch[1].trim(), availableSize);
          const maxSizeStr = minmaxMatch[2].trim();
          
          tracks.push({
            size: 0,
            type: maxSizeStr.includes('fr') ? 'flexible' : 'fixed',
            minSize,
            maxSize: maxSizeStr === '1fr' ? Infinity : this.resolveTrackSize(maxSizeStr, availableSize)
          });
        }
      } else if (size.includes('fr')) {
        const frValue = parseFloat(size);
        tracks.push({
          size: 0,
          type: 'flexible',
          minSize: 0,
          maxSize: Infinity
        });
      } else if (size === 'auto') {
        tracks.push({
          size: 0,
          type: 'auto',
          minSize: 0,
          maxSize: Infinity
        });
      } else {
        const fixedSize = this.resolveTrackSize(size, availableSize);
        tracks.push({
          size: fixedSize,
          type: 'fixed',
          minSize: fixedSize,
          maxSize: fixedSize
        });
      }
    });
    
    return tracks;
  }
  
  /**
   * Resolve track size to pixels
   */
  private static resolveTrackSize(size: string, availableSize: number): number {
    if (size.endsWith('px')) {
      return parseFloat(size);
    }
    if (size.endsWith('%')) {
      return (parseFloat(size) / 100) * availableSize;
    }
    if (size === 'auto' || size === 'min-content' || size === 'max-content') {
      return 0; // Will be resolved later based on content
    }
    return parseFloat(size) || 0;
  }
  
  /**
   * Create grid items from elements
   */
  private static createGridItems(
    elements: Element[],
    styles: ComputedStyle[]
  ): GridItem[] {
    return elements.map((element, index) => {
      const style = styles[index];
      
      return {
        element,
        computedStyles: style,
        gridRowStart: this.parseGridLine(style['grid-row-start'] as string),
        gridRowEnd: this.parseGridLine(style['grid-row-end'] as string),
        gridColumnStart: this.parseGridLine(style['grid-column-start'] as string),
        gridColumnEnd: this.parseGridLine(style['grid-column-end'] as string),
        row: 0,
        column: 0,
        rowSpan: 1,
        columnSpan: 1,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    });
  }
  
  /**
   * Parse grid line value
   */
  private static parseGridLine(value: string | undefined): number | 'auto' {
    if (!value || value === 'auto') return 'auto';
    
    const num = parseInt(value);
    return isNaN(num) ? 'auto' : num;
  }
  
  /**
   * Place items in grid using auto-placement algorithm
   */
  private static placeGridItems(
    items: GridItem[],
    columnTracks: GridTrack[],
    rowTracks: GridTrack[],
    gridAutoFlow: string
  ): void {
    
    const numColumns = columnTracks.length || 1;
    let currentRow = 0;
    let currentColumn = 0;
    
    // Simple auto-placement
    items.forEach(item => {
      // For now, place items sequentially
      item.row = currentRow;
      item.column = currentColumn;
      item.rowSpan = 1;
      item.columnSpan = 1;
      
      // Move to next position
      currentColumn++;
      if (currentColumn >= numColumns) {
        currentColumn = 0;
        currentRow++;
      }
    });
  }
  
  /**
   * Size grid tracks based on content and constraints
   */
  private static sizeGridTracks(
    tracks: GridTrack[],
    availableSize: number,
    gap: number
  ): number[] {
    
    if (tracks.length === 0) return [];
    
    const sizes: number[] = new Array(tracks.length);
    const totalGap = gap * (tracks.length - 1);
    let remainingSpace = availableSize - totalGap;
    
    // First pass: allocate fixed sizes
    tracks.forEach((track, i) => {
      if (track.type === 'fixed') {
        sizes[i] = track.size;
        remainingSpace -= track.size;
      }
    });
    
    // Second pass: distribute remaining space to flexible tracks
    const flexibleTracks = tracks.filter(t => t.type === 'flexible');
    if (flexibleTracks.length > 0 && remainingSpace > 0) {
      const sizePerTrack = remainingSpace / flexibleTracks.length;
      
      tracks.forEach((track, i) => {
        if (track.type === 'flexible') {
          sizes[i] = Math.max(track.minSize, Math.min(sizePerTrack, track.maxSize));
        }
      });
    }
    
    // Fill in any remaining tracks
    tracks.forEach((track, i) => {
      if (sizes[i] === undefined) {
        sizes[i] = track.minSize;
      }
    });
    
    return sizes;
  }
  
  /**
   * Calculate row sizes based on content
   */
  private static calculateRowSizes(
    items: GridItem[],
    rowTracks: GridTrack[],
    gridAutoRows: string
  ): number[] {
    
    // Find max row needed
    const maxRow = items.reduce((max, item) => Math.max(max, item.row), 0);
    const numRows = maxRow + 1;
    
    const rowHeights: number[] = new Array(numRows).fill(0);
    
    // Calculate height based on tallest item in each row
    items.forEach(item => {
      const itemHeight = this.calculateItemHeight(item.element);
      rowHeights[item.row] = Math.max(rowHeights[item.row], itemHeight);
    });
    
    // Apply minimum heights from tracks
    rowTracks.forEach((track, i) => {
      if (i < rowHeights.length && track.minSize > 0) {
        rowHeights[i] = Math.max(rowHeights[i], track.minSize);
      }
    });
    
    return rowHeights;
  }
  
  /**
   * Calculate item height based on content
   */
  private static calculateItemHeight(element: Element): number {
    // This is a simplified calculation
    // In a real implementation, this would measure text, images, etc.
    
    if (element.tagName.match(/^(h1|h2|h3|h4|h5|h6)$/i)) {
      return 40; // Heading height
    }
    
    if (element.tagName === 'P') {
      const lines = (element.textContent || '').split('\n').length;
      return lines * 24; // Line height estimate
    }
    
    // Default height for other elements
    return 150;
  }
  
  /**
   * Position grid items based on calculated track sizes
   */
  private static positionGridItems(
    items: GridItem[],
    columnSizes: number[],
    rowSizes: number[],
    columnGap: number,
    rowGap: number,
    offsetX: number,
    offsetY: number
  ): void {
    
    items.forEach(item => {
      // Calculate x position
      let x = offsetX;
      for (let i = 0; i < item.column; i++) {
        x += columnSizes[i] + columnGap;
      }
      
      // Calculate y position
      let y = offsetY;
      for (let i = 0; i < item.row; i++) {
        y += rowSizes[i] + rowGap;
      }
      
      // Calculate width (spanning multiple columns)
      let width = 0;
      for (let i = 0; i < item.columnSpan; i++) {
        if (item.column + i < columnSizes.length) {
          width += columnSizes[item.column + i];
          if (i > 0) width += columnGap;
        }
      }
      
      // Calculate height (spanning multiple rows)
      let height = 0;
      for (let i = 0; i < item.rowSpan; i++) {
        if (item.row + i < rowSizes.length) {
          height += rowSizes[item.row + i];
          if (i > 0) height += rowGap;
        }
      }
      
      item.x = x;
      item.y = y;
      item.width = width;
      item.height = height;
    });
  }
  
  /**
   * Resolve size value to number
   */
  private static resolveSize(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (!value || value === 'auto' || value === 'initial') return 0;
    if (typeof value === 'string' && value.endsWith('px')) {
      return parseFloat(value);
    }
    return 0;
  }
}