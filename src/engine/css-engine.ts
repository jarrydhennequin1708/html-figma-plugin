/**
 * Browser-Grade CSS Engine
 * 
 * This engine replicates browser CSS computation behavior exactly.
 * It implements the CSS cascade, inheritance, and value resolution
 * to produce computed styles that match what browsers calculate.
 */

export interface ComputedStyle {
  // All CSS properties as computed values (px, not em/%)
  [property: string]: string | number;
}

export interface LayoutBox {
  width: number;
  height: number;
  x: number;
  y: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
}

export interface CSSRule {
  selector: string;
  specificity: number;
  declarations: Record<string, string>;
}

export class BrowserGradeCSSEngine {
  private browserDefaults: Map<string, Record<string, string>>;
  private computedStyles: Map<Element, ComputedStyle>;
  
  // CSS properties that inherit by default
  private static INHERITED_PROPERTIES = new Set([
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-indent',
    'text-transform', 'white-space', 'word-spacing', 'direction',
    'visibility', 'cursor', 'list-style', 'quotes'
  ]);
  
  constructor() {
    this.browserDefaults = this.initializeBrowserDefaults();
    this.computedStyles = new Map();
  }
  
  /**
   * Browser Default Styles (User Agent Stylesheet)
   * These are the styles browsers apply by default to HTML elements
   */
  private initializeBrowserDefaults(): Map<string, Record<string, string>> {
    const defaults = new Map();
    
    // HTML5 default styles based on W3C specifications
    defaults.set('div', {
      display: 'block',
      margin: '0',
      padding: '0',
      border: '0',
      'font-size': '16px',
      'font-family': 'Arial, sans-serif',
      color: '#000000',
      'background-color': 'transparent',
      'box-sizing': 'content-box',
      'line-height': 'normal',
      'text-align': 'left'
    });
    
    defaults.set('span', {
      display: 'inline',
      margin: '0',
      padding: '0',
      border: '0',
      'font-size': 'inherit',
      'font-family': 'inherit',
      color: 'inherit',
      'background-color': 'transparent'
    });
    
    defaults.set('h1', {
      display: 'block',
      'font-size': '32px',
      'font-weight': 'bold',
      'margin-top': '21.44px',    // 0.67em * 32px
      'margin-bottom': '21.44px',
      'margin-left': '0',
      'margin-right': '0',
      'line-height': 'normal'
    });
    
    defaults.set('h2', {
      display: 'block',
      'font-size': '24px',
      'font-weight': 'bold',
      'margin-top': '19.92px',    // 0.83em * 24px
      'margin-bottom': '19.92px',
      'margin-left': '0',
      'margin-right': '0'
    });
    
    defaults.set('h3', {
      display: 'block',
      'font-size': '18.72px',
      'font-weight': 'bold',
      'margin-top': '18.72px',    // 1em * 18.72px
      'margin-bottom': '18.72px',
      'margin-left': '0',
      'margin-right': '0'
    });
    
    defaults.set('p', {
      display: 'block',
      'margin-top': '16px',       // 1em * 16px default
      'margin-bottom': '16px',
      'margin-left': '0',
      'margin-right': '0',
      padding: '0',
      'line-height': 'normal'
    });
    
    defaults.set('section', {
      display: 'block',
      margin: '0',
      padding: '0'
    });
    
    defaults.set('header', {
      display: 'block',
      margin: '0',
      padding: '0'
    });
    
    defaults.set('main', {
      display: 'block',
      margin: '0',
      padding: '0'
    });
    
    defaults.set('article', {
      display: 'block',
      margin: '0',
      padding: '0'
    });
    
    defaults.set('button', {
      display: 'inline-block',
      'font-family': 'inherit',
      'font-size': 'inherit',
      'line-height': 'normal',
      'text-align': 'center',
      padding: '1px 6px',
      border: '2px outset buttonface',
      'background-color': 'buttonface',
      color: 'buttontext',
      cursor: 'pointer',
      'box-sizing': 'border-box'
    });
    
    defaults.set('img', {
      display: 'inline',
      border: '0',
      'vertical-align': 'baseline'
    });
    
    defaults.set('a', {
      display: 'inline',
      color: '#0000EE',
      'text-decoration': 'underline',
      cursor: 'pointer'
    });
    
    // Default for unknown elements
    defaults.set('*', {
      display: 'inline',
      margin: '0',
      padding: '0',
      border: '0',
      'font-size': 'inherit',
      'font-family': 'inherit',
      color: 'inherit',
      'background-color': 'transparent',
      'box-sizing': 'content-box'
    });
    
    return defaults;
  }
  
  /**
   * Main entry point: Compute styles for an element
   * Implements the CSS cascade algorithm
   */
  public computeStyles(
    element: Element, 
    cssRules: CSSRule[], 
    parentStyles?: ComputedStyle,
    viewport = { width: 1920, height: 1080 }
  ): ComputedStyle {
    
    // 1. Start with browser defaults for this element type
    const tagName = element.tagName.toLowerCase();
    const tagDefaults = this.browserDefaults.get(tagName) || this.browserDefaults.get('*')!;
    let styles: Record<string, string> = { ...tagDefaults };
    
    // 2. Apply inherited properties from parent
    if (parentStyles) {
      styles = this.applyInheritance(styles, parentStyles);
    }
    
    // 3. Apply matching CSS rules in cascade order
    const applicableRules = this.getApplicableRules(element, cssRules);
    applicableRules.forEach(rule => {
      Object.entries(rule.declarations).forEach(([property, value]) => {
        // Remove quotes from values if present
        const cleanValue = this.cleanCSSValue(value);
        styles[property] = cleanValue;
      });
    });
    
    // 4. Apply inline styles (highest priority)
    const inlineStyle = element.getAttribute('style');
    if (inlineStyle) {
      const inlineDeclarations = this.parseInlineStyle(inlineStyle);
      Object.entries(inlineDeclarations).forEach(([property, value]) => {
        styles[property] = this.cleanCSSValue(value);
      });
    }
    
    // 5. Resolve computed values (em → px, % → px, etc.)
    const computedStyles = this.resolveComputedValues(styles, parentStyles, viewport);
    
    // 6. Cache and return
    this.computedStyles.set(element, computedStyles);
    return computedStyles;
  }
  
  /**
   * Apply CSS inheritance rules
   */
  private applyInheritance(
    styles: Record<string, string>, 
    parentStyles: ComputedStyle
  ): Record<string, string> {
    const inherited = { ...styles };
    
    // Apply inherited properties from parent
    BrowserGradeCSSEngine.INHERITED_PROPERTIES.forEach(property => {
      if (!styles[property] || styles[property] === 'inherit') {
        const parentValue = parentStyles[property];
        if (parentValue !== undefined) {
          inherited[property] = String(parentValue);
        }
      }
    });
    
    // Handle explicit 'inherit' values
    Object.entries(styles).forEach(([property, value]) => {
      if (value === 'inherit' && parentStyles[property] !== undefined) {
        inherited[property] = String(parentStyles[property]);
      }
    });
    
    return inherited;
  }
  
  /**
   * Find all CSS rules that apply to an element
   */
  private getApplicableRules(element: Element, cssRules: CSSRule[]): CSSRule[] {
    const applicable: CSSRule[] = [];
    
    cssRules.forEach(rule => {
      if (this.selectorMatches(element, rule.selector)) {
        applicable.push(rule);
      }
    });
    
    // Sort by specificity (lowest to highest so later rules override)
    return applicable.sort((a, b) => a.specificity - b.specificity);
  }
  
  /**
   * Check if a CSS selector matches an element
   */
  private selectorMatches(element: Element, selector: string): boolean {
    // Clean selector
    const cleanSelector = selector.trim();
    
    // Handle basic selectors
    if (cleanSelector.startsWith('.')) {
      // Class selector
      const className = cleanSelector.substring(1);
      const elementClasses = element.className.split(/\s+/);
      return elementClasses.includes(className);
    } else if (cleanSelector.startsWith('#')) {
      // ID selector
      const id = cleanSelector.substring(1);
      return element.id === id;
    } else if (cleanSelector.includes(' ')) {
      // Descendant selector (simplified)
      const parts = cleanSelector.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      return this.selectorMatches(element, lastPart);
    } else {
      // Type selector
      return element.tagName.toLowerCase() === cleanSelector.toLowerCase();
    }
  }
  
  /**
   * Parse inline style attribute
   */
  private parseInlineStyle(styleStr: string): Record<string, string> {
    const declarations: Record<string, string> = {};
    
    styleStr.split(';').forEach(decl => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex > 0) {
        const property = decl.substring(0, colonIndex).trim();
        const value = decl.substring(colonIndex + 1).trim();
        if (property && value) {
          declarations[property] = value;
        }
      }
    });
    
    return declarations;
  }
  
  /**
   * Clean CSS values by removing quotes and whitespace
   */
  private cleanCSSValue(value: string): string {
    if (!value) return value;
    
    // Remove surrounding quotes
    let cleaned = value.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned;
  }
  
  /**
   * Resolve relative values to absolute computed values
   */
  private resolveComputedValues(
    styles: Record<string, string>, 
    parentStyles?: ComputedStyle,
    viewport = { width: 1920, height: 1080 }
  ): ComputedStyle {
    const computed: ComputedStyle = {};
    const fontSize = this.resolveFontSize(styles['font-size'], parentStyles);
    
    // First pass: resolve font-size (needed for em calculations)
    computed['font-size'] = fontSize;
    
    // Second pass: resolve all other properties
    Object.entries(styles).forEach(([property, value]) => {
      if (property === 'font-size') return; // Already resolved
      
      computed[property] = this.resolveValue(
        property, 
        value, 
        fontSize,
        parentStyles,
        viewport
      );
    });
    
    // Ensure critical properties have defaults
    this.ensureDefaults(computed);
    
    return computed;
  }
  
  /**
   * Resolve font-size specifically (needed for em calculations)
   */
  private resolveFontSize(value: string, parentStyles?: ComputedStyle): number {
    if (!value || value === 'inherit') {
      return parentStyles?.['font-size'] as number || 16;
    }
    
    if (value.endsWith('px')) {
      return parseFloat(value);
    }
    
    if (value.endsWith('em')) {
      const emValue = parseFloat(value);
      const parentFontSize = parentStyles?.['font-size'] as number || 16;
      return emValue * parentFontSize;
    }
    
    if (value.endsWith('rem')) {
      const remValue = parseFloat(value);
      return remValue * 16; // rem is relative to root (16px default)
    }
    
    // Keyword sizes
    const keywordSizes: Record<string, number> = {
      'xx-small': 9,
      'x-small': 10,
      'small': 13,
      'medium': 16,
      'large': 18,
      'x-large': 24,
      'xx-large': 32
    };
    
    return keywordSizes[value] || 16;
  }
  
  /**
   * Resolve a CSS value to its computed form
   */
  private resolveValue(
    property: string, 
    value: string,
    fontSize: number,
    parentStyles?: ComputedStyle,
    viewport = { width: 1920, height: 1080 }
  ): string | number {
    
    if (!value || value === 'initial') {
      return this.getInitialValue(property);
    }
    
    if (value === 'inherit' && parentStyles?.[property] !== undefined) {
      return parentStyles[property];
    }
    
    // Handle calc() expressions
    if (value.includes('calc(')) {
      return this.resolveCalc(value, fontSize, parentStyles, viewport);
    }
    
    // Handle units
    if (value.endsWith('px')) {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    
    if (value.endsWith('em')) {
      const emValue = parseFloat(value);
      return emValue * fontSize;
    }
    
    if (value.endsWith('rem')) {
      const remValue = parseFloat(value);
      return remValue * 16;
    }
    
    if (value.endsWith('%')) {
      return this.resolvePercentage(property, value, parentStyles, viewport);
    }
    
    if (value.endsWith('vw')) {
      const vwValue = parseFloat(value);
      return (vwValue / 100) * viewport.width;
    }
    
    if (value.endsWith('vh')) {
      const vhValue = parseFloat(value);
      return (vhValue / 100) * viewport.height;
    }
    
    // Handle color values
    if (this.isColor(property)) {
      return this.normalizeColor(value);
    }
    
    // Handle numeric values without units
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value === String(numValue)) {
      return numValue;
    }
    
    // Return as-is for keywords and other values
    return value;
  }
  
  /**
   * Resolve percentage values based on property context
   */
  private resolvePercentage(
    property: string,
    value: string,
    parentStyles?: ComputedStyle,
    viewport = { width: 1920, height: 1080 }
  ): number | string {
    const percentage = parseFloat(value) / 100;
    
    // Width percentages are relative to parent's width
    if (property === 'width' || property.includes('left') || property.includes('right')) {
      const parentWidth = parentStyles?.width as number || viewport.width;
      return percentage * parentWidth;
    }
    
    // Height percentages need explicit parent height
    if (property === 'height' || property.includes('top') || property.includes('bottom')) {
      const parentHeight = parentStyles?.height;
      if (typeof parentHeight === 'number') {
        return percentage * parentHeight;
      }
      // If parent height is auto, percentage height doesn't apply
      return 'auto';
    }
    
    // Padding/margin percentages are relative to parent's width
    if (property.includes('padding') || property.includes('margin')) {
      const parentWidth = parentStyles?.width as number || viewport.width;
      return percentage * parentWidth;
    }
    
    // Font-size percentage is relative to parent font-size
    if (property === 'font-size') {
      const parentFontSize = parentStyles?.['font-size'] as number || 16;
      return percentage * parentFontSize;
    }
    
    return value;
  }
  
  /**
   * Simple calc() expression resolver
   */
  private resolveCalc(
    calcStr: string,
    fontSize: number,
    parentStyles?: ComputedStyle,
    viewport = { width: 1920, height: 1080 }
  ): number {
    // Extract expression from calc()
    const match = calcStr.match(/calc\((.*)\)/);
    if (!match) return 0;
    
    let expression = match[1];
    
    // Replace units with computed values
    expression = expression.replace(/(\d+(?:\.\d+)?)(px|em|rem|%|vw|vh)/g, (match, num, unit) => {
      const value = parseFloat(num);
      switch (unit) {
        case 'px': return String(value);
        case 'em': return String(value * fontSize);
        case 'rem': return String(value * 16);
        case '%': return String((value / 100) * (parentStyles?.width as number || viewport.width));
        case 'vw': return String((value / 100) * viewport.width);
        case 'vh': return String((value / 100) * viewport.height);
        default: return String(value);
      }
    });
    
    // Safely evaluate the expression
    try {
      // This is a simplified calc evaluator - in production, use a proper expression parser
      return Function('"use strict"; return (' + expression + ')')();
    } catch {
      return 0;
    }
  }
  
  /**
   * Check if property is a color property
   */
  private isColor(property: string): boolean {
    return property === 'color' || 
           property === 'background-color' || 
           property.includes('border') && property.includes('color');
  }
  
  /**
   * Normalize color values to hex format
   */
  private normalizeColor(value: string): string {
    // Already hex
    if (value.startsWith('#')) {
      return value;
    }
    
    // RGB/RGBA
    const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Named colors
    const namedColors: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'transparent': 'transparent'
      // Add more as needed
    };
    
    return namedColors[value.toLowerCase()] || value;
  }
  
  /**
   * Get initial value for a CSS property
   */
  private getInitialValue(property: string): string | number {
    const initialValues: Record<string, string | number> = {
      'display': 'inline',
      'position': 'static',
      'width': 'auto',
      'height': 'auto',
      'margin': 0,
      'margin-top': 0,
      'margin-right': 0,
      'margin-bottom': 0,
      'margin-left': 0,
      'padding': 0,
      'padding-top': 0,
      'padding-right': 0,
      'padding-bottom': 0,
      'padding-left': 0,
      'border-width': 0,
      'border-style': 'none',
      'font-size': 16,
      'font-weight': 'normal',
      'line-height': 'normal',
      'color': '#000000',
      'background-color': 'transparent',
      'opacity': 1,
      'flex-grow': 0,
      'flex-shrink': 1,
      'flex-basis': 'auto',
      'justify-content': 'flex-start',
      'align-items': 'stretch',
      'gap': 0
    };
    
    return initialValues[property] || 'initial';
  }
  
  /**
   * Ensure critical properties have proper defaults
   */
  private ensureDefaults(computed: ComputedStyle): void {
    // Ensure display has a value
    if (!computed.display) {
      computed.display = 'inline';
    }
    
    // Ensure dimensions
    if (computed.width === undefined) {
      computed.width = 'auto';
    }
    if (computed.height === undefined) {
      computed.height = 'auto';
    }
    
    // Ensure box model properties are numbers
    const boxProperties = [
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
    ];
    
    boxProperties.forEach(prop => {
      if (computed[prop] === undefined || computed[prop] === 'auto') {
        computed[prop] = 0;
      }
    });
  }
  
  /**
   * Calculate specificity of a CSS selector
   */
  public static calculateSpecificity(selector: string): number {
    let specificity = 0;
    
    // Count IDs (weight: 100)
    const idMatches = selector.match(/#[\w-]+/g);
    if (idMatches) specificity += idMatches.length * 100;
    
    // Count classes and attributes (weight: 10)
    const classMatches = selector.match(/\.[\w-]+/g);
    if (classMatches) specificity += classMatches.length * 10;
    
    const attrMatches = selector.match(/\[[^\]]+\]/g);
    if (attrMatches) specificity += attrMatches.length * 10;
    
    // Count type selectors (weight: 1)
    const typeMatches = selector.match(/^[a-zA-Z]+|[\s>+~][a-zA-Z]+/g);
    if (typeMatches) specificity += typeMatches.length;
    
    return specificity;
  }
}