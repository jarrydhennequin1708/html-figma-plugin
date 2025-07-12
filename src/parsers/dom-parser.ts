/**
 * Lightweight DOM Parser for Figma Plugin
 * 
 * This parser creates a DOM-like structure without requiring JSDOM,
 * which has Node.js dependencies that don't work in Figma plugins.
 */

export interface DOMElement {
  tagName: string;
  id: string;
  className: string;
  classList: string[];
  attributes: Record<string, string>;
  style: Record<string, string>;
  children: DOMElement[];
  textContent: string;
  parentElement?: DOMElement;
}

export class DOMParser {
  /**
   * Parse HTML string into DOM-like structure
   */
  static parse(html: string): DOMElement[] {
    // Remove comments and scripts
    const cleanHtml = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Create a wrapper to ensure we can parse fragments
    const wrappedHtml = `<root>${cleanHtml}</root>`;
    
    // Parse using browser's DOMParser if available (Figma has it)
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(wrappedHtml, 'text/html');
      const root = doc.body.querySelector('root');
      
      if (root) {
        return Array.from(root.children).map(el => this.convertElement(el as Element));
      }
    }
    
    // Fallback regex parser
    return this.regexParse(cleanHtml);
  }
  
  /**
   * Convert browser Element to our DOMElement interface
   */
  private static convertElement(element: Element, parent?: DOMElement): DOMElement {
    const domElement: DOMElement = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      classList: element.className ? element.className.split(/\s+/).filter(c => c) : [],
      attributes: {},
      style: {},
      children: [],
      textContent: ''
    };
    
    // Set parent reference
    if (parent) {
      domElement.parentElement = parent;
    }
    
    // Extract attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      domElement.attributes[attr.name] = attr.value;
    }
    
    // Parse inline styles
    const styleAttr = element.getAttribute('style');
    if (styleAttr) {
      domElement.style = this.parseInlineStyle(styleAttr);
    }
    
    // Process children
    let textContent = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === 1) { // Element node
        const childElement = this.convertElement(child as Element, domElement);
        domElement.children.push(childElement);
      } else if (child.nodeType === 3) { // Text node
        textContent += child.textContent || '';
      }
    }
    
    domElement.textContent = textContent.trim();
    
    return domElement;
  }
  
  /**
   * Fallback regex-based parser
   */
  private static regexParse(html: string): DOMElement[] {
    const elements: DOMElement[] = [];
    const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>|<(\w+)([^>]*)\/>/g;
    
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1] || match[4];
      const attributes = match[2] || match[5];
      const content = match[3] || '';
      
      if (tagName) {
        const element = this.createElementFromMatch(
          tagName.toLowerCase(),
          attributes,
          content
        );
        elements.push(element);
      }
    }
    
    return elements;
  }
  
  /**
   * Create element from regex match
   */
  private static createElementFromMatch(
    tagName: string,
    attributesStr: string,
    content: string
  ): DOMElement {
    const element: DOMElement = {
      tagName,
      id: '',
      className: '',
      classList: [],
      attributes: {},
      style: {},
      children: [],
      textContent: ''
    };
    
    // Parse attributes
    const attrRegex = /(\w+)(?:="([^"]*)"|='([^']*)'|=(\S+))?/g;
    let attrMatch;
    
    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      const name = attrMatch[1];
      const value = attrMatch[2] || attrMatch[3] || attrMatch[4] || 'true';
      
      element.attributes[name] = value;
      
      if (name === 'id') {
        element.id = value;
      } else if (name === 'class') {
        element.className = value;
        element.classList = value.split(/\s+/).filter(c => c);
      } else if (name === 'style') {
        element.style = this.parseInlineStyle(value);
      }
    }
    
    // Parse children or set text content
    if (content.includes('<')) {
      element.children = this.regexParse(content);
    } else {
      element.textContent = content.trim();
    }
    
    return element;
  }
  
  /**
   * Parse inline style string
   */
  private static parseInlineStyle(styleStr: string): Record<string, string> {
    const styles: Record<string, string> = {};
    
    styleStr.split(';').forEach(rule => {
      const colonIndex = rule.indexOf(':');
      if (colonIndex > 0) {
        const property = rule.substring(0, colonIndex).trim();
        const value = rule.substring(colonIndex + 1).trim();
        if (property && value) {
          styles[property] = value;
        }
      }
    });
    
    return styles;
  }
  
  /**
   * Get element by class name (helper)
   */
  static getElementsByClassName(elements: DOMElement[], className: string): DOMElement[] {
    const results: DOMElement[] = [];
    
    function search(els: DOMElement[]) {
      els.forEach(el => {
        if (el.classList.includes(className)) {
          results.push(el);
        }
        if (el.children.length > 0) {
          search(el.children);
        }
      });
    }
    
    search(elements);
    return results;
  }
  
  /**
   * Get element by ID (helper)
   */
  static getElementById(elements: DOMElement[], id: string): DOMElement | null {
    for (const el of elements) {
      if (el.id === id) {
        return el;
      }
      if (el.children.length > 0) {
        const found = this.getElementById(el.children, id);
        if (found) return found;
      }
    }
    return null;
  }
}