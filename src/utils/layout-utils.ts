// Layout utilities for safe Auto Layout setup and grid conversion

export class LayoutUtils {
  // Safe Auto Layout setup
  static async setupAutoLayout(
    frame: FrameNode,
    styles: any
  ): Promise<void> {
    // ALWAYS check if node is already in scene graph
    if (!frame.parent) {
      throw new Error('Frame must be added to parent before Auto Layout');
    }
    
    const display = styles.display;
    if (display === 'flex' || display === 'inline-flex') {
      // Direction
      const direction = styles.flexDirection || 'row';
      frame.layoutMode = direction.includes('column') ? 'VERTICAL' : 'HORIZONTAL';
      
      // Alignment
      const primaryAlignMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'space-between': 'SPACE_BETWEEN',
        'space-around': 'SPACE_BETWEEN', // Approximate
        'space-evenly': 'SPACE_BETWEEN' // Approximate
      };
      
      const counterAlignMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'> = {
        'flex-start': 'MIN',
        'center': 'CENTER',
        'flex-end': 'MAX',
        'baseline': 'BASELINE',
        'stretch': 'MIN' // Approximate - stretch not available
      };
      
      const justifyContent = styles.justifyContent || 'flex-start';
      const alignItems = styles.alignItems || 'stretch';
      
      frame.primaryAxisAlignItems = primaryAlignMap[justifyContent] || 'MIN';
      frame.counterAxisAlignItems = counterAlignMap[alignItems] || 'MIN';
      
      // Wrap
      if (styles.flexWrap === 'wrap' || styles.flexWrap === 'wrap-reverse') {
        if ('layoutWrap' in frame) {
          (frame as any).layoutWrap = 'WRAP';
        }
      }
      
      // Gap
      const gap = this.parseGap(styles.gap);
      if (gap) {
        frame.itemSpacing = gap.main;
        if (gap.cross && 'counterAxisSpacing' in frame) {
          (frame as any).counterAxisSpacing = gap.cross;
        }
      }
      
      // Padding
      const padding = this.parsePadding(styles);
      if (padding) {
        frame.paddingTop = padding.top;
        frame.paddingRight = padding.right;
        frame.paddingBottom = padding.bottom;
        frame.paddingLeft = padding.left;
      }
      
      // Sizing strategy
      const sizingStrategy = this.determineSizingStrategy(frame, styles);
      frame.primaryAxisSizingMode = sizingStrategy.primary;
      frame.counterAxisSizingMode = sizingStrategy.counter;
      
      console.log('[LayoutUtils] Applied Auto Layout:', {
        direction: frame.layoutMode,
        primaryAlign: frame.primaryAxisAlignItems,
        counterAlign: frame.counterAxisAlignItems,
        primarySizing: frame.primaryAxisSizingMode,
        counterSizing: frame.counterAxisSizingMode
      });
    }
  }
  
  // Convert CSS Grid to Auto Layout
  static convertGridToAutoLayout(frame: FrameNode, styles: any): void {
    if (styles.display === 'grid') {
      console.log('[LayoutUtils] Converting grid to wrapped horizontal Auto Layout');
      
      frame.layoutMode = 'HORIZONTAL';
      
      // Enable wrapping
      if ('layoutWrap' in frame) {
        (frame as any).layoutWrap = 'WRAP';
      }
      
      // Extract gap
      const gap = this.parseGridGap(styles);
      if (gap) {
        frame.itemSpacing = gap.column;
        if ('counterAxisSpacing' in frame) {
          (frame as any).counterAxisSpacing = gap.row;
        }
      }
      
      // Handle grid template columns for child sizing
      const templateColumns = styles.gridTemplateColumns;
      if (templateColumns) {
        // Store for child processing
        frame.setPluginData('gridTemplateColumns', templateColumns);
        
        // Parse minmax if present
        const minmaxMatch = templateColumns.match(/minmax\((\d+)px/);
        if (minmaxMatch) {
          const minWidth = parseInt(minmaxMatch[1]);
          frame.setPluginData('childMinWidth', minWidth.toString());
          console.log('[LayoutUtils] Grid children will have min width:', minWidth);
        }
      }
      
      // Padding
      const padding = this.parsePadding(styles);
      if (padding) {
        frame.paddingTop = padding.top;
        frame.paddingRight = padding.right;
        frame.paddingBottom = padding.bottom;
        frame.paddingLeft = padding.left;
      }
      
      // Sizing
      frame.primaryAxisSizingMode = 'FIXED'; // Grid containers typically have fixed width
      frame.counterAxisSizingMode = 'AUTO'; // Height hugs content
    }
  }
  
  // Handle absolute positioning
  static handleAbsolutePosition(element: any, parent: FrameNode): FrameNode | null {
    if (element.computedStyles?.position === 'absolute') {
      console.log('[LayoutUtils] Creating absolute positioned element');
      
      // Create non-Auto Layout container
      const absContainer = figma.createFrame();
      absContainer.name = element.name + ' (Absolute)';
      parent.appendChild(absContainer);
      
      // Remove Auto Layout
      absContainer.layoutMode = 'NONE';
      
      // Apply position values
      const styles = element.computedStyles;
      const parentWidth = parent.width;
      const parentHeight = parent.height;
      
      // Position
      if (styles.top !== 'auto') {
        absContainer.y = parseFloat(styles.top);
      } else if (styles.bottom !== 'auto') {
        absContainer.y = parentHeight - parseFloat(styles.bottom) - absContainer.height;
      }
      
      if (styles.left !== 'auto') {
        absContainer.x = parseFloat(styles.left);
      } else if (styles.right !== 'auto') {
        absContainer.x = parentWidth - parseFloat(styles.right) - absContainer.width;
      }
      
      // Size
      if (styles.width && styles.width !== 'auto') {
        absContainer.resize(parseFloat(styles.width), absContainer.height);
      }
      if (styles.height && styles.height !== 'auto') {
        absContainer.resize(absContainer.width, parseFloat(styles.height));
      }
      
      // Constraints for responsive behavior
      absContainer.constraints = {
        horizontal: styles.left !== 'auto' && styles.right !== 'auto' ? 'STRETCH' : 
                   styles.right !== 'auto' ? 'MAX' : 'MIN',
        vertical: styles.top !== 'auto' && styles.bottom !== 'auto' ? 'STRETCH' :
                 styles.bottom !== 'auto' ? 'MAX' : 'MIN'
      };
      
      return absContainer;
    }
    return null;
  }
  
  // Determine sizing strategy
  private static determineSizingStrategy(frame: FrameNode, styles: any): {
    primary: 'FIXED' | 'AUTO',
    counter: 'FIXED' | 'AUTO'
  } {
    const isRoot = frame.parent?.type === 'PAGE';
    const hasWidth = styles.width && !styles.width.includes('%');
    const hasHeight = styles.height && !styles.height.includes('%');
    const hasMaxWidth = styles.maxWidth && styles.maxWidth !== 'none';
    const hasMaxHeight = styles.maxHeight && styles.maxHeight !== 'none';
    
    // Primary axis (direction of layout)
    let primary: 'FIXED' | 'AUTO' = 'AUTO'; // Default to HUG
    if (hasWidth && frame.layoutMode === 'HORIZONTAL') {
      primary = 'FIXED';
    } else if (hasHeight && frame.layoutMode === 'VERTICAL') {
      primary = 'FIXED';
    }
    
    // Counter axis (perpendicular to layout)
    let counter: 'FIXED' | 'AUTO' = 'AUTO'; // Default to HUG
    if (hasHeight && frame.layoutMode === 'HORIZONTAL') {
      counter = 'FIXED';
    } else if (hasWidth && frame.layoutMode === 'VERTICAL') {
      counter = 'FIXED';
    } else if (isRoot || hasMaxWidth) {
      counter = 'FIXED'; // Root elements and max-width elements are fixed
    }
    
    return { primary, counter };
  }
  
  // Parse gap values
  private static parseGap(gap: string | undefined): { main: number, cross?: number } | null {
    if (!gap) return null;
    
    const parts = gap.split(/\s+/).map(v => parseFloat(v));
    if (parts.length === 1) {
      return { main: parts[0], cross: parts[0] };
    } else if (parts.length === 2) {
      return { main: parts[1], cross: parts[0] };
    }
    return null;
  }
  
  // Parse grid gap
  private static parseGridGap(styles: any): { row: number, column: number } | null {
    const gap = styles.gap || styles.gridGap;
    if (!gap) return null;
    
    const parts = gap.split(/\s+/).map((v: string) => parseFloat(v));
    if (parts.length === 1) {
      return { row: parts[0], column: parts[0] };
    } else if (parts.length === 2) {
      return { row: parts[0], column: parts[1] };
    }
    return null;
  }
  
  // Parse padding
  private static parsePadding(styles: any): {
    top: number,
    right: number,
    bottom: number,
    left: number
  } | null {
    const padding = styles.padding;
    if (!padding) return null;
    
    const parts = padding.split(/\s+/).map((v: string) => parseFloat(v) || 0);
    
    if (parts.length === 1) {
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    } else if (parts.length === 2) {
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    } else if (parts.length === 3) {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    } else if (parts.length === 4) {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    }
    
    return null;
  }
  
  // Apply child sizing in Auto Layout
  static applyChildSizing(child: SceneNode, parent: FrameNode, styles: any): void {
    if (parent.layoutMode === 'NONE') return;
    
    // Check for flex properties
    const flexGrow = parseFloat(styles.flexGrow || styles.flex || '0');
    const flexShrink = parseFloat(styles.flexShrink || '1');
    const flexBasis = styles.flexBasis || 'auto';
    
    // Apply flex grow
    if (flexGrow > 0 && 'layoutGrow' in child) {
      (child as any).layoutGrow = flexGrow;
      console.log('[LayoutUtils] Applied flex-grow:', flexGrow, 'to', child.name);
    }
    
    // Handle width/height in Auto Layout context
    if ('layoutSizingHorizontal' in child) {
      if (styles.width === '100%' || flexGrow > 0) {
        (child as any).layoutSizingHorizontal = 'FILL';
      } else if (styles.width && !styles.width.includes('%')) {
        (child as any).layoutSizingHorizontal = 'FIXED';
        child.resize(parseFloat(styles.width), child.height);
      } else {
        (child as any).layoutSizingHorizontal = 'HUG';
      }
    }
    
    if ('layoutSizingVertical' in child) {
      if (styles.height === '100%') {
        (child as any).layoutSizingVertical = 'FILL';
      } else if (styles.height && !styles.height.includes('%')) {
        (child as any).layoutSizingVertical = 'FIXED';
        child.resize(child.width, parseFloat(styles.height));
      } else {
        (child as any).layoutSizingVertical = 'HUG';
      }
    }
    
    // Handle grid children
    const gridTemplateColumns = parent.getPluginData('gridTemplateColumns');
    if (gridTemplateColumns) {
      const minWidth = parent.getPluginData('childMinWidth');
      if (minWidth && 'minWidth' in child) {
        (child as any).minWidth = parseFloat(minWidth);
      }
    }
  }
}