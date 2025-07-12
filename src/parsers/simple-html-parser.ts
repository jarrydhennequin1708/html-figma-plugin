// Simple HTML parser for Figma plugin (no external dependencies)

export interface ParsedElement {
  type: 'element' | 'text';
  tagName?: string;
  className?: string;
  id?: string;
  attributes?: Record<string, string>;
  style?: Record<string, string>;
  children: ParsedElement[];
  textContent?: string;
  content?: string; // For text nodes
  classList?: string[]; // For CSS matching
}

export class SimpleHTMLParser {
  private html: string;
  
  constructor(html: string) {
    this.html = html.trim();
  }
  
  parse(): ParsedElement[] {
    console.log('📄 Parsing HTML with SimpleHTMLParser');
    return this.parseHTML(this.html);
  }
  
  private parseHTML(html: string): ParsedElement[] {
    const elements: ParsedElement[] = [];
    let currentPos = 0;
    
    while (currentPos < html.length) {
      // Skip whitespace
      while (currentPos < html.length && /\s/.test(html[currentPos])) {
        currentPos++;
      }
      
      if (currentPos >= html.length) break;
      
      // Check for tag
      if (html[currentPos] === '<') {
        const tagResult = this.parseTag(html, currentPos);
        if (tagResult) {
          elements.push(tagResult.element);
          currentPos = tagResult.endPos;
        } else {
          currentPos++;
        }
      } else {
        // Parse text content
        const textResult = this.parseText(html, currentPos);
        if (textResult && textResult.text.trim()) {
          elements.push({
            type: 'text',
            content: textResult.text.trim(),
            textContent: textResult.text.trim(),
            children: []
          });
        }
        currentPos = textResult ? textResult.endPos : currentPos + 1;
      }
    }
    
    return elements;
  }
  
  private parseTag(html: string, startPos: number): { element: ParsedElement; endPos: number } | null {
    if (html[startPos] !== '<') return null;
    
    // Skip comments
    if (html.substring(startPos, startPos + 4) === '<!--') {
      const endComment = html.indexOf('-->', startPos);
      return {
        element: { type: 'text', content: '', children: [] },
        endPos: endComment !== -1 ? endComment + 3 : html.length
      };
    }
    
    // Find tag name
    let pos = startPos + 1;
    while (pos < html.length && !/[\s>\/]/.test(html[pos])) {
      pos++;
    }
    
    const tagName = html.substring(startPos + 1, pos).toLowerCase();
    if (!tagName) return null;
    
    // Self-closing tags
    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    const isSelfClosing = selfClosing.includes(tagName);
    
    // Parse attributes
    const attributes: Record<string, string> = {};
    let className = '';
    let id = '';
    let style: Record<string, string> = {};
    
    while (pos < html.length && html[pos] !== '>') {
      // Skip whitespace
      while (pos < html.length && /\s/.test(html[pos])) {
        pos++;
      }
      
      if (html[pos] === '/' || html[pos] === '>') {
        break;
      }
      
      // Parse attribute
      const attrResult = this.parseAttribute(html, pos);
      if (attrResult) {
        attributes[attrResult.name] = attrResult.value;
        
        // Special handling for common attributes
        if (attrResult.name === 'class') {
          className = attrResult.value;
        } else if (attrResult.name === 'id') {
          id = attrResult.value;
        } else if (attrResult.name === 'style') {
          style = this.parseInlineStyle(attrResult.value);
        }
        
        pos = attrResult.endPos;
      } else {
        pos++;
      }
    }
    
    // Skip closing >
    while (pos < html.length && html[pos] !== '>') {
      pos++;
    }
    pos++; // Skip >
    
    const element: ParsedElement = {
      type: 'element',
      tagName,
      className,
      classList: className ? className.split(' ').filter(c => c) : [],
      id,
      attributes,
      style,
      children: []
    };
    
    // Parse children for non-self-closing tags
    if (!isSelfClosing) {
      const closeTag = `</${tagName}>`;
      const closePos = html.toLowerCase().indexOf(closeTag, pos);
      
      if (closePos !== -1) {
        const innerHtml = html.substring(pos, closePos);
        element.children = this.parseHTML(innerHtml);
        pos = closePos + closeTag.length;
      }
    }
    
    return { element, endPos: pos };
  }
  
  private parseAttribute(html: string, startPos: number): { name: string; value: string; endPos: number } | null {
    let pos = startPos;
    
    // Parse attribute name
    while (pos < html.length && /[a-zA-Z0-9-]/.test(html[pos])) {
      pos++;
    }
    
    const name = html.substring(startPos, pos);
    if (!name) return null;
    
    // Skip whitespace
    while (pos < html.length && /\s/.test(html[pos])) {
      pos++;
    }
    
    // Check for = 
    if (html[pos] !== '=') {
      // Boolean attribute
      return { name, value: 'true', endPos: pos };
    }
    
    pos++; // Skip =
    
    // Skip whitespace
    while (pos < html.length && /\s/.test(html[pos])) {
      pos++;
    }
    
    // Parse value
    let value = '';
    if (html[pos] === '"' || html[pos] === "'") {
      const quote = html[pos];
      pos++;
      const endQuote = html.indexOf(quote, pos);
      if (endQuote !== -1) {
        value = html.substring(pos, endQuote);
        pos = endQuote + 1;
      }
    } else {
      // Unquoted value
      const valueStart = pos;
      while (pos < html.length && !/[\s>]/.test(html[pos])) {
        pos++;
      }
      value = html.substring(valueStart, pos);
    }
    
    return { name, value, endPos: pos };
  }
  
  private parseText(html: string, startPos: number): { text: string; endPos: number } | null {
    let pos = startPos;
    let text = '';
    
    while (pos < html.length && html[pos] !== '<') {
      text += html[pos];
      pos++;
    }
    
    return { text, endPos: pos };
  }
  
  private parseInlineStyle(styleStr: string): Record<string, string> {
    const styles: Record<string, string> = {};
    const declarations = styleStr.split(';');
    
    for (const decl of declarations) {
      const colonIndex = decl.indexOf(':');
      if (colonIndex !== -1) {
        const property = decl.substring(0, colonIndex).trim();
        const value = decl.substring(colonIndex + 1).trim();
        if (property && value) {
          styles[property] = value;
        }
      }
    }
    
    return styles;
  }
}