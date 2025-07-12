// Intelligent sizing strategy for Figma Auto Layout
export class SizingStrategy {
  static applySizing(
    node: FrameNode,
    properties: any,
    context: {
      isChild: boolean;
      parentDisplay?: string;
      parentWidth?: number;
    }
  ): void {
    console.log('[SizingStrategy] Applying sizing:', {
      name: node.name,
      properties,
      context
    });
    
    const width = properties.width;
    const maxWidth = properties.maxWidth;
    const height = properties.height;
    
    // VERTICAL SIZING - Always HUG unless explicit height
    if (height && height > 0) {
      // Explicit height - use FIXED
      if ('layoutSizingVertical' in node) {
        node.layoutSizingVertical = 'FIXED';
      }
    } else {
      // Default: HUG content vertically
      if ('layoutSizingVertical' in node) {
        node.layoutSizingVertical = 'HUG';
      }
    }
    
    // HORIZONTAL SIZING
    if (maxWidth && maxWidth > 0) {
      // Max-width containers (like dashboard-container)
      if ('layoutSizingHorizontal' in node) {
        node.layoutSizingHorizontal = 'FILL'; // Changed from FIXED to FILL for max-width containers
        console.log('[SizingStrategy] Max-width container - using FILL mode');
      }
      
      // Center if margin: 0 auto
      if (properties.margin === '0 auto' && 'layoutAlign' in node) {
        node.layoutAlign = 'CENTER';
      }
    } else if (width && width > 0) {
      // Explicit width - use FIXED
      if ('layoutSizingHorizontal' in node) {
        node.layoutSizingHorizontal = 'FIXED';
      }
    } else {
      // NO explicit width - decide between FILL and HUG
      if (this.shouldFillWidth(properties, context)) {
        if ('layoutSizingHorizontal' in node) {
          node.layoutSizingHorizontal = 'FILL';
          console.log('[SizingStrategy] No width specified - using FILL mode for:', node.name);
        }
      } else {
        if ('layoutSizingHorizontal' in node) {
          node.layoutSizingHorizontal = 'HUG';
          console.log('[SizingStrategy] No width specified - using HUG mode for:', node.name);
        }
      }
    }
    
    // Only resize if we have BOTH explicit dimensions
    if ((width && width > 0) && (height && height > 0)) {
      node.resize(width, height);
    } else if ((maxWidth && maxWidth > 0) && (height && height > 0)) {
      node.resize(maxWidth, height);
    }
    // NO other resize calls - let Auto Layout handle everything else
    
    console.log('[SizingStrategy] Applied sizing:', {
      width: node.width,
      height: node.height,
      horizontalSizing: (node as any).layoutSizingHorizontal,
      verticalSizing: (node as any).layoutSizingVertical
    });
  }
  
  private static shouldFillWidth(properties: any, context: any): boolean {
    // Already marked to fill
    if (properties.shouldFillParent) return true;
    
    // Container elements (flex/grid) should FILL
    if (properties.display === 'flex' || properties.display === 'grid') return true;
    
    // Child elements in Auto Layout containers should usually FILL
    if (context.isChild) return true;
    
    // Text elements should HUG
    if (properties.isTextElement) return false;
    
    return false; // Default to HUG for unknown elements
  }
  
  static applyLayoutProperties(node: FrameNode, properties: any): void {
    console.log('[SizingStrategy] Applying layout properties:', properties);
    
    // Set layout mode based on display
    if (properties.display === 'flex') {
      node.layoutMode = properties.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';
      
      // Apply flexbox alignment
      this.applyFlexAlignment(node, properties);
    } else if (properties.display === 'grid') {
      // For CSS Grid, we simulate with Auto Layout
      node.layoutMode = 'HORIZONTAL';
      
      // Enable wrapping for grid layouts
      if ('layoutWrap' in node) {
        node.layoutWrap = 'WRAP';
      }
      
      // Parse grid template columns for responsive behavior
      if (properties.gridTemplateColumns) {
        this.applyGridLayout(node, properties);
      }
    } else if (properties.display === 'block' || properties.display === 'flex') {
      // Default to vertical layout for block elements
      node.layoutMode = 'VERTICAL';
    }
    
    // Apply gap values - CRITICAL: Use actual CSS values
    if (node.layoutMode !== 'NONE') {
      // Primary axis spacing (gap)
      if (properties.gap !== undefined && properties.gap >= 0) {
        node.itemSpacing = properties.gap;
        console.log('[SizingStrategy] Applied gap:', properties.gap);
      } else if (properties.columnGap !== undefined && properties.columnGap >= 0) {
        node.itemSpacing = properties.columnGap;
      } else {
        node.itemSpacing = 0; // No default gap!
      }
      
      // Counter axis spacing for grid/wrapped layouts
      if ('counterAxisSpacing' in node && node.layoutWrap === 'WRAP') {
        if (properties.rowGap !== undefined && properties.rowGap >= 0) {
          node.counterAxisSpacing = properties.rowGap;
        } else if (properties.gap !== undefined && properties.gap >= 0) {
          node.counterAxisSpacing = properties.gap;
        }
      }
      
      // Apply padding - CRITICAL: Use actual CSS values
      if (properties.padding) {
        node.paddingTop = properties.padding.top || 0;
        node.paddingRight = properties.padding.right || 0;
        node.paddingBottom = properties.padding.bottom || 0;
        node.paddingLeft = properties.padding.left || 0;
        
        console.log('[SizingStrategy] Applied padding:', properties.padding);
      }
    }
  }
  
  private static applyFlexAlignment(node: FrameNode, properties: any): void {
    // Map justify-content to Figma primary axis alignment
    if (properties.justifyContent) {
      const justifyMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'space-between': 'SPACE_BETWEEN',
        'space-around': 'SPACE_BETWEEN', // Figma doesn't have space-around
        'space-evenly': 'SPACE_BETWEEN'  // Figma doesn't have space-evenly
      };
      
      if (justifyMap[properties.justifyContent]) {
        node.primaryAxisAlignItems = justifyMap[properties.justifyContent];
      }
    }
    
    // Map align-items to Figma counter axis alignment
    if (properties.alignItems) {
      const alignMap: Record<string, any> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'stretch': 'MIN', // Figma handles stretch differently
        'baseline': 'MIN' // Figma doesn't have baseline
      };
      
      if (alignMap[properties.alignItems]) {
        node.counterAxisAlignItems = alignMap[properties.alignItems];
      }
    }
    
    // Set sizing modes based on flex properties
    if (properties.flexDirection === 'row') {
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'AUTO';
    } else {
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'FIXED';
    }
  }
  
  private static applyGridLayout(node: FrameNode, properties: any): void {
    const gridColumns = properties.gridTemplateColumns;
    
    // Handle auto-fit/auto-fill grids
    if (gridColumns.includes('repeat(auto-fit') || gridColumns.includes('repeat(auto-fill')) {
      // Extract minmax values if present
      const minMaxMatch = gridColumns.match(/minmax\((\d+)px/);
      if (minMaxMatch) {
        const minWidth = parseInt(minMaxMatch[1]);
        console.log('[SizingStrategy] Grid min-width:', minWidth);
        
        // Store as metadata for child sizing
        (node as any).gridMinWidth = minWidth;
      }
      
      // Set to auto-sizing for responsive behavior
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'AUTO';
    } else if (gridColumns === '1fr 1fr' || gridColumns.includes('1fr 1fr')) {
      // Two-column grid
      console.log('[SizingStrategy] Two-column grid detected');
      node.primaryAxisSizingMode = 'FIXED';
      node.counterAxisSizingMode = 'AUTO';
    } else {
      // Default grid behavior
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'AUTO';
    }
  }
  
  static applyChildConstraints(
    childNode: FrameNode | TextNode,
    parentNode: FrameNode,
    properties: any
  ): void {
    if (!('layoutSizingHorizontal' in childNode)) return;
    
    // Grid children with minmax
    if ((parentNode as any).gridMinWidth && !properties.width) {
      childNode.resize((parentNode as any).gridMinWidth, childNode.height);
      childNode.layoutSizingHorizontal = 'FILL';
      childNode.layoutSizingVertical = 'HUG';
      return;
    }
    
    // Flex children
    if (parentNode.layoutMode !== 'NONE') {
      // Default: children fill horizontally and hug vertically
      if (!properties.width) {
        childNode.layoutSizingHorizontal = 'FILL';
      }
      if (!properties.height) {
        childNode.layoutSizingVertical = 'HUG';
      }
    }
  }
}