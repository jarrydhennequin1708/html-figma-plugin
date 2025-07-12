// src/engine/css-engine-figma.ts
// JSDOM-FREE version for Figma plugin environment

export interface ComputedStyle {
  [property: string]: string | number;
}

export interface CSSRule {
  selector: string;
  declarations: Record<string, string>;
  specificity: number;
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

/**
 * FIGMA-COMPATIBLE CSS ENGINE
 * No external dependencies, pure TypeScript
 */
export class FigmaCompatibleCSSEngine {
  private browserDefaults: Map<string, Record<string, string>>;
  private computedStyles: Map<any, ComputedStyle>;
  
  constructor() {
    this.browserDefaults = this.initializeBrowserDefaults();
    this.computedStyles = new Map();
    console.log('🚀 FigmaCompatibleCSSEngine initialized');
  }
  
  /**
   * Browser Default Styles (User Agent Stylesheet)
   */
  private initializeBrowserDefaults(): Map<string, Record<string, string>> {
    const defaults = new Map();
    
    defaults.set('div', {
      display: 'block',
      margin: '0',
      padding: '0',
      border: '0',
      'font-size': '16px',
      'font-family': 'Inter, Arial, sans-serif',
      color: '#000000',
      'background-color': 'transparent',
      'box-sizing': 'content-box'
    });
    
    defaults.set('span', {
      display: 'inline',
      margin: '0',
      padding: '0'
    });
    
    defaults.set('h1', {
      display: 'block',
      'font-size': '32px',
      'font-weight': 'bold',
      'margin-top': '21px',
      'margin-bottom': '21px',
      'margin-left': '0',
      'margin-right': '0'
    });
    
    defaults.set('h2', {
      display: 'block',
      'font-size': '24px',
      'font-weight': 'bold',
      'margin-top': '20px',
      'margin-bottom': '20px'
    });
    
    defaults.set('h3', {
      display: 'block',
      'font-size': '18px',
      'font-weight': 'bold',
      'margin-top': '16px',
      'margin-bottom': '16px'
    });
    
    defaults.set('p', {
      display: 'block',
      'margin-top': '16px',
      'margin-bottom': '16px',
      'margin-left': '0',
      'margin-right': '0'
    });
    
    return defaults;
  }
  
  /**
   * MAIN CSS COMPUTATION METHOD
   */
  public computeStyles(
    element: any, 
    cssRules: CSSRule[], 
    parentStyles?: ComputedStyle
  ): ComputedStyle {
    
    console.log('🎨 Computing styles for:', element.tagName || 'text');
    
    // 1. Start with browser defaults
    const tagName = element.tagName?.toLowerCase() || 'div';
    const tagDefaults = this.browserDefaults.get(tagName) || this.browserDefaults.get('div')!;
    let styles = { ...tagDefaults };
    
    // 2. Apply inherited properties from parent
    if (parentStyles) {
      styles = this.applyInheritance(styles, parentStyles);
    }
    
    // 3. Apply CSS rules in specificity order
    const applicableRules = this.getApplicableRules(element, cssRules);
    applicableRules.sort((a, b) => a.specificity - b.specificity);
    
    applicableRules.forEach(rule => {
      Object.assign(styles, rule.declarations);
    });
    
    // 4. Apply inline styles (highest priority)
    if (element.style) {
      Object.assign(styles, element.style);
    }
    
    // 5. Expand shorthand properties
    styles = this.expandShorthands(styles);
    
    // 6. Resolve computed values (em → px, % → px, etc.)
    const computedStyles = this.resolveComputedValues(styles, parentStyles);
    
    console.log('✅ Computed styles:', {
      backgroundColor: computedStyles['background-color'],
      borderWidth: computedStyles['border-top-width'],
      display: computedStyles['display']
    });
    
    this.computedStyles.set(element, computedStyles);
    return computedStyles;
  }
  
  /**
   * CSS Inheritance
   */
  private applyInheritance(
    styles: Record<string, string>, 
    parentStyles: ComputedStyle
  ): Record<string, string> {
    
    const inheritedProperties = [
      'color', 'font-family', 'font-size', 'font-weight', 'font-style',
      'line-height', 'text-align', 'text-decoration', 'letter-spacing',
      'word-spacing', 'text-transform', 'text-indent', 'visibility'
    ];
    
    const result = { ...styles };
    
    inheritedProperties.forEach(prop => {
      if (!result[prop] && parentStyles[prop]) {
        result[prop] = parentStyles[prop].toString();
      }
    });
    
    return result;
  }
  
  /**
   * CSS Selector Matching
   */
  private getApplicableRules(element: any, cssRules: CSSRule[]): CSSRule[] {
    const applicable: CSSRule[] = [];
    
    cssRules.forEach(rule => {
      if (this.selectorMatches(rule.selector, element)) {
        applicable.push(rule);
      }
    });
    
    return applicable;
  }
  
  private selectorMatches(selector: string, element: any): boolean {
    const trimmedSelector = selector.trim();
    
    // Class selector (.class-name)
    if (trimmedSelector.startsWith('.')) {
      const className = trimmedSelector.substring(1);
      return element.classList?.includes(className) || 
             element.className?.split(' ').includes(className);
    }
    
    // ID selector (#id)
    if (trimmedSelector.startsWith('#')) {
      const id = trimmedSelector.substring(1);
      return element.id === id;
    }
    
    // Tag selector (div, p, h1, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedSelector)) {
      return element.tagName?.toLowerCase() === trimmedSelector.toLowerCase();
    }
    
    // Universal selector (*)
    if (trimmedSelector === '*') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Shorthand Property Expansion
   */
  private expandShorthands(styles: Record<string, string>): Record<string, string> {
    const expanded = { ...styles };
    
    // Expand margin shorthand
    if (expanded.margin) {
      const values = this.parseSpaceValues(expanded.margin);
      expanded['margin-top'] = values[0];
      expanded['margin-right'] = values[1];
      expanded['margin-bottom'] = values[2];
      expanded['margin-left'] = values[3];
      delete expanded.margin;
    }
    
    // Expand padding shorthand
    if (expanded.padding) {
      const values = this.parseSpaceValues(expanded.padding);
      expanded['padding-top'] = values[0];
      expanded['padding-right'] = values[1];
      expanded['padding-bottom'] = values[2];
      expanded['padding-left'] = values[3];
      delete expanded.padding;
    }
    
    // Expand border shorthand
    if (expanded.border) {
      const borderParts = this.parseBorder(expanded.border);
      expanded['border-top-width'] = borderParts.width;
      expanded['border-right-width'] = borderParts.width;
      expanded['border-bottom-width'] = borderParts.width;
      expanded['border-left-width'] = borderParts.width;
      expanded['border-top-style'] = borderParts.style;
      expanded['border-right-style'] = borderParts.style;
      expanded['border-bottom-style'] = borderParts.style;
      expanded['border-left-style'] = borderParts.style;
      expanded['border-top-color'] = borderParts.color;
      expanded['border-right-color'] = borderParts.color;
      expanded['border-bottom-color'] = borderParts.color;
      expanded['border-left-color'] = borderParts.color;
      delete expanded.border;
    }
    
    return expanded;
  }
  
  private parseSpaceValues(value: string): [string, string, string, string] {
    const values = value.trim().split(/\s+/);
    
    switch (values.length) {
      case 1:
        return [values[0], values[0], values[0], values[0]];
      case 2:
        return [values[0], values[1], values[0], values[1]];
      case 3:
        return [values[0], values[1], values[2], values[1]];
      case 4:
        return [values[0], values[1], values[2], values[3]];
      default:
        return ['0', '0', '0', '0'];
    }
  }
  
  private parseBorder(value: string): { width: string; style: string; color: string } {
    const parts = value.trim().split(/\s+/);
    
    return {
      width: parts.find(p => p.includes('px') || p.includes('em')) || '1px',
      style: parts.find(p => ['solid', 'dashed', 'dotted', 'none'].includes(p)) || 'solid',
      color: parts.find(p => p.includes('#') || p.includes('rgb') || p.includes('hsl')) || '#000000'
    };
  }
  
  /**
   * Value Resolution (em → px, % → px, etc.)
   */
  private resolveComputedValues(
    styles: Record<string, string>, 
    parentStyles?: ComputedStyle
  ): ComputedStyle {
    const computed: ComputedStyle = {};
    
    Object.entries(styles).forEach(([property, value]) => {
      computed[property] = this.resolveValue(property, value, styles, parentStyles);
    });
    
    return computed;
  }
  
  private resolveValue(
    property: string, 
    value: string, 
    currentStyles: Record<string, string>,
    parentStyles?: ComputedStyle
  ): string | number {
    
    if (!value || value === 'inherit') {
      return parentStyles?.[property] || value;
    }
    
    // Handle em units
    if (value.endsWith('em')) {
      const emValue = parseFloat(value);
      const fontSize = this.resolveFontSize(currentStyles, parentStyles);
      return emValue * fontSize;
    }
    
    // Handle pixel values
    if (value.endsWith('px')) {
      return parseFloat(value);
    }
    
    // Handle percentage for width/height
    if (value.endsWith('%')) {
      const percentage = parseFloat(value) / 100;
      
      if (['width', 'max-width', 'min-width'].includes(property) && parentStyles?.width) {
        const parentWidth = typeof parentStyles.width === 'number' 
          ? parentStyles.width 
          : parseFloat(parentStyles.width.toString());
        return percentage * parentWidth;
      }
    }
    
    return value;
  }
  
  private resolveFontSize(
    currentStyles: Record<string, string>,
    parentStyles?: ComputedStyle
  ): number {
    const fontSize = currentStyles['font-size'];
    
    if (!fontSize) {
      return parentStyles?.['font-size'] as number || 16;
    }
    
    if (fontSize.endsWith('px')) {
      return parseFloat(fontSize);
    }
    
    return 16; // Default
  }
}