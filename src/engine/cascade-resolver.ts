/**
 * CSS Cascade Resolver
 * 
 * Implements the CSS cascade algorithm according to CSS specifications.
 * Handles specificity, inheritance, and the order of rule application.
 */

import { CSSRule } from './css-engine';

export interface ParsedSelector {
  selector: string;
  specificity: number;
  pseudoClass?: string;
  pseudoElement?: string;
}

export class CascadeResolver {
  
  /**
   * Parse CSS text into rules with computed specificity
   */
  static parseCSSToRules(cssText: string): CSSRule[] {
    const rules: CSSRule[] = [];
    
    // Remove comments
    const cleanCSS = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split into rule blocks
    const ruleMatches = cleanCSS.match(/[^{}]+\{[^{}]+\}/g);
    if (!ruleMatches) return rules;
    
    ruleMatches.forEach(ruleText => {
      const selectorMatch = ruleText.match(/^([^{]+)\{/);
      const declarationsMatch = ruleText.match(/\{([^}]+)\}/);
      
      if (selectorMatch && declarationsMatch) {
        const selectorsText = selectorMatch[1].trim();
        const declarationsText = declarationsMatch[1].trim();
        
        // Handle multiple selectors (comma-separated)
        const selectors = selectorsText.split(',').map(s => s.trim());
        
        selectors.forEach(selector => {
          const declarations = this.parseDeclarations(declarationsText);
          const specificity = this.calculateSpecificity(selector);
          
          rules.push({
            selector,
            specificity,
            declarations
          });
        });
      }
    });
    
    return rules;
  }
  
  /**
   * Parse CSS declarations block
   */
  private static parseDeclarations(declarationsText: string): Record<string, string> {
    const declarations: Record<string, string> = {};
    
    // Split by semicolon but handle values that might contain semicolons
    const parts = declarationsText.split(';').filter(p => p.trim());
    
    parts.forEach(part => {
      const colonIndex = part.indexOf(':');
      if (colonIndex > 0) {
        const property = part.substring(0, colonIndex).trim();
        let value = part.substring(colonIndex + 1).trim();
        
        // Clean value - remove quotes if they wrap the entire value
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Handle !important
        const importantMatch = value.match(/^(.*?)\s*!important\s*$/);
        if (importantMatch) {
          value = importantMatch[1].trim();
          // In a full implementation, we'd track importance
        }
        
        if (property && value) {
          declarations[property] = value;
        }
      }
    });
    
    return declarations;
  }
  
  /**
   * Calculate CSS selector specificity
   * Returns a single number for easy comparison
   */
  private static calculateSpecificity(selector: string): number {
    let a = 0; // Inline styles (not handled here)
    let b = 0; // IDs
    let c = 0; // Classes, attributes, pseudo-classes
    let d = 0; // Elements and pseudo-elements
    
    // Remove pseudo-elements for counting
    const selectorWithoutPseudo = selector.replace(/::?[\w-]+/g, match => {
      if (match.startsWith('::')) {
        d++; // Pseudo-elements
        return '';
      } else if (match.startsWith(':')) {
        c++; // Pseudo-classes
        return '';
      }
      return match;
    });
    
    // Count IDs
    const idMatches = selectorWithoutPseudo.match(/#[\w-]+/g);
    if (idMatches) b += idMatches.length;
    
    // Count classes
    const classMatches = selectorWithoutPseudo.match(/\.[\w-]+/g);
    if (classMatches) c += classMatches.length;
    
    // Count attribute selectors
    const attrMatches = selectorWithoutPseudo.match(/\[[^\]]+\]/g);
    if (attrMatches) c += attrMatches.length;
    
    // Count type selectors
    const cleanedSelector = selectorWithoutPseudo
      .replace(/#[\w-]+/g, '') // Remove IDs
      .replace(/\.[\w-]+/g, '') // Remove classes
      .replace(/\[[^\]]+\]/g, '') // Remove attributes
      .trim();
    
    if (cleanedSelector) {
      // Count element selectors
      const elementMatches = cleanedSelector.match(/\b[a-zA-Z]+\b/g);
      if (elementMatches) d += elementMatches.length;
    }
    
    // Combine into single number (each component weighted by 1000)
    return b * 1000000 + c * 1000 + d;
  }
  
  /**
   * Apply cascade rules to determine winning declaration
   */
  static cascadeDeclarations(
    declarations: Array<{
      value: string;
      specificity: number;
      order: number;
      important?: boolean;
    }>
  ): string {
    // Sort by cascade rules
    declarations.sort((a, b) => {
      // 1. Importance
      if (a.important && !b.important) return 1;
      if (!a.important && b.important) return -1;
      
      // 2. Specificity
      if (a.specificity !== b.specificity) {
        return a.specificity - b.specificity;
      }
      
      // 3. Source order
      return a.order - b.order;
    });
    
    // Return the last (winning) declaration
    return declarations[declarations.length - 1]?.value || '';
  }
  
  /**
   * Expand shorthand properties to longhand
   */
  static expandShorthands(declarations: Record<string, string>): Record<string, string> {
    const expanded = { ...declarations };
    
    // Margin shorthand
    if (expanded.margin) {
      const values = expanded.margin.split(/\s+/).filter(v => v);
      delete expanded.margin;
      
      if (values.length === 1) {
        expanded['margin-top'] = values[0];
        expanded['margin-right'] = values[0];
        expanded['margin-bottom'] = values[0];
        expanded['margin-left'] = values[0];
      } else if (values.length === 2) {
        expanded['margin-top'] = values[0];
        expanded['margin-right'] = values[1];
        expanded['margin-bottom'] = values[0];
        expanded['margin-left'] = values[1];
      } else if (values.length === 3) {
        expanded['margin-top'] = values[0];
        expanded['margin-right'] = values[1];
        expanded['margin-bottom'] = values[2];
        expanded['margin-left'] = values[1];
      } else if (values.length === 4) {
        expanded['margin-top'] = values[0];
        expanded['margin-right'] = values[1];
        expanded['margin-bottom'] = values[2];
        expanded['margin-left'] = values[3];
      }
    }
    
    // Padding shorthand
    if (expanded.padding) {
      const values = expanded.padding.split(/\s+/).filter(v => v);
      delete expanded.padding;
      
      if (values.length === 1) {
        expanded['padding-top'] = values[0];
        expanded['padding-right'] = values[0];
        expanded['padding-bottom'] = values[0];
        expanded['padding-left'] = values[0];
      } else if (values.length === 2) {
        expanded['padding-top'] = values[0];
        expanded['padding-right'] = values[1];
        expanded['padding-bottom'] = values[0];
        expanded['padding-left'] = values[1];
      } else if (values.length === 3) {
        expanded['padding-top'] = values[0];
        expanded['padding-right'] = values[1];
        expanded['padding-bottom'] = values[2];
        expanded['padding-left'] = values[1];
      } else if (values.length === 4) {
        expanded['padding-top'] = values[0];
        expanded['padding-right'] = values[1];
        expanded['padding-bottom'] = values[2];
        expanded['padding-left'] = values[3];
      }
    }
    
    // Border shorthand
    if (expanded.border) {
      const borderValue = expanded.border;
      delete expanded.border;
      
      // Parse border shorthand (width style color)
      const parts = borderValue.split(/\s+/);
      let width = '1px';
      let style = 'solid';
      let color = '#000000';
      
      parts.forEach(part => {
        if (part.match(/^\d+(\.\d+)?(px|em|rem|%)/)) {
          width = part;
        } else if (['none', 'solid', 'dashed', 'dotted', 'double'].includes(part)) {
          style = part;
        } else {
          color = part;
        }
      });
      
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        expanded[`border-${side}-width`] = width;
        expanded[`border-${side}-style`] = style;
        expanded[`border-${side}-color`] = color;
      });
    }
    
    // Flex shorthand
    if (expanded.flex) {
      const flexValue = expanded.flex;
      delete expanded.flex;
      
      const parts = flexValue.split(/\s+/);
      
      if (parts.length === 1) {
        const value = parts[0];
        if (value === 'none') {
          expanded['flex-grow'] = '0';
          expanded['flex-shrink'] = '0';
          expanded['flex-basis'] = 'auto';
        } else if (value === 'auto') {
          expanded['flex-grow'] = '1';
          expanded['flex-shrink'] = '1';
          expanded['flex-basis'] = 'auto';
        } else if (!isNaN(Number(value))) {
          expanded['flex-grow'] = value;
          expanded['flex-shrink'] = '1';
          expanded['flex-basis'] = '0%';
        } else {
          expanded['flex-grow'] = '1';
          expanded['flex-shrink'] = '1';
          expanded['flex-basis'] = value;
        }
      } else if (parts.length === 2) {
        expanded['flex-grow'] = parts[0];
        if (!isNaN(Number(parts[1]))) {
          expanded['flex-shrink'] = parts[1];
          expanded['flex-basis'] = '0%';
        } else {
          expanded['flex-shrink'] = '1';
          expanded['flex-basis'] = parts[1];
        }
      } else if (parts.length === 3) {
        expanded['flex-grow'] = parts[0];
        expanded['flex-shrink'] = parts[1];
        expanded['flex-basis'] = parts[2];
      }
    }
    
    // Gap shorthand (for grid/flex)
    if (expanded.gap) {
      const values = expanded.gap.split(/\s+/).filter(v => v);
      if (values.length === 1) {
        expanded['row-gap'] = values[0];
        expanded['column-gap'] = values[0];
      } else if (values.length === 2) {
        expanded['row-gap'] = values[0];
        expanded['column-gap'] = values[1];
      }
    }
    
    return expanded;
  }
}