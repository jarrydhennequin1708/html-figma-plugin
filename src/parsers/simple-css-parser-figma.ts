// src/parsers/simple-css-parser-figma.ts
// FIGMA-COMPATIBLE CSS PARSER (No external dependencies)

export interface CSSRule {
  selector: string;
  declarations: Record<string, string>;
  specificity: number;
}

export class SimpleFigmaCSSParser {
  private rules: CSSRule[] = [];
  
  constructor(css: string) {
    console.log('🎨 Parsing CSS with SimpleFigmaCSSParser');
    this.parse(css);
    console.log(`✅ Parsed ${this.rules.length} CSS rules`);
  }
  
  get parsedRules(): CSSRule[] {
    return this.rules;
  }
  
  /**
   * Parse CSS text into rules
   */
  private parse(css: string): void {
    // Remove comments
    const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split into rule blocks
    const ruleBlocks = this.extractRuleBlocks(cleanCss);
    
    ruleBlocks.forEach(block => {
      const rule = this.parseRuleBlock(block);
      if (rule) {
        this.rules.push(rule);
      }
    });
  }
  
  /**
   * Extract individual CSS rule blocks
   */
  private extractRuleBlocks(css: string): string[] {
    const blocks: string[] = [];
    let currentBlock = '';
    let braceDepth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      const prevChar = css[i - 1];
      
      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (!inString) {
        if (char === '{') {
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
          
          if (braceDepth === 0) {
            currentBlock += char;
            blocks.push(currentBlock.trim());
            currentBlock = '';
            continue;
          }
        }
      }
      
      currentBlock += char;
    }
    
    return blocks.filter(block => block.length > 0);
  }
  
  /**
   * Parse a single CSS rule block
   */
  private parseRuleBlock(block: string): CSSRule | null {
    const braceIndex = block.indexOf('{');
    if (braceIndex === -1) return null;
    
    const selectorPart = block.substring(0, braceIndex).trim();
    const declarationPart = block.substring(braceIndex + 1, block.lastIndexOf('}')).trim();
    
    // Handle multiple selectors (comma-separated) - take first for simplicity
    const selector = selectorPart.split(',')[0].trim();
    
    if (!selector) return null;
    
    const declarations = this.parseDeclarations(declarationPart);
    
    return {
      selector,
      declarations,
      specificity: this.calculateSpecificity(selector)
    };
  }
  
  /**
   * Parse CSS declarations within a rule
   */
  private parseDeclarations(declarationText: string): Record<string, string> {
    const declarations: Record<string, string> = {};
    
    // Split on semicolons
    const declarationStrings = declarationText.split(';');
    
    declarationStrings.forEach(decl => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex === -1) return;
      
      const property = decl.substring(0, colonIndex).trim();
      const value = decl.substring(colonIndex + 1).trim();
      
      if (property && value) {
        // Remove !important flag
        const cleanValue = value.replace(/\s*!important\s*$/, '');
        declarations[property] = cleanValue;
      }
    });
    
    return declarations;
  }
  
  /**
   * Calculate CSS specificity
   */
  private calculateSpecificity(selector: string): number {
    let specificity = 0;
    
    // Count IDs (#id)
    const idMatches = selector.match(/#[a-zA-Z][\w-]*/g);
    if (idMatches) {
      specificity += idMatches.length * 100;
    }
    
    // Count classes (.class)
    const classMatches = selector.match(/\.[a-zA-Z][\w-]*/g);
    if (classMatches) {
      specificity += classMatches.length * 10;
    }
    
    // Count elements (div, p, etc.)
    let cleanSelector = selector;
    if (idMatches) {
      idMatches.forEach(id => {
        cleanSelector = cleanSelector.replace(id, '');
      });
    }
    if (classMatches) {
      classMatches.forEach(cls => {
        cleanSelector = cleanSelector.replace(cls, '');
      });
    }
    
    const elementMatches = cleanSelector.match(/\b[a-zA-Z][\w-]*\b/g);
    if (elementMatches) {
      const actualElements = elementMatches.filter(match => 
        /^[a-zA-Z][\w-]*$/.test(match)
      );
      specificity += actualElements.length * 1;
    }
    
    return specificity;
  }
}