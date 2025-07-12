/**
 * CSS Flexbox Layout Engine
 * 
 * Implements the CSS Flexible Box Layout Module Level 1 specification.
 * This engine calculates exact positions and sizes for flex containers and items.
 */

import { ComputedStyle, LayoutBox } from '../engine/css-engine';

export interface FlexItem {
  element: Element;
  computedStyles: ComputedStyle;
  
  // Flex properties
  flexGrow: number;
  flexShrink: number;
  flexBasis: number | 'auto';
  order: number;
  alignSelf: string;
  
  // Sizing constraints
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  
  // Content size
  intrinsicWidth: number;
  intrinsicHeight: number;
  
  // Computed dimensions
  mainSize: number;
  crossSize: number;
  
  // Final layout
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlexLine {
  items: FlexItem[];
  mainSize: number;
  crossSize: number;
  mainStart: number;
  crossStart: number;
}

export class FlexboxLayoutEngine {
  
  /**
   * Main entry point: Calculate flexbox layout
   */
  static calculateFlexLayout(
    container: Element,
    containerStyles: ComputedStyle,
    children: Element[],
    childrenStyles: ComputedStyle[]
  ): { containerBox: LayoutBox; itemBoxes: LayoutBox[] } {
    
    // Extract container properties
    const flexDirection = (containerStyles['flex-direction'] as string) || 'row';
    const flexWrap = (containerStyles['flex-wrap'] as string) || 'nowrap';
    const justifyContent = (containerStyles['justify-content'] as string) || 'flex-start';
    const alignItems = (containerStyles['align-items'] as string) || 'stretch';
    const alignContent = (containerStyles['align-content'] as string) || 'stretch';
    
    // Determine main and cross axis
    const isRow = flexDirection === 'row' || flexDirection === 'row-reverse';
    const isReverse = flexDirection.includes('reverse');
    const isWrap = flexWrap === 'wrap' || flexWrap === 'wrap-reverse';
    const isWrapReverse = flexWrap === 'wrap-reverse';
    
    // Container dimensions
    const containerWidth = this.resolveSize(containerStyles.width);
    const containerHeight = this.resolveSize(containerStyles.height);
    
    // Container padding
    const paddingTop = this.resolveSize(containerStyles['padding-top']);
    const paddingRight = this.resolveSize(containerStyles['padding-right']);
    const paddingBottom = this.resolveSize(containerStyles['padding-bottom']);
    const paddingLeft = this.resolveSize(containerStyles['padding-left']);
    
    // Available space for items
    const availableWidth = containerWidth - paddingLeft - paddingRight;
    const availableHeight = containerHeight === 'auto' ? Infinity : containerHeight - paddingTop - paddingBottom;
    
    // Gap between items
    const gap = this.resolveSize(containerStyles['gap']) || 0;
    const rowGap = this.resolveSize(containerStyles['row-gap']) || gap;
    const columnGap = this.resolveSize(containerStyles['column-gap']) || gap;
    
    // Create flex items
    const flexItems = this.createFlexItems(children, childrenStyles);
    
    // Calculate flex layout
    const lines = this.calculateFlexLines(
      flexItems,
      isRow,
      isWrap,
      availableWidth,
      availableHeight,
      isRow ? columnGap : rowGap
    );
    
    // Resolve flexible lengths
    this.resolveFlexibleLengths(lines, isRow, isRow ? availableWidth : availableHeight);
    
    // Calculate cross sizes
    this.calculateCrossSizes(lines, isRow, alignItems);
    
    // Distribute lines (multi-line flexbox)
    const totalCrossSize = isRow ? availableHeight : availableWidth;
    this.distributeLines(lines, alignContent, totalCrossSize, isRow ? rowGap : columnGap, isRow);
    
    // Position items within lines
    this.positionItems(lines, justifyContent, alignItems, isRow, isReverse);
    
    // Calculate final container height if auto
    let finalContainerHeight = containerHeight;
    if (containerHeight === 'auto') {
      const maxY = lines.reduce((max, line) => {
        const lineMax = line.items.reduce((m, item) => Math.max(m, item.y + item.height), 0);
        return Math.max(max, lineMax);
      }, 0);
      finalContainerHeight = maxY + paddingBottom;
    }
    
    // Apply container padding offset to all items
    flexItems.forEach(item => {
      item.x += paddingLeft;
      item.y += paddingTop;
    });
    
    // Create layout boxes
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
      itemBoxes: flexItems.map(item => ({
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
   * Create flex items from elements
   */
  private static createFlexItems(
    elements: Element[],
    styles: ComputedStyle[]
  ): FlexItem[] {
    return elements.map((element, index) => {
      const style = styles[index];
      
      // Calculate intrinsic sizes
      const intrinsicWidth = this.calculateIntrinsicWidth(element, style);
      const intrinsicHeight = this.calculateIntrinsicHeight(element, style);
      
      // Parse flex properties
      const flexGrow = parseFloat(style['flex-grow'] as string) || 0;
      const flexShrink = parseFloat(style['flex-shrink'] as string) || 1;
      const flexBasisValue = style['flex-basis'] as string || 'auto';
      const flexBasis = flexBasisValue === 'auto' ? 'auto' : this.resolveSize(flexBasisValue);
      
      return {
        element,
        computedStyles: style,
        flexGrow,
        flexShrink,
        flexBasis,
        order: parseInt(style['order'] as string) || 0,
        alignSelf: style['align-self'] as string || 'auto',
        minWidth: this.resolveSize(style['min-width']) || 0,
        maxWidth: this.resolveSize(style['max-width']) || Infinity,
        minHeight: this.resolveSize(style['min-height']) || 0,
        maxHeight: this.resolveSize(style['max-height']) || Infinity,
        intrinsicWidth,
        intrinsicHeight,
        mainSize: 0,
        crossSize: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    });
  }
  
  /**
   * Calculate intrinsic width of an element
   */
  private static calculateIntrinsicWidth(element: Element, style: ComputedStyle): number {
    // If width is explicitly set, use it
    if (style.width !== 'auto' && typeof style.width === 'number') {
      return style.width as number;
    }
    
    // Add padding and border to content width
    const paddingLeft = this.resolveSize(style['padding-left']);
    const paddingRight = this.resolveSize(style['padding-right']);
    const borderLeft = this.resolveSize(style['border-left-width']);
    const borderRight = this.resolveSize(style['border-right-width']);
    
    // For text elements, estimate based on font size and content length
    if (element.tagName.match(/^(h1|h2|h3|h4|h5|h6|p|span|div)$/i)) {
      const fontSize = this.resolveSize(style['font-size']);
      const textContent = element.textContent || '';
      // Rough estimate: average character width is ~0.5em
      const contentWidth = textContent.length * fontSize * 0.5;
      return contentWidth + paddingLeft + paddingRight + borderLeft + borderRight;
    }
    
    // Default minimum width
    return 150 + paddingLeft + paddingRight + borderLeft + borderRight;
  }
  
  /**
   * Calculate intrinsic height of an element
   */
  private static calculateIntrinsicHeight(element: Element, style: ComputedStyle): number {
    // If height is explicitly set, use it
    if (style.height !== 'auto' && typeof style.height === 'number') {
      return style.height as number;
    }
    
    // Add padding and border to content height
    const paddingTop = this.resolveSize(style['padding-top']);
    const paddingBottom = this.resolveSize(style['padding-bottom']);
    const borderTop = this.resolveSize(style['border-top-width']);
    const borderBottom = this.resolveSize(style['border-bottom-width']);
    
    // For text elements, use line height
    if (element.tagName.match(/^(h1|h2|h3|h4|h5|h6|p|span)$/i)) {
      const lineHeight = this.resolveSize(style['line-height']) || this.resolveSize(style['font-size']) * 1.5;
      const lines = (element.textContent || '').split('\n').length;
      return lineHeight * lines + paddingTop + paddingBottom + borderTop + borderBottom;
    }
    
    // Default height based on content
    return 50 + paddingTop + paddingBottom + borderTop + borderBottom;
  }
  
  /**
   * Collect items into flex lines
   */
  private static calculateFlexLines(
    items: FlexItem[],
    isRow: boolean,
    isWrap: boolean,
    availableMainSize: number,
    availableCrossSize: number,
    gap: number
  ): FlexLine[] {
    
    if (!isWrap) {
      // Single line
      return [{
        items: [...items],
        mainSize: 0,
        crossSize: 0,
        mainStart: 0,
        crossStart: 0
      }];
    }
    
    // Multi-line: collect items into lines
    const lines: FlexLine[] = [];
    let currentLine: FlexLine = {
      items: [],
      mainSize: 0,
      crossSize: 0,
      mainStart: 0,
      crossStart: 0
    };
    
    items.forEach((item, index) => {
      // Calculate item's hypothetical main size
      const itemMainSize = isRow ? 
        (item.flexBasis === 'auto' ? item.intrinsicWidth : item.flexBasis) :
        (item.flexBasis === 'auto' ? item.intrinsicHeight : item.flexBasis);
      
      const totalGap = currentLine.items.length > 0 ? gap : 0;
      
      // Check if item fits in current line
      if (currentLine.items.length > 0 && 
          currentLine.mainSize + totalGap + itemMainSize > availableMainSize) {
        // Start new line
        lines.push(currentLine);
        currentLine = {
          items: [],
          mainSize: 0,
          crossSize: 0,
          mainStart: 0,
          crossStart: 0
        };
      }
      
      currentLine.items.push(item);
      currentLine.mainSize += itemMainSize + (currentLine.items.length > 1 ? gap : 0);
    });
    
    if (currentLine.items.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * Resolve flexible lengths on the main axis
   */
  private static resolveFlexibleLengths(
    lines: FlexLine[],
    isRow: boolean,
    availableMainSize: number
  ): void {
    
    lines.forEach(line => {
      const items = line.items;
      
      // Calculate initial main sizes
      items.forEach(item => {
        if (isRow) {
          item.mainSize = item.flexBasis === 'auto' ? item.intrinsicWidth : item.flexBasis;
        } else {
          item.mainSize = item.flexBasis === 'auto' ? item.intrinsicHeight : item.flexBasis;
        }
      });
      
      // Calculate free space
      const usedSpace = items.reduce((sum, item) => sum + item.mainSize, 0);
      const freeSpace = availableMainSize - usedSpace;
      
      if (freeSpace > 0) {
        // Grow items
        const totalGrow = items.reduce((sum, item) => sum + item.flexGrow, 0);
        
        if (totalGrow > 0) {
          items.forEach(item => {
            if (item.flexGrow > 0) {
              const growAmount = (item.flexGrow / totalGrow) * freeSpace;
              item.mainSize += growAmount;
              
              // Apply max constraints
              const maxSize = isRow ? item.maxWidth : item.maxHeight;
              if (item.mainSize > maxSize) {
                item.mainSize = maxSize;
              }
            }
          });
        }
      } else if (freeSpace < 0) {
        // Shrink items
        const totalShrink = items.reduce((sum, item) => sum + item.flexShrink * item.mainSize, 0);
        
        if (totalShrink > 0) {
          items.forEach(item => {
            if (item.flexShrink > 0) {
              const shrinkAmount = (item.flexShrink * item.mainSize / totalShrink) * Math.abs(freeSpace);
              item.mainSize -= shrinkAmount;
              
              // Apply min constraints
              const minSize = isRow ? item.minWidth : item.minHeight;
              if (item.mainSize < minSize) {
                item.mainSize = minSize;
              }
            }
          });
        }
      }
      
      // Update line main size
      line.mainSize = items.reduce((sum, item) => sum + item.mainSize, 0);
    });
  }
  
  /**
   * Calculate cross sizes
   */
  private static calculateCrossSizes(
    lines: FlexLine[],
    isRow: boolean,
    alignItems: string
  ): void {
    
    lines.forEach(line => {
      let maxCrossSize = 0;
      
      // First pass: determine line cross size
      line.items.forEach(item => {
        const itemAlignSelf = item.alignSelf === 'auto' ? alignItems : item.alignSelf;
        
        if (isRow) {
          // In row direction, cross size is height
          if (itemAlignSelf === 'stretch' && item.computedStyles.height === 'auto') {
            // Will be stretched later
            item.crossSize = 0;
          } else {
            item.crossSize = item.computedStyles.height === 'auto' ? 
              item.intrinsicHeight : 
              this.resolveSize(item.computedStyles.height);
          }
        } else {
          // In column direction, cross size is width
          if (itemAlignSelf === 'stretch' && item.computedStyles.width === 'auto') {
            // Will be stretched later
            item.crossSize = 0;
          } else {
            item.crossSize = item.computedStyles.width === 'auto' ? 
              item.intrinsicWidth : 
              this.resolveSize(item.computedStyles.width);
          }
        }
        
        maxCrossSize = Math.max(maxCrossSize, item.crossSize);
      });
      
      line.crossSize = maxCrossSize;
      
      // Second pass: apply stretch
      line.items.forEach(item => {
        const itemAlignSelf = item.alignSelf === 'auto' ? alignItems : item.alignSelf;
        
        if (itemAlignSelf === 'stretch') {
          if (isRow && item.computedStyles.height === 'auto') {
            item.crossSize = line.crossSize;
          } else if (!isRow && item.computedStyles.width === 'auto') {
            item.crossSize = line.crossSize;
          }
        }
      });
    });
  }
  
  /**
   * Distribute flex lines (for align-content)
   */
  private static distributeLines(
    lines: FlexLine[],
    alignContent: string,
    availableCrossSize: number,
    gap: number,
    isRow: boolean
  ): void {
    
    if (lines.length === 1) {
      lines[0].crossStart = 0;
      return;
    }
    
    const totalCrossSize = lines.reduce((sum, line) => sum + line.crossSize, 0);
    const totalGap = gap * (lines.length - 1);
    const freeSpace = availableCrossSize - totalCrossSize - totalGap;
    
    let crossPos = 0;
    
    switch (alignContent) {
      case 'flex-start':
      case 'start':
        lines.forEach((line, index) => {
          line.crossStart = crossPos;
          crossPos += line.crossSize + (index < lines.length - 1 ? gap : 0);
        });
        break;
        
      case 'flex-end':
      case 'end':
        crossPos = freeSpace;
        lines.forEach((line, index) => {
          line.crossStart = crossPos;
          crossPos += line.crossSize + (index < lines.length - 1 ? gap : 0);
        });
        break;
        
      case 'center':
        crossPos = freeSpace / 2;
        lines.forEach((line, index) => {
          line.crossStart = crossPos;
          crossPos += line.crossSize + (index < lines.length - 1 ? gap : 0);
        });
        break;
        
      case 'space-between':
        if (lines.length > 1) {
          const spacing = freeSpace / (lines.length - 1);
          lines.forEach((line, index) => {
            line.crossStart = crossPos;
            crossPos += line.crossSize + spacing + gap;
          });
        } else {
          lines[0].crossStart = 0;
        }
        break;
        
      case 'space-around':
        const spacing = freeSpace / lines.length;
        crossPos = spacing / 2;
        lines.forEach((line, index) => {
          line.crossStart = crossPos;
          crossPos += line.crossSize + spacing + (index < lines.length - 1 ? gap : 0);
        });
        break;
        
      case 'space-evenly':
        const evenSpacing = freeSpace / (lines.length + 1);
        crossPos = evenSpacing;
        lines.forEach((line, index) => {
          line.crossStart = crossPos;
          crossPos += line.crossSize + evenSpacing + (index < lines.length - 1 ? gap : 0);
        });
        break;
        
      case 'stretch':
      default:
        if (freeSpace > 0) {
          const stretchAmount = freeSpace / lines.length;
          lines.forEach((line, index) => {
            line.crossStart = crossPos;
            line.crossSize += stretchAmount;
            crossPos += line.crossSize + (index < lines.length - 1 ? gap : 0);
          });
        } else {
          lines.forEach((line, index) => {
            line.crossStart = crossPos;
            crossPos += line.crossSize + (index < lines.length - 1 ? gap : 0);
          });
        }
        break;
    }
  }
  
  /**
   * Position items within their lines
   */
  private static positionItems(
    lines: FlexLine[],
    justifyContent: string,
    alignItems: string,
    isRow: boolean,
    isReverse: boolean
  ): void {
    
    lines.forEach(line => {
      const items = isReverse ? [...line.items].reverse() : line.items;
      const totalMainSize = items.reduce((sum, item) => sum + item.mainSize, 0);
      const freeSpace = line.mainSize - totalMainSize;
      
      let mainPos = 0;
      
      // Distribute items along main axis
      switch (justifyContent) {
        case 'flex-start':
        case 'start':
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize;
          });
          break;
          
        case 'flex-end':
        case 'end':
          mainPos = freeSpace;
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize;
          });
          break;
          
        case 'center':
          mainPos = freeSpace / 2;
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize;
          });
          break;
          
        case 'space-between':
          if (items.length > 1) {
            const spacing = freeSpace / (items.length - 1);
            items.forEach((item, index) => {
              if (isRow) {
                item.x = mainPos;
                item.width = item.mainSize;
              } else {
                item.y = mainPos;
                item.height = item.mainSize;
              }
              mainPos += item.mainSize + (index < items.length - 1 ? spacing : 0);
            });
          } else if (items.length === 1) {
            const item = items[0];
            if (isRow) {
              item.x = 0;
              item.width = item.mainSize;
            } else {
              item.y = 0;
              item.height = item.mainSize;
            }
          }
          break;
          
        case 'space-around':
          const spacing = freeSpace / items.length;
          mainPos = spacing / 2;
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize + spacing;
          });
          break;
          
        case 'space-evenly':
          const evenSpacing = freeSpace / (items.length + 1);
          mainPos = evenSpacing;
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize + evenSpacing;
          });
          break;
          
        default:
          // Default to flex-start
          items.forEach(item => {
            if (isRow) {
              item.x = mainPos;
              item.width = item.mainSize;
            } else {
              item.y = mainPos;
              item.height = item.mainSize;
            }
            mainPos += item.mainSize;
          });
      }
      
      // Align items along cross axis
      items.forEach(item => {
        const itemAlignSelf = item.alignSelf === 'auto' ? alignItems : item.alignSelf;
        
        switch (itemAlignSelf) {
          case 'flex-start':
          case 'start':
            if (isRow) {
              item.y = line.crossStart;
              item.height = item.crossSize;
            } else {
              item.x = line.crossStart;
              item.width = item.crossSize;
            }
            break;
            
          case 'flex-end':
          case 'end':
            if (isRow) {
              item.y = line.crossStart + line.crossSize - item.crossSize;
              item.height = item.crossSize;
            } else {
              item.x = line.crossStart + line.crossSize - item.crossSize;
              item.width = item.crossSize;
            }
            break;
            
          case 'center':
            if (isRow) {
              item.y = line.crossStart + (line.crossSize - item.crossSize) / 2;
              item.height = item.crossSize;
            } else {
              item.x = line.crossStart + (line.crossSize - item.crossSize) / 2;
              item.width = item.crossSize;
            }
            break;
            
          case 'stretch':
          default:
            if (isRow) {
              item.y = line.crossStart;
              item.height = line.crossSize;
            } else {
              item.x = line.crossStart;
              item.width = line.crossSize;
            }
            break;
        }
      });
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