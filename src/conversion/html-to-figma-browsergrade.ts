/**
 * Browser-Grade HTML to Figma Converter
 * 
 * This is the main converter that uses the browser-grade CSS engine
 * for pixel-perfect HTML/CSS to Figma conversion.
 */

import { BrowserGradeCSSEngine, ComputedStyle, LayoutBox } from '../engine/css-engine';
import { CascadeResolver } from '../engine/cascade-resolver';
import { FlexboxLayoutEngine } from '../layout/flexbox-engine';
import { GridLayoutEngine } from '../layout/grid-engine';
import { AccurateFigmaMapper, FigmaNodeConfig } from '../figma/layout-mapper';
import { DOMParser, DOMElement } from '../parsers/dom-parser';

export interface ConversionOptions {
  viewport?: { width: number; height: number };
  rootFontSize?: number;
}

export interface FigmaNodeData {
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
  children?: FigmaNodeData[];
}

interface ProcessedElement {
  element: DOMElement;
  computedStyle: ComputedStyle;
  layoutBox: LayoutBox;
  children: ProcessedElement[];
}

export class HTMLToFigmaConverter {
  private cssEngine: BrowserGradeCSSEngine;
  private options: ConversionOptions;
  
  constructor(options: ConversionOptions = {}) {
    console.log('🚀 Initializing Browser-Grade HTML to Figma Converter');
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
  async convert(html: string, css: string): Promise<FigmaNodeData[]> {
    console.log('🔄 Starting browser-grade conversion...');
    console.log('📝 HTML length:', html.length);
    console.log('🎨 CSS length:', css.length);
    
    try {
      // Parse HTML into DOM structure
      console.log('📄 Parsing HTML with DOM parser...');
      const rootElements = DOMParser.parse(html);
      console.log(`✅ Parsed ${rootElements.length} root elements`);
      
      // Parse CSS into rules with proper cascade
      console.log('🎨 Parsing CSS with cascade resolver...');
      const cssRules = CascadeResolver.parseCSSToRules(css);
      console.log(`✅ Parsed ${cssRules.length} CSS rules`);
      
      // Expand shorthand properties
      cssRules.forEach(rule => {
        rule.declarations = CascadeResolver.expandShorthands(rule.declarations);
      });
      
      // Process all elements
      console.log('💻 Computing styles for all elements...');
      const processedRoots = rootElements.map(element => 
        this.processElement(element, cssRules, undefined)
      );
      
      console.log(`✅ Processed ${processedRoots.length} root elements`);
      
      // Convert to Figma nodes
      const figmaNodes = processedRoots.map(processed => this.createFigmaNode(processed));
      
      console.log(`🎉 Created ${figmaNodes.length} Figma nodes`);
      return figmaNodes;
      
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw error;
    }
  }
  
  /**
   * Process an element and all its children
   */
  private processElement(
    element: DOMElement,
    cssRules: any[],
    parentComputedStyle?: ComputedStyle
  ): ProcessedElement {
    
    console.log(`🎯 Processing element: ${element.tagName}`);
    
    // Compute styles for this element
    const computedStyle = this.cssEngine.computeStyles(
      element,
      cssRules,
      parentComputedStyle,
      this.options.viewport
    );
    
    console.log('✅ Computed styles:', {
      tag: element.tagName,
      background: computedStyle['background-color'],
      display: computedStyle.display,
      width: computedStyle.width,
      height: computedStyle.height
    });
    
    // Process children first to get their layout info
    const processedChildren = element.children.map(child => 
      this.processElement(child, cssRules, computedStyle)
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
    element: DOMElement,
    computedStyle: ComputedStyle,
    children: ProcessedElement[]
  ): LayoutBox {
    
    const display = computedStyle.display as string;
    console.log(`📐 Calculating ${display} layout for ${element.tagName}`);
    
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
      
      console.log('✅ Flexbox layout calculated');
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
        
        console.log('✅ Grid auto-fit layout calculated');
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
        
        console.log('✅ Grid layout calculated');
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
    element: DOMElement,
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
    element: DOMElement,
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
  private createFigmaNode(processed: ProcessedElement): FigmaNodeData {
    const { element, computedStyle, layoutBox, children } = processed;
    
    console.log(`🏗️ Creating Figma node for ${element.tagName}`);
    
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
    const figmaNode: FigmaNodeData = {
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
    
    console.log('✅ Figma node created:', {
      type: nodeType,
      name: figmaNode.name,
      width: figmaNode.width,
      height: figmaNode.height
    });
    
    return figmaNode;
  }
  
  /**
   * Generate a meaningful name for the Figma node
   */
  private generateNodeName(element: DOMElement): string {
    // Use id if available
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Use first class name
    if (element.classList.length > 0) {
      return `.${element.classList[0]}`;
    }
    
    // Use tag name
    return element.tagName;
  }
  
  /**
   * Check if element is a text element
   */
  private isTextElement(element: DOMElement): boolean {
    const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th'];
    return textTags.includes(element.tagName);
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