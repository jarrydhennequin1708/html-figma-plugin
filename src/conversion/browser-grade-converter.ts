/**
 * Browser-Grade HTML to Figma Converter
 * 
 * This is the new conversion pipeline that uses the browser-grade CSS engine
 * to achieve pixel-perfect conversion from HTML/CSS to Figma.
 */

import { BrowserGradeCSSEngine, ComputedStyle, LayoutBox } from '../engine/css-engine';
import { CascadeResolver } from '../engine/cascade-resolver';
import { FlexboxLayoutEngine } from '../layout/flexbox-engine';
import { GridLayoutEngine } from '../layout/grid-engine';
import { AccurateFigmaMapper, FigmaNodeConfig } from '../figma/layout-mapper';

export interface ConversionOptions {
  viewport?: { width: number; height: number };
  rootFontSize?: number;
}

export interface FigmaNode {
  type: 'FRAME' | 'TEXT' | 'RECTANGLE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  layoutAlign?: 'STRETCH' | 'INHERIT';
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius?: number;
  opacity?: number;
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  lineHeight?: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
  letterSpacing?: { value: number; unit: 'PIXELS' | 'PERCENT' };
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  children?: FigmaNode[];
}

interface ProcessedElement {
  element: Element;
  computedStyle: ComputedStyle;
  layoutBox: LayoutBox;
  figmaNode?: FigmaNode;
  children: ProcessedElement[];
}

export class BrowserGradeConverter {
  private cssEngine: BrowserGradeCSSEngine;
  private options: ConversionOptions;
  
  constructor(options: ConversionOptions = {}) {
    this.options = {
      viewport: { width: 1920, height: 1080 },
      rootFontSize: 16,
      ...options
    };
    this.cssEngine = new BrowserGradeCSSEngine();
  }
  
  /**
   * Convert HTML and CSS to Figma nodes
   */
  async convert(html: string, css: string): Promise<FigmaNode[]> {
    // Parse HTML into DOM tree
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const body = document.body;
    
    // Parse CSS into rules
    const cssRules = CascadeResolver.parseCSSToRules(css);
    
    // Process all elements
    const rootElements = Array.from(body.children);
    const processedRoots = rootElements.map(element => 
      this.processElement(element as Element, cssRules, undefined)
    );
    
    // Convert to Figma nodes
    return processedRoots.map(processed => this.createFigmaNode(processed));
  }
  
  /**
   * Process an element and all its children
   */
  private processElement(
    element: Element,
    cssRules: any[],
    parentComputedStyle?: ComputedStyle
  ): ProcessedElement {
    
    // Compute styles for this element
    const computedStyle = this.cssEngine.computeStyles(
      element,
      cssRules,
      parentComputedStyle,
      this.options.viewport
    );
    
    // Process children first to get their layout info
    const children = Array.from(element.children);
    const processedChildren = children.map(child => 
      this.processElement(child as Element, cssRules, computedStyle)
    );
    
    // Calculate layout based on display type
    const layoutBox = this.calculateLayout(
      element,
      computedStyle,
      processedChildren
    );
    
    return {
      element,
      computedStyle,
      layoutBox,
      children: processedChildren
    };
  }
  
  /**
   * Calculate layout for an element
   */
  private calculateLayout(
    element: Element,
    computedStyle: ComputedStyle,
    children: ProcessedElement[]
  ): LayoutBox {
    
    const display = computedStyle.display as string;
    
    // Flexbox layout
    if (display === 'flex' && children.length > 0) {
      const childElements = children.map(c => c.element);
      const childStyles = children.map(c => c.computedStyle);
      
      const result = FlexboxLayoutEngine.calculateFlexLayout(
        element,
        computedStyle,
        childElements,
        childStyles
      );
      
      // Update child layout boxes
      children.forEach((child, index) => {
        child.layoutBox = result.itemBoxes[index];
      });
      
      return result.containerBox;
    }
    
    // Grid layout
    if (display === 'grid' && children.length > 0) {
      const gridTemplateColumns = computedStyle['grid-template-columns'] as string;
      
      // Check for auto-fit pattern
      if (gridTemplateColumns && gridTemplateColumns.includes('auto-fit')) {
        const result = GridLayoutEngine.calculateAutoFitGrid(
          element,
          computedStyle,
          children.map(c => c.element)
        );
        
        // Update child layout boxes
        children.forEach((child, index) => {
          child.layoutBox = result.itemBoxes[index];
        });
        
        return result.containerBox;
      } else {
        // Regular grid
        const childElements = children.map(c => c.element);
        const childStyles = children.map(c => c.computedStyle);
        
        const result = GridLayoutEngine.calculateGridLayout(
          element,
          computedStyle,
          childElements,
          childStyles
        );
        
        children.forEach((child, index) => {
          child.layoutBox = result.itemBoxes[index];
        });
        
        return result.containerBox;
      }
    }
    
    // Block or inline layout (simplified)
    return this.calculateBlockLayout(element, computedStyle, children);
  }
  
  /**
   * Simple block layout calculation
   */
  private calculateBlockLayout(
    element: Element,
    computedStyle: ComputedStyle,
    children: ProcessedElement[]
  ): LayoutBox {
    
    // Get dimensions
    const width = this.resolveSize(computedStyle.width) || 
                  (computedStyle.display === 'block' ? this.options.viewport!.width : 200);
    const height = this.resolveSize(computedStyle.height) || 
                   this.calculateContentHeight(element, computedStyle, children);
    
    // Get box model properties
    const marginTop = this.resolveSize(computedStyle['margin-top']);
    const marginRight = this.resolveSize(computedStyle['margin-right']);
    const marginBottom = this.resolveSize(computedStyle['margin-bottom']);
    const marginLeft = this.resolveSize(computedStyle['margin-left']);
    
    const paddingTop = this.resolveSize(computedStyle['padding-top']);
    const paddingRight = this.resolveSize(computedStyle['padding-right']);
    const paddingBottom = this.resolveSize(computedStyle['padding-bottom']);
    const paddingLeft = this.resolveSize(computedStyle['padding-left']);
    
    const borderTopWidth = this.resolveSize(computedStyle['border-top-width']);
    const borderRightWidth = this.resolveSize(computedStyle['border-right-width']);
    const borderBottomWidth = this.resolveSize(computedStyle['border-bottom-width']);
    const borderLeftWidth = this.resolveSize(computedStyle['border-left-width']);
    
    // Position children vertically
    let currentY = paddingTop;
    children.forEach(child => {
      child.layoutBox.x = paddingLeft;
      child.layoutBox.y = currentY;
      currentY += child.layoutBox.height + this.resolveSize(child.computedStyle['margin-bottom']);
    });
    
    return {
      width,
      height,
      x: 0,
      y: 0,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderTopWidth,
      borderRightWidth,
      borderBottomWidth,
      borderLeftWidth
    };
  }
  
  /**
   * Calculate content height based on children
   */
  private calculateContentHeight(
    element: Element,
    computedStyle: ComputedStyle,
    children: ProcessedElement[]
  ): number {
    
    if (children.length === 0) {
      // Text element height
      if (element.textContent) {
        const fontSize = this.resolveSize(computedStyle['font-size']) || 16;
        const lineHeight = this.resolveSize(computedStyle['line-height']) || fontSize * 1.5;
        const lines = element.textContent.split('\n').length;
        return lineHeight * lines;
      }
      return 50; // Default height
    }
    
    // Container height based on children
    const childrenHeight = children.reduce((total, child) => {
      return total + child.layoutBox.height + this.resolveSize(child.computedStyle['margin-bottom']);
    }, 0);
    
    const paddingTop = this.resolveSize(computedStyle['padding-top']);
    const paddingBottom = this.resolveSize(computedStyle['padding-bottom']);
    
    return childrenHeight + paddingTop + paddingBottom;
  }
  
  /**
   * Create Figma node from processed element
   */
  private createFigmaNode(processed: ProcessedElement): FigmaNode {
    const { element, computedStyle, layoutBox, children } = processed;
    
    // Map layout to Figma configuration
    const childBoxes = children.map(c => c.layoutBox);
    const childElements = children.map(c => c.element);
    
    const figmaConfig = AccurateFigmaMapper.mapLayoutToFigma(
      element,
      computedStyle,
      layoutBox,
      childBoxes,
      childElements
    );
    
    // Determine node type
    const isText = this.isTextElement(element);
    const nodeType = isText ? 'TEXT' : 'FRAME';
    
    // Create base node
    const figmaNode: FigmaNode = {
      type: nodeType,
      name: this.generateNodeName(element),
      x: Math.round(layoutBox.x),
      y: Math.round(layoutBox.y),
      width: figmaConfig.width,
      height: figmaConfig.height
    };
    
    // Apply all mapped properties
    Object.assign(figmaNode, figmaConfig);
    
    // Add font name for text nodes
    if (isText && figmaConfig.fontFamily) {
      const fontWeight = figmaConfig.fontWeight || 400;
      figmaNode.fontName = {
        family: figmaConfig.fontFamily,
        style: this.getFontStyle(fontWeight)
      };
    }
    
    // Process children
    if (!isText && children.length > 0) {
      figmaNode.children = children.map(child => this.createFigmaNode(child));
    }
    
    return figmaNode;
  }
  
  /**
   * Generate a meaningful name for the Figma node
   */
  private generateNodeName(element: Element): string {
    // Use id if available
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Use first class name
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    // Use tag name
    return element.tagName.toLowerCase();
  }
  
  /**
   * Check if element is a text element
   */
  private isTextElement(element: Element): boolean {
    const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th'];
    return textTags.includes(element.tagName.toLowerCase());
  }
  
  /**
   * Map font weight to font style
   */
  private getFontStyle(weight: number): string {
    if (weight <= 300) return 'Light';
    if (weight <= 400) return 'Regular';
    if (weight <= 500) return 'Medium';
    if (weight <= 600) return 'SemiBold';
    if (weight <= 700) return 'Bold';
    if (weight <= 800) return 'ExtraBold';
    return 'Black';
  }
  
  /**
   * Resolve size value to number
   */
  private resolveSize(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (!value || value === 'auto' || value === 'initial') return 0;
    return 0;
  }
}