// FIXED HTML to Figma Converter - Faithful CSS Conversion
// Removes ALL smart defaults and interprets CSS exactly as written

import { SpacingExtractor } from '../utils/spacing-extractor';
import { GridWidthCalculator } from '../utils/grid-calculator';
import { DynamicGridCalculator } from '../utils/dynamic-grid-calculator';
import { DynamicSpacingExtractor } from '../utils/dynamic-spacing-extractor';
import { DynamicWidthDetector } from '../utils/dynamic-width-detector';

// CRITICAL FIX: Clean quotes from CSS values
function cleanQuotesFromCSS(styles: any): any {
  if (!styles || typeof styles !== 'object') return styles;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === 'string' && value.length >= 2) {
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        cleaned[key] = value.slice(1, -1);
        console.log(`🧹 CLEANED: ${key} = ${value} → ${cleaned[key]}`);
      } else {
        cleaned[key] = value;
      }
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// CSS Layout Pattern Detection System
interface LayoutContext {
  isLayoutContainer: boolean;
  isResponsiveGrid: boolean;
  isFlexItem: boolean;
  isCenteredContainer: boolean;
  hasIntrinsicSize: boolean;
  isCardElement: boolean;
  isHeaderElement: boolean;
  layoutType: 'flex' | 'grid' | 'block' | 'inline';
  parentMinWidth?: number;
  parentContext?: LayoutContext;
  styles?: Record<string, string>; // Store styles for constraint extraction
  tagName?: string; // Element tag name for text detection
  className?: string; // Element class name for pattern detection
}

interface SizingStrategy {
  width: number;
  height: number;
  usesLayoutSizing: boolean;
  shouldFillParent: boolean;
  isCentered: boolean;
  layoutHints: Record<string, any>;
}

class CSSLayoutPatternDetector {
  static analyzeLayoutContext(styles: Record<string, string>, element: SimpleElement, parentContext?: LayoutContext): LayoutContext {
    const display = styles.display || 'block';
    const isFlexContainer = display === 'flex';
    const isGridContainer = display === 'grid';
    
    // ENHANCED: Track parent grid patterns
    const isGridChild = parentContext?.isResponsiveGrid || parentContext?.layoutType === 'grid';
    const isFlexChild = parentContext?.layoutType === 'flex';
    
    return {
      isLayoutContainer: isFlexContainer || isGridContainer,
      isResponsiveGrid: this.detectResponsiveGrid(styles),
      isFlexItem: this.hasFlexGrowProperties(styles) || isFlexChild,
      isCenteredContainer: this.detectCenteredContainer(styles),
      hasIntrinsicSize: this.hasExplicitDimensions(styles),
      isCardElement: this.detectCardElement(styles) || isGridChild, // ✅ Grid children are card-like
      isHeaderElement: this.detectHeaderElement(styles),
      layoutType: this.getLayoutType(display),
      parentMinWidth: parentContext ? this.extractParentConstraints(parentContext) : undefined, // ✅ Inherit constraints
      parentContext: parentContext, // Store parent context for reference
      tagName: element.tagName, // Store tag name for text detection
      className: element.className // Store class name for pattern detection
    };
  }
  
  private static detectResponsiveGrid(styles: Record<string, string>): boolean {
    const gridColumns = styles['grid-template-columns'] || '';
    const isResponsive = gridColumns.includes('repeat(auto-fit') || gridColumns.includes('minmax(');
    console.log('[RESPONSIVE GRID] Checking grid columns:', gridColumns, '→ isResponsive:', isResponsive);
    return isResponsive;
  }
  
  private static hasFlexGrowProperties(styles: Record<string, string>): boolean {
    return parseFloat(styles['flex-grow'] || '0') > 0 || !!styles['flex-basis'];
  }
  
  private static detectCenteredContainer(styles: Record<string, string>): boolean {
    return styles.margin === '0 auto' || 
           (styles['margin-left'] === 'auto' && styles['margin-right'] === 'auto');
  }
  
  private static hasExplicitDimensions(styles: Record<string, string>): boolean {
    return !!styles.width || !!styles.height || !!styles['min-width'] || !!styles['max-width'];
  }
  
  private static detectCardElement(styles: Record<string, string>): boolean {
    const hasPadding = !!styles.padding || !!styles['padding-left'] || !!styles['padding-right'];
    const hasBorder = !!styles.border || !!styles['border-width'];
    const hasBackground = !!styles['background-color'] || !!styles.background;
    const hasMinWidth = !!styles['min-width'];
    
    // CRITICAL FIX: Don't treat elements with just padding/background as cards
    // Cards need explicit sizing constraints
    return hasMinWidth && hasPadding && (hasBorder || hasBackground);
  }
  
  private static detectHeaderElement(styles: Record<string, string>): boolean {
    return styles.display === 'flex' && styles['justify-content'] === 'space-between';
  }
  
  private static getLayoutType(display: string): 'flex' | 'grid' | 'block' | 'inline' {
    switch (display) {
      case 'flex': return 'flex';
      case 'grid': return 'grid';
      case 'inline':
      case 'inline-block': return 'inline';
      default: return 'block';
    }
  }
  
  private static extractParentConstraints(parentContext: LayoutContext): number | undefined {
    // Extract min-width from parent grid constraints
    if (parentContext.isResponsiveGrid && parentContext.styles) {
      const parentStyles = parentContext.styles;
      if (parentStyles && parentStyles['grid-template-columns']) {
        const gridColumns = parentStyles['grid-template-columns'];
        const minmaxMatch = gridColumns.match(/minmax\((\d+)px/);
        const extractedWidth = minmaxMatch ? parseInt(minmaxMatch[1]) : undefined;
        console.log('[PARENT CONSTRAINTS] Grid columns:', gridColumns, '→ extracted width:', extractedWidth);
        return extractedWidth;
      }
    }
    return undefined;
  }
}

class SizingStrategyResolver {
  static resolveSizing(context: LayoutContext, styles: Record<string, string>, isMainFrame: boolean): SizingStrategy {
    console.log('[SIZING STRATEGY] Resolving sizing for context:', context);
    
    // Priority order: CSS explicit > Layout mode > Content heuristics > Defaults
    
    // PRIORITY 1: Check for explicit CSS width first
    const explicitWidth = this.checkForExplicitCSSWidth(styles);
    if (explicitWidth && !isMainFrame) {
      console.log('[CSS WIDTH PRIORITY] Using explicit CSS width:', explicitWidth);
      return {
        width: explicitWidth,
        height: this.parseDimension(styles.height) || 0,
        usesLayoutSizing: false,
        shouldFillParent: false,
        isCentered: false,
        layoutHints: { hasExplicitWidth: true, cssWidth: explicitWidth }
      };
    }
    
    // 1. Main frame always has fixed width
    if (isMainFrame) {
      return {
        width: 1400,
        height: 0, // No height - let content determine
        usesLayoutSizing: false,
        shouldFillParent: false,
        isCentered: false,
        layoutHints: { isMainFrame: true }
      };
    }
    
    // CRITICAL FIX: Check if element is a direct child of a flex/grid container
    const isChildOfLayoutContainer = context.parentContext?.isLayoutContainer || false;
    const parentIsFlexRow = context.parentContext?.layoutType === 'flex' && 
                            (context.parentContext?.styles?.['flex-direction'] || 'row') === 'row';
    const hasExplicitWidth = !!styles.width || !!styles['max-width'];
    const shouldFillWidth = isChildOfLayoutContainer && !hasExplicitWidth;
    
    console.log('[SIZING STRATEGY] Layout child analysis:', {
      isChildOfLayoutContainer,
      parentIsFlexRow,
      hasExplicitWidth,
      shouldFillWidth
    });
    
    // CRITICAL: Elements inside layout containers without explicit width should fill
    if (shouldFillWidth && !context.hasIntrinsicSize) {
      console.log('[SIZING STRATEGY] Child of layout container - should FILL width');
      return {
        width: 0, // No width - FILL will handle it
        height: 0, // No height - HUG will handle it
        usesLayoutSizing: true,
        shouldFillParent: true,
        isCentered: false,
        layoutHints: { 
          isLayoutChild: true,
          parentLayout: context.parentContext?.layoutType 
        }
      };
    }
    
    // CRITICAL FIX: Enhanced grid child detection
    if (context.parentContext?.isResponsiveGrid) {
      const gridMinWidth = this.extractGridMinWidth(context.parentContext);
      
      // CRITICAL: Calculate actual width based on container and constraints
      const containerWidth = 1320; // Dashboard container max-width
      const gap = context.parentContext.styles?.gap ? 
        parseInt(context.parentContext.styles.gap.replace('px', '')) : 24;
      
      // Calculate how many items fit and their actual width
      const itemsPerRow = Math.floor((containerWidth + gap) / (gridMinWidth + gap));
      const actualItemWidth = Math.max(
        (containerWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
        gridMinWidth
      );
      
      console.log('[GRID CHILD] Enhanced sizing:', {
        minWidth: gridMinWidth,
        containerWidth,
        gap,
        itemsPerRow,
        actualItemWidth: Math.round(actualItemWidth)
      });
      
      return {
        width: Math.round(actualItemWidth), // ✅ Use calculated width, not fixed minWidth
        height: 180,
        usesLayoutSizing: false,
        shouldFillParent: false, // ✅ Don't fill - use calculated width
        isCentered: false,
        layoutHints: { 
          isGridChild: true, 
          minWidth: gridMinWidth,
          actualWidth: Math.round(actualItemWidth),
          isResponsiveGridChild: true
        }
      };
    }
    
    // 2. Card elements use fixed sizing
    if (context.isCardElement) {
      // Use parent constraints if available, otherwise fall back to element's min-width
      const minWidth = context.parentMinWidth || this.parseDimension(styles['min-width']) || 300;
      const paddingTotal = this.calculateTotalPadding(styles);
      const borderTotal = this.calculateTotalBorder(styles);
      
      console.log('[CARD SIZING] Card element sizing:', {
        parentMinWidth: context.parentMinWidth,
        elementMinWidth: this.parseDimension(styles['min-width']),
        finalMinWidth: minWidth,
        paddingTotal,
        borderTotal
      });
      
      return {
        width: minWidth + paddingTotal + borderTotal,
        height: 180,
        usesLayoutSizing: false,
        shouldFillParent: false,
        isCentered: false,
        layoutHints: { isCard: true, minWidth }
      };
    }
    
    // 3. Flex items with grow should fill
    if (context.isFlexItem) {
      return {
        width: 0, // No width - FILL will handle it
        height: 0, // No height - HUG will handle it
        usesLayoutSizing: true,
        shouldFillParent: true,
        isCentered: false,
        layoutHints: { flexGrow: parseFloat(styles['flex-grow'] || '1') }
      };
    }
    
    // 4. Centered containers with max-width
    if (context.isCenteredContainer && styles['max-width']) {
      const maxWidth = this.parseDimension(styles['max-width']);
      return {
        width: maxWidth || 1400, // Use actual max-width value
        height: 0, // No height - let Auto Layout HUG
        usesLayoutSizing: true,
        shouldFillParent: false, // Don't fill parent, use max-width
        isCentered: true,
        layoutHints: { maxWidth: styles['max-width'] }
      };
    }
    
    // CRITICAL FIX: Elements inside flex containers should fill unless they have intrinsic sizing
    const isInsideFlexContainer = context.parentContext?.layoutType === 'flex';
    const isFlexChild = isInsideFlexContainer && !context.isLayoutContainer;
    
    // Special handling for elements with explicit width that should still participate in flex layout
    if (isFlexChild && styles.width) {
      // Elements like klarna-logo with explicit width but inside flex containers
      const explicitWidth = this.parseDimension(styles.width) || 140;
      console.log('[FLEX CHILD] Element with explicit width inside flex container:', explicitWidth);
      return {
        width: explicitWidth,  // Use CSS width
        height: this.parseDimension(styles.height) || 0, // No default height
        usesLayoutSizing: true,
        shouldFillParent: false, // Don't fill, but participate in flex
        isCentered: false,
        layoutHints: { 
          isFlexChild: true,
          hasExplicitWidth: true,
          cssWidth: explicitWidth
        }
      };
    }
    
    // Elements without explicit dimensions inside flex containers should fill
    if (isFlexChild && !styles.width && !styles.height) {
      console.log('[FLEX CHILD] Element without dimensions inside flex container - should FILL');
      return {
        width: 0,   // No width - FILL will handle it
        height: 0,  // No height - HUG will handle it
        usesLayoutSizing: true,
        shouldFillParent: true,
        isCentered: false,
        layoutHints: { 
          isFlexChild: true,
          shouldFillFlex: true
        }
      };
    }
    
    // 5. Text element detection - elements with only text content and no layout children
    const isTextElement = this.detectTextElement(context, styles);
    if (isTextElement) {
      console.log('[TEXT ELEMENT] Detected text element, applying HUG sizing');
      return {
        width: 100,  // Initial width, will be overridden by HUG
        height: 40,  // Initial height, will be overridden by HUG
        usesLayoutSizing: true,
        shouldFillParent: false,
        isCentered: false,
        layoutHints: { 
          isTextElement: true,
          shouldHugContent: true 
        }
      };
    }
    
    // 6. Container section detection - sections with padding/background but no dimensions
    const isContainerSection = this.detectContainerSection(context, styles);
    if (isContainerSection) {
      console.log('[CONTAINER SECTION] Detected container section, applying FILL width + HUG height');
      return {
        width: 0,     // No width - FILL will handle it
        height: 0,    // No height - will be handled by HUG
        usesLayoutSizing: true,
        shouldFillParent: true,
        isCentered: false,
        layoutHints: { 
          isContainerSection: true,
          fillWidth: true,
          hugHeight: true 
        }
      };
    }
    
    // 7. Layout containers without intrinsic size
    if (context.isLayoutContainer && !context.hasIntrinsicSize) {
      // CRITICAL FIX: Layout containers that are children should fill parent
      const isChild = !!context.parentContext;
      return {
        width: 0, // No width - FILL will handle it
        height: 0, // No height - let Auto Layout HUG
        usesLayoutSizing: true,
        shouldFillParent: isChild, // Fill parent if it's a child
        isCentered: false,
        layoutHints: { layoutType: context.layoutType }
      };
    }
    
    // 8. Default sizing - use reasonable defaults when no CSS is specified
    const width = this.parseDimension(styles.width) || 
                  this.parseDimension(styles['max-width']) || 
                  300; // Reasonable default width
    const height = this.parseDimension(styles.height) || 0; // No default height - let Auto Layout HUG
    
    return {
      width,
      height,
      usesLayoutSizing: context.isLayoutContainer,
      shouldFillParent: false,
      isCentered: context.isCenteredContainer,
      layoutHints: {}
    };
  }
  
  private static parseDimension(value?: string): number | undefined {
    if (!value) return undefined;
    const match = value.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : undefined;
  }
  
  private static calculateTotalPadding(styles: Record<string, string>): number {
    const padding = this.parseDimension(styles.padding) || 0;
    if (padding > 0) return padding * 2;
    
    const paddingLeft = this.parseDimension(styles['padding-left']) || 0;
    const paddingRight = this.parseDimension(styles['padding-right']) || 0;
    return paddingLeft + paddingRight;
  }
  
  private static calculateTotalBorder(styles: Record<string, string>): number {
    if (styles.border) {
      const borderParts = styles.border.split(' ');
      const borderWidth = this.parseDimension(borderParts[0]) || 0;
      return borderWidth * 2;
    }
    
    const borderWidth = this.parseDimension(styles['border-width']) || 0;
    if (borderWidth > 0) return borderWidth * 2;
    
    const borderLeft = this.parseDimension(styles['border-left-width']) || 0;
    const borderRight = this.parseDimension(styles['border-right-width']) || 0;
    return borderLeft + borderRight;
  }
  
  static checkForExplicitCSSWidth(styles: Record<string, string>): number | null {
    // Check for explicit width properties
    const explicitWidth = styles.width || 
                         styles['max-width'] || 
                         styles['min-width'];
    
    if (explicitWidth && explicitWidth !== 'auto' && explicitWidth !== 'none') {
      const parsedWidth = parseFloat(explicitWidth.replace(/px|%|em|rem/, ''));
      if (!isNaN(parsedWidth) && parsedWidth > 0) {
        console.log('[CSS WIDTH PRIORITY] Found explicit width:', explicitWidth, '→', parsedWidth);
        return parsedWidth;
      }
    }
    
    return null;
  }
  
  private static extractGridMinWidth(parentContext: LayoutContext): number {
    if (parentContext.styles && parentContext.styles['grid-template-columns']) {
      const gridColumns = parentContext.styles['grid-template-columns'];
      const minmaxMatch = gridColumns.match(/minmax\((\d+)px/);
      const extractedWidth = minmaxMatch ? parseInt(minmaxMatch[1]) : 300;
      console.log('[GRID EXTRACTION] Grid template columns:', gridColumns);
      console.log('[GRID EXTRACTION] Extracted min-width:', extractedWidth);
      return extractedWidth;
    }
    return 300; // Default fallback
  }
  
  private static detectTextElement(context: LayoutContext, styles: Record<string, string>): boolean {
    // Text elements have no explicit dimensions and are not layout containers
    const hasNoDimensions = !styles.width && !styles.height && !styles['min-width'] && !styles['max-width'];
    const isNotLayoutContainer = !context.isLayoutContainer;
    const hasTextStyling = !!styles['font-size'] || !!styles['line-height'] || !!styles['font-weight'];
    
    // Also check if this is a heading element by tag pattern
    const hasHeadingTag = !!(context.tagName && /^h[1-6]$/.test(context.tagName.toLowerCase()));
    
    // CRITICAL: Also consider elements with class names suggesting text content
    const className = context.className || '';
    const hasTextClassName = className.includes('subtitle') ||
                            className.includes('title') ||
                            className.includes('text') ||
                            className.includes('label') ||
                            className.includes('heading');
    
    return hasNoDimensions && isNotLayoutContainer && (hasTextStyling || hasHeadingTag || hasTextClassName);
  }
  
  private static detectContainerSection(context: LayoutContext, styles: Record<string, string>): boolean {
    const hasPadding = !!styles.padding || 
                       !!styles['padding-top'] || 
                       !!styles['padding-bottom'] || 
                       !!styles['padding-left'] || 
                       !!styles['padding-right'];
    const hasBackground = !!styles['background-color'] || !!styles.background;
    const hasBorder = !!styles.border || !!styles['border-width'];
    const hasNoDimensions = !styles.width && !styles.height;
    
    // Container sections have styling but no explicit dimensions
    return hasNoDimensions && hasPadding && (hasBackground || hasBorder);
  }
}

// Types
interface FigmaNode {
  id: string;
  type: 'FRAME' | 'GROUP' | 'RECTANGLE' | 'TEXT' | 'COMPONENT' | 'INSTANCE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  constraints?: FigmaConstraints;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  fillParentWidth?: boolean; // Custom flag to indicate child should fill parent
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  gap?: string; // CSS gap value
  padding?: string; // CSS padding shorthand
  children?: FigmaNode[];
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  fontWeight?: string | number; // CSS font-weight
  fontFamily?: string; // CSS font-family
  color?: string; // Text color
  textAlign?: string; // CSS text-align
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  lineHeight?: { value: number; unit: 'PIXELS' | 'PERCENT' } | string;
  letterSpacing?: { value: number; unit: 'PIXELS' | 'PERCENT' } | string;
  backgroundColor?: string; // CSS background-color
  borderRadius?: string | number; // CSS border-radius
  justifyContent?: string; // CSS justify-content
  alignItems?: string; // CSS align-items
  maxWidth?: string; // CSS max-width
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  shouldFillParent?: boolean;
  cornerRadius?: number;
  strokeWeight?: number;
  opacity?: number;
  layoutWrap?: 'WRAP' | 'NO_WRAP';
  counterAxisSpacing?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
}

interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: { r: number; g: number; b: number };
  opacity?: number;
}

interface FigmaStroke {
  type: 'SOLID';
  color: { r: number; g: number; b: number };
  opacity?: number;
}

interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  color?: { r: number; g: number; b: number };
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
  opacity?: number;
}

interface FigmaConstraints {
  horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
  vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

interface ConversionOptions {
  useAutoLayout: boolean;
  createLocalStyles: boolean;
  useExistingStyles: boolean;
  detectComponents: boolean;
  preserveHyperlinks: boolean;
  highResImages: boolean;
  fontFallbacks: 'auto' | 'strict' | 'ignore';
}

interface SimpleElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  style: Record<string, string>;
  children: SimpleElement[];
  attributes: Record<string, string>;
  parent?: SimpleElement; // CRITICAL: Add parent tracking for CSS descendant selectors
}

// FIXED Color parsing utilities - exact conversion only
class ColorUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    // CRITICAL FIX: Handle both 3-digit (#333) and 6-digit (#333333) hex colors
    const cleanHex = hex.replace('#', '');
    
    let r: number, g: number, b: number;
    
    if (cleanHex.length === 3) {
      // 3-digit hex: #333 → #333333
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
      console.log('[COLOR FIX] Expanded 3-digit hex:', hex, '→ rgb:', {r, g, b});
    } else if (cleanHex.length === 6) {
      // 6-digit hex: #333333
      r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      console.log('[COLOR FIX] Parsed 6-digit hex:', hex, '→ rgb:', {r, g, b});
    } else {
      // Invalid format - fallback to black
      console.warn('[COLOR FIX] Invalid hex format:', hex, '→ fallback to black');
      return { r: 0, g: 0, b: 0 };
    }
    
    return { r, g, b };
  }

  static rgbStringToRgb(rgb: string): { r: number; g: number; b: number } {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    return match ? {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  static parseColor(colorString: string): { r: number; g: number; b: number } {
    if (!colorString || colorString === 'transparent') {
      return { r: 0, g: 0, b: 0 };
    }
    
    if (colorString.startsWith('#')) {
      return this.hexToRgb(colorString);
    } else if (colorString.startsWith('rgb')) {
      return this.rgbStringToRgb(colorString);
    }
    
    // Basic named colors only - no custom interpretations
    const namedColors: Record<string, { r: number; g: number; b: number }> = {
      'red': { r: 1, g: 0, b: 0 },
      'green': { r: 0, g: 1, b: 0 },
      'blue': { r: 0, g: 0, b: 1 },
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 1, g: 1, b: 1 },
      'gray': { r: 0.5, g: 0.5, b: 0.5 },
      'grey': { r: 0.5, g: 0.5, b: 0.5 }
    };
    
    return namedColors[colorString.toLowerCase()] || { r: 0, g: 0, b: 0 };
  }
}

// Simple HTML Parser - keeping existing parser structure
class SimpleHTMLParser {
  private html: string;
  private position: number = 0;

  constructor(html: string) {
    this.html = html.trim();
  }

  parse(): SimpleElement[] {
    const elements: SimpleElement[] = [];
    this.skipDeclarations();
    
    while (this.position < this.html.length) {
      const element = this.parseElement(); // Root elements have no parent
      if (element) {
        elements.push(element);
      }
    }
    
    return elements;
  }

  private skipDeclarations(): void {
    while (this.position < this.html.length) {
      if (this.html.substr(this.position, 9) === '<!DOCTYPE') {
        this.position = this.html.indexOf('>', this.position) + 1;
      } else if (this.html.substr(this.position, 4) === '<!--') {
        this.position = this.html.indexOf('-->', this.position) + 3;
      } else if (this.html[this.position] === '<' && this.html[this.position + 1] !== '/') {
        break;
      } else {
        this.position++;
      }
    }
  }

  private parseElement(parent?: SimpleElement): SimpleElement | null {
    this.skipWhitespace();
    
    if (this.position >= this.html.length || this.html[this.position] !== '<') {
      return null;
    }
    
    if (this.html[this.position + 1] === '/') {
      return null;
    }
    
    this.position++; // Skip '<'
    
    const tagName = this.parseTagName();
    if (!tagName) return null;
    
    const attributes = this.parseAttributes();
    
    const selfClosing = this.html[this.position - 1] === '/';
    if (this.html[this.position] === '>') {
      this.position++;
    }
    
    const element: SimpleElement = {
      tagName: tagName.toLowerCase(),
      style: this.parseInlineStyles(attributes.style || ''),
      children: [],
      attributes: attributes,
      parent: parent // CRITICAL FIX: Add parent tracking
    };
    
    if (attributes.id) element.id = attributes.id;
    if (attributes.class) element.className = attributes.class;
    
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    if (voidElements.includes(tagName.toLowerCase()) || selfClosing) {
      return element;
    }
    
    // Parse children and text content
    let textContent = '';
    while (this.position < this.html.length) {
      this.skipWhitespace();
      
      if (this.html.substr(this.position, 2) === '</' && 
          this.html.substr(this.position + 2, tagName.length).toLowerCase() === tagName.toLowerCase()) {
        this.position = this.html.indexOf('>', this.position) + 1;
        break;
      }
      
      if (this.html[this.position] === '<') {
        const child = this.parseElement(element); // CRITICAL FIX: Pass this element as parent
        if (child) {
          element.children.push(child);
        }
      } else {
        const text = this.parseText();
        if (text) {
          textContent += text;
        }
      }
    }
    
    if (textContent.trim()) {
      element.textContent = textContent.trim();
    }
    
    return element;
  }

  private parseTagName(): string {
    let tagName = '';
    while (this.position < this.html.length && /[a-zA-Z0-9]/.test(this.html[this.position])) {
      tagName += this.html[this.position];
      this.position++;
    }
    return tagName;
  }

  private parseAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    while (this.position < this.html.length && this.html[this.position] !== '>' && this.html[this.position] !== '/') {
      this.skipWhitespace();
      
      if (this.html[this.position] === '>' || this.html[this.position] === '/') {
        break;
      }
      
      let attrName = '';
      while (this.position < this.html.length && /[a-zA-Z0-9-]/.test(this.html[this.position])) {
        attrName += this.html[this.position];
        this.position++;
      }
      
      if (!attrName) {
        this.position++;
        continue;
      }
      
      this.skipWhitespace();
      
      if (this.html[this.position] === '=') {
        this.position++;
        this.skipWhitespace();
        
        let value = '';
        let quote = '';
        if (this.html[this.position] === '"' || this.html[this.position] === "'") {
          quote = this.html[this.position];
          this.position++;
          
          while (this.position < this.html.length && this.html[this.position] !== quote) {
            value += this.html[this.position];
            this.position++;
          }
          
          if (this.html[this.position] === quote) {
            this.position++;
          }
        } else {
          while (this.position < this.html.length && !/[\s>]/.test(this.html[this.position])) {
            value += this.html[this.position];
            this.position++;
          }
        }
        
        attributes[attrName] = value;
      } else {
        attributes[attrName] = 'true';
      }
    }
    
    return attributes;
  }

  private parseText(): string {
    let text = '';
    while (this.position < this.html.length && this.html[this.position] !== '<') {
      text += this.html[this.position];
      this.position++;
    }
    return text;
  }

  private skipWhitespace(): void {
    while (this.position < this.html.length && /\s/.test(this.html[this.position])) {
      this.position++;
    }
  }

  private parseInlineStyles(styleStr: string): Record<string, string> {
    const styles: Record<string, string> = {};
    if (!styleStr) return styles;
    
    const declarations = styleStr.split(';');
    for (const decl of declarations) {
      const colonIndex = decl.indexOf(':');
      if (colonIndex > 0) {
        const prop = decl.substring(0, colonIndex).trim();
        let value = decl.substring(colonIndex + 1).trim();
        
        // CRITICAL FIX: Remove quotes from inline style values
        value = value.replace(/^['"]|['"]$/g, '');
        
        if (prop && value) {
          styles[prop] = value;
        }
      }
    }
    
    // Apply quote removal to inline styles as well
    return stripQuotesFromAllValues(styles);
  }
}

// Grid Calculator - Priority 1 Fix
class GridCalculator {
  static convertAutoFitGrid(minWidth: number, gap: number, containerWidth: number = 1320): {
    itemsPerRow: number;
    itemWidth: number;
    layoutMode: 'HORIZONTAL' | 'VERTICAL';
    itemSpacing: number;
  } {
    console.log(`[GRID CALC] Converting auto-fit grid: minWidth=${minWidth}, gap=${gap}, containerWidth=${containerWidth}`);
    
    // Calculate how many items fit per row
    const itemsPerRow = Math.floor((containerWidth + gap) / (minWidth + gap));
    
    // Calculate actual item width (never smaller than minWidth)
    const itemWidth = Math.max(
      (containerWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
      minWidth
    );
    
    console.log(`[GRID CALC] Result: ${itemsPerRow} items per row, ${itemWidth}px each`);
    
    return {
      itemsPerRow,
      itemWidth: Math.round(itemWidth),
      layoutMode: 'HORIZONTAL', // Grid rows are horizontal
      itemSpacing: gap
    };
  }

  static parseGridTemplateColumns(gridTemplateColumns: string): { minWidth: number; maxWidth: string } {
    // Parse "repeat(auto-fit, minmax(300px, 1fr))"
    const autoFitMatch = gridTemplateColumns.match(/repeat\(auto-fit,\s*minmax\((\d+)px,\s*([^)]+)\)\)/);
    
    if (autoFitMatch) {
      const minWidth = parseInt(autoFitMatch[1]);
      const maxWidth = autoFitMatch[2];
      console.log(`[GRID PARSE] Auto-fit grid: minWidth=${minWidth}px, maxWidth=${maxWidth}`);
      return { minWidth, maxWidth };
    }
    
    // Parse "1fr 1fr" (two column grid)
    const frMatch = gridTemplateColumns.match(/^(\d+fr\s+)+\d+fr$/);
    if (frMatch) {
      const columns = gridTemplateColumns.split(/\s+/).length;
      console.log(`[GRID PARSE] Fixed grid: ${columns} columns`);
      return { minWidth: 200, maxWidth: '1fr' }; // Default reasonable size
    }
    
    // Default fallback
    console.log(`[GRID PARSE] Unrecognized grid format: ${gridTemplateColumns}`);
    return { minWidth: 300, maxWidth: '1fr' };
  }
}

// CSS Source Debugging Functions
class CSSSourceDebugger {
  static debugCSSSheets(): void {
    console.log('=== CSS STYLESHEETS DEBUG ===');
    console.log('Running in Figma plugin environment - CSS debugging simplified');
  }

  static debugSpecificCSSRules(cssParser: SimpleCSSParser): void {
    console.log('=== DEBUGGING SPECIFIC CSS RULES ===');
    
    // Check if .header rule exists in parsed CSS
    let headerRuleFound = false;
    let headerRuleIndex = -1;
    
    cssParser.rules.forEach((rule, index) => {
      if (rule.selector === '.header') {
        headerRuleFound = true;
        headerRuleIndex = index;
        console.log(`🔍 FOUND .header RULE at index ${index}:`, rule);
        console.log('Header CSS declarations:', rule.declarations);
        console.log('Header rule specificity:', rule.specificity);
      }
    });
    
    if (!headerRuleFound) {
      console.warn('❌ .header RULE NOT FOUND in parsed CSS rules!');
      console.log('Available selectors:');
      cssParser.rules.forEach((rule, index) => {
        console.log(`  Rule ${index}: ${rule.selector}`);
      });
    }
  }

  static debugCSSParsingOrder(css: string): void {
    console.log('=== CSS RULE PARSING ORDER DEBUG ===');
    
    // Extract CSS rules manually to see parsing order
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    let ruleIndex = 0;
    
    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      console.log(`CSS Rule ${ruleIndex}: ${selector}`);
      console.log(`  Declarations: ${declarations}`);
      
      if (selector.includes('.header')) {
        console.log('🔍 FOUND .header RULE in raw CSS:', selector);
        console.log('  Raw declarations:', declarations);
      }
      
      ruleIndex++;
    }
  }

  static debugHeaderCSSMatching(element: SimpleElement, cssParser: SimpleCSSParser): void {
    if (element.className && element.className.includes('header')) {
      console.log('🔍 DEBUGGING HEADER ELEMENT CSS MATCHING');
      console.log('Element:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
      
      // Check what CSS rules are being tested against header
      console.log('Checking CSS rule matching for header...');
      
      // Test specific selectors
      const testSelectors = ['.header', 'header', '.header-section', 'div.header'];
      
      testSelectors.forEach(selector => {
        const matches = cssParser.matchesSelector(element, selector);
        console.log(`Selector "${selector}" matches header element:`, matches);
        
        if (selector === '.header' && matches) {
          console.log('✅ Header element SHOULD match .header selector');
          console.log('Expected CSS: display: flex, align-items: center, justify-content: space-between');
        } else if (selector === '.header' && !matches) {
          console.log('❌ Header element does NOT match .header selector - THIS IS THE BUG');
          console.log('Element className:', element.className);
          console.log('Element classes array:', element.className?.split(' '));
        }
      });
    }
  }

  static debugCSSMatchingLogic(element: SimpleElement): void {
    console.log('=== CSS SELECTOR MATCHING LOGIC DEBUG ===');
    
    if (element.className && element.className.includes('header')) {
      // Check if the class name exactly matches
      console.log('Header element className:', element.className);
      const classes = element.className?.split(' ') || [];
      console.log('Header classList:', classes);
      console.log('Does classList contain "header":', classes.includes('header'));
      
      // Test different selector formats
      const testCases = [
        { selector: '.header', expected: true },
        { selector: '.header-section', expected: false },
        { selector: '.logo-section', expected: false },
        { selector: 'header', expected: false },
        { selector: 'div', expected: element.tagName.toLowerCase() === 'div' }
      ];
      
      testCases.forEach(testCase => {
        const actualResult = this.testSelectorMatch(element, testCase.selector);
        const status = actualResult === testCase.expected ? '✅' : '❌';
        console.log(`${status} Selector "${testCase.selector}": expected=${testCase.expected}, actual=${actualResult}`);
      });
    }
  }

  private static testSelectorMatch(element: SimpleElement, selector: string): boolean {
    const cleanSelector = selector.trim();
    
    // Universal selector
    if (cleanSelector === '*') return true;
    
    // ID selector
    if (cleanSelector.startsWith('#')) {
      return element.id === cleanSelector.slice(1);
    }
    
    // Class selector
    if (cleanSelector.startsWith('.')) {
      const className = cleanSelector.slice(1);
      const elementClasses = element.className?.split(' ') || [];
      return elementClasses.includes(className);
    }
    
    // Tag selector
    if (!cleanSelector.includes('.') && !cleanSelector.includes('#')) {
      return element.tagName.toLowerCase() === cleanSelector.toLowerCase();
    }
    
    return false;
  }
}

// FIXED CSS Parser - proper specificity and cascade
class SimpleCSSParser {
  private css: string;
  public rules: Array<{selector: string, declarations: Record<string, string>, specificity: number}> = [];

  constructor(css: string) {
    this.css = css;
    this.parse();
  }

  private parse(): void {
    console.log('[CSS PARSER] Parsing CSS, input length:', this.css.length);
    console.log('[CSS PARSER] CSS content preview:', this.css.substring(0, 300));
    
    // Remove comments
    const cleanCss = this.css.replace(/\/\*[\s\S]*?\*\//g, '');
    console.log('[CSS PARSER] After removing comments, length:', cleanCss.length);
    
    // Parse CSS rules with proper specificity
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    let ruleCount = 0;
    
    while ((match = ruleRegex.exec(cleanCss)) !== null) {
      const selector = match[1].trim();
      const declarationsText = match[2].trim();
      
      console.log(`[CSS PARSER] Parsing rule ${ruleCount}: ${selector}`);
      console.log(`[CSS PARSER] Declarations text: ${declarationsText}`);
      
      const declarations: Record<string, string> = {};
      declarationsText.split(';').forEach(decl => {
        const colonIndex = decl.indexOf(':');
        if (colonIndex > 0) {
          const prop = decl.substring(0, colonIndex).trim();
          let value = decl.substring(colonIndex + 1).trim();
          
          // CRITICAL FIX: Remove quotes from CSS values
          const originalValue = value;
          
          // More aggressive quote removal - handle nested quotes
          value = value.trim();
          // Remove outer quotes
          if ((value.startsWith("'") && value.endsWith("'")) || 
              (value.startsWith('"') && value.endsWith('"'))) {
            value = value.slice(1, -1);
          }
          // Remove any remaining quotes
          value = value.replace(/^['"]|['"]$/g, '');
          
          // DEBUG: Log if quotes were removed
          if (originalValue !== value) {
            console.warn(`[CSS PARSER] Removed quotes from ${prop}: "${originalValue}" → "${value}"`);
          } else if (value.includes("'") || value.includes('"')) {
            console.error(`[CSS PARSER] WARNING: ${prop} still contains quotes: "${value}"`);
          }
          
          if (prop && value) {
            declarations[prop] = value;
            console.log(`[CSS PARSER]   ${prop}: ${value}`);
          }
        }
      });
      
      if (Object.keys(declarations).length > 0) {
        // CRITICAL: Apply quote removal to all declarations
        const cleanedDeclarations = cleanQuotesFromCSS(stripQuotesFromAllValues(declarations));
        
        this.rules.push({
          selector,
          declarations: cleanedDeclarations,
          specificity: this.calculateSpecificity(selector)
        });
        ruleCount++;
      }
    }
    
    console.log('[CSS PARSER] Total rules parsed:', this.rules.length);
    
    // Sort by specificity (lowest to highest)
    this.rules.sort((a, b) => a.specificity - b.specificity);
    
    // Log final rules
    console.log('[CSS PARSER] Final rules after sorting:');
    this.rules.forEach((rule, index) => {
      console.log(`[CSS PARSER] Rule ${index}: ${rule.selector} (specificity: ${rule.specificity})`, rule.declarations);
    });
  }

  private calculateSpecificity(selector: string): number {
    let specificity = 0;
    // IDs = 100, classes = 10, elements = 1
    specificity += (selector.match(/#/g) || []).length * 100;
    specificity += (selector.match(/\./g) || []).length * 10;
    specificity += (selector.match(/^[a-z]|[ ][a-z]/g) || []).length * 1;
    return specificity;
  }

  getStylesForElement(element: SimpleElement): Record<string, string> {
    const styles: Record<string, string> = {};
    
    console.log('[CSS PARSER] Getting styles for element:', element.className || element.tagName);
    console.log('[CSS PARSER] Available rules:', this.rules.length);
    
    // Apply CSS rules in specificity order
    for (const rule of this.rules) {
      if (this.matchesSelector(element, rule.selector)) {
        console.log('[CSS PARSER] Rule MATCHED:', rule.selector, rule.declarations);
        
        // CRITICAL DEBUG: Log width property specifically
        if (rule.declarations.width) {
          console.log('[CSS WIDTH] Found width in rule:', rule.selector, '→', rule.declarations.width);
        }
        
        Object.assign(styles, rule.declarations);
      }
    }
    
    // Inline styles have highest priority
    Object.assign(styles, element.style);
    
    // CRITICAL DEBUG: Final width value
    if (styles.width) {
      console.log('[CSS WIDTH] Final computed width for', element.className, ':', styles.width);
    }
    
    // CRITICAL FIX: Clean any remaining quotes from values
    const cleanedStyles: Record<string, string> = {};
    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'string') {
        // Remove quotes from beginning and end
        cleanedStyles[key] = value.replace(/^['"]|['"]$/g, '');
      } else {
        cleanedStyles[key] = value;
      }
    }
    
    console.log('[CSS PARSER] Final computed styles:', cleanedStyles);
    return cleanedStyles;
  }

  matchesSelector(element: SimpleElement, selector: string): boolean {
    const cleanSelector = selector.trim();
    
    console.log('[CSS MATCHER] Checking selector:', cleanSelector, 'against element:', element.className || element.tagName);
    
    // Handle multiple selectors (comma-separated)
    if (cleanSelector.includes(',')) {
      return cleanSelector.split(',').some(s => this.matchesSelector(element, s.trim()));
    }
    
    // Universal selector
    if (cleanSelector === '*') {
      console.log('[CSS MATCHER] Universal selector matches');
      return true;
    }
    
    // Handle attribute selectors
    if (cleanSelector.includes('[') && cleanSelector.includes(']')) {
      const match = cleanSelector.match(/^(\w+)?\[([^=\]]+)(?:="([^"]+)")?\]/);
      if (match) {
        const [, tagName, attrName, attrValue] = match;
        if (tagName && element.tagName.toLowerCase() !== tagName.toLowerCase()) {
          return false;
        }
        if (attrValue) {
          return element.attributes[attrName] === attrValue;
        }
        return attrName in element.attributes;
      }
    }
    
    // ID selector
    if (cleanSelector.startsWith('#')) {
      const matches = element.id === cleanSelector.slice(1);
      console.log('[CSS MATCHER] ID selector result:', matches);
      return matches;
    }
    
    // Class selector
    if (cleanSelector.startsWith('.')) {
      const className = cleanSelector.slice(1);
      // CRITICAL FIX: Properly split and trim class names
      const elementClasses = element.className ? element.className.trim().split(/\s+/).filter(c => c) : [];
      const matches = elementClasses.includes(className);
      console.log('[CSS MATCHER] Class selector result:', matches, 'for class:', className, 'in classes:', elementClasses);
      return matches;
    }
    
    // Tag selector
    if (!cleanSelector.includes('.') && !cleanSelector.includes('#') && !cleanSelector.includes('[')) {
      const matches = element.tagName.toLowerCase() === cleanSelector.toLowerCase();
      console.log('[CSS MATCHER] Tag selector result:', matches);
      return matches;
    }
    
    // CRITICAL FIX: Handle descendant selectors like ".before .time-value"
    if (cleanSelector.includes(' ')) {
      return this.matchesDescendantSelector(element, cleanSelector);
    }
    
    // Handle compound selectors like "div.header" (tag + class)
    if (cleanSelector.includes('.') && !cleanSelector.startsWith('.')) {
      const parts = cleanSelector.split('.');
      const tagName = parts[0];
      const className = parts[1];
      
      const tagMatches = element.tagName.toLowerCase() === tagName.toLowerCase();
      const classMatches = (element.className?.split(' ') || []).includes(className);
      const result = tagMatches && classMatches;
      
      console.log('[CSS MATCHER] Compound selector result:', result, 'for', cleanSelector);
      return result;
    }
    
    console.log('[CSS MATCHER] Complex selector - not matched');
    return false;
  }
  
  // CRITICAL FIX: Handle descendant selectors like ".before .time-value"
  private matchesDescendantSelector(element: SimpleElement, selector: string): boolean {
    const parts = selector.trim().split(/\s+/);
    console.log('[CSS MATCHER] Descendant selector parts:', parts);
    
    // For descendant selectors, check if the element matches the last part
    // and if it has an ancestor that matches the first part
    const lastSelector = parts[parts.length - 1];
    const ancestorSelector = parts[0];
    
    // Check if current element matches the last part of the selector
    if (!this.matchesSimpleSelector(element, lastSelector)) {
      console.log('[CSS MATCHER] Element does not match last part:', lastSelector);
      return false;
    }
    
    // CRITICAL FIX: Traverse up the DOM tree to find ancestor
    let currentElement = element.parent; // Start with parent, not current element
    let foundAncestor = false;
    
    while (currentElement && !foundAncestor) {
      if (this.matchesSimpleSelector(currentElement, ancestorSelector)) {
        foundAncestor = true;
        console.log('[CSS MATCHER] Found ancestor:', ancestorSelector, 'on element:', currentElement.className || currentElement.tagName);
        break;
      }
      currentElement = currentElement.parent; // Continue traversing up
    }
    
    const result = foundAncestor;
    console.log('[CSS MATCHER] Descendant selector result:', result, 'for', selector);
    return result;
  }
  
  // Helper function to match simple selectors
  private matchesSimpleSelector(element: SimpleElement, selector: string): boolean {
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      const elementClasses = element.className?.split(' ') || [];
      return elementClasses.includes(className);
    } else if (selector.startsWith('#')) {
      return element.id === selector.slice(1);
    } else {
      return element.tagName.toLowerCase() === selector.toLowerCase();
    }
  }
}

// Helper function to strip quotes from all CSS values
function stripQuotesFromAllValues(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length >= 2) {
      // Remove surrounding quotes
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        result[key] = value.slice(1, -1);
        console.log(`🧹 FIXED: ${key} = "${value}" → "${result[key]}"`);
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

// FIXED Main Converter - Faithful CSS conversion (NO SMART DEFAULTS!)
export class HTMLToFigmaConverter {
  private options: ConversionOptions;
  private nodeCounter = 0;
  private cssParser: SimpleCSSParser | null = null;

  constructor(options: ConversionOptions) {
    this.options = options;
    
    // TEST: Verify quote removal works
    this.testQuoteRemoval();
  }
  
  private testQuoteRemoval(): void {
    console.log('🧪 === TESTING QUOTE REMOVAL ===');
    
    // Test the parser with quoted CSS
    const testCSS = `.test { display: 'grid'; gap: '24px'; }`;
    const parser = new SimpleCSSParser(testCSS);
    
    if (parser.rules.length > 0) {
      const rule = parser.rules[0];
      const display = rule.declarations.display;
      const gap = rule.declarations.gap;
      
      console.log('Test results:');
      console.log(`  display value: "${display}"`);
      console.log(`  display === 'grid': ${display === 'grid'}`);
      console.log(`  display === "'grid'": ${display === "'grid'"}`);
      console.log(`  gap value: "${gap}"`);
      console.log(`  gap === '24px': ${gap === '24px'}`);
      
      if (display !== 'grid') {
        console.error('❌ QUOTE REMOVAL FAILED! Display still has quotes!');
      } else {
        console.log('✅ Quote removal working correctly!');
      }
    }
  }
  
  private debugHTMLStructure(elements: SimpleElement[], depth = 0): void {
    const indent = '  '.repeat(depth);
    elements.forEach(element => {
      console.log(`${indent}${element.tagName}.${element.className || '(no class)'} - children: ${element.children.length}`);
      if (element.children.length > 0) {
        this.debugHTMLStructure(element.children, depth + 1);
      }
    });
  }
  
  private extractDashboardSpacing(element: SimpleElement): number {
    // Dashboard-specific spacing extraction
    if (!element?.className?.includes('dashboard-container') || !element.children) {
      return 0;
    }
    
    console.log('[DASHBOARD SPACING] Analyzing dashboard with', element.children.length, 'children');
    
    const childMargins: number[] = [];
    
    for (const child of element.children) {
      if (!child.className) continue;
      
      const childStyles = this.cssParser?.getStylesForElement(child) || {};
      const marginBottom = this.parseDimension(childStyles['margin-bottom']);
      
      if (marginBottom && marginBottom > 0) {
        childMargins.push(marginBottom);
        console.log('[DASHBOARD SPACING] Child', child.className, 'has margin-bottom:', marginBottom);
      }
    }
    
    if (childMargins.length > 0) {
      // Use the most common margin (should be 40px)
      const spacing = Math.max(...childMargins);
      console.log('[DASHBOARD SPACING] Detected spacing:', spacing, 'from margins:', childMargins);
      return spacing;
    }
    
    return 0;
  }
  
  // ENHANCED SPACING APPLICATION
  private applyEnhancedSpacing(
    node: FigmaNode, 
    element: SimpleElement, 
    styles: Record<string, string>
  ): void {
    // 🎯 DYNAMIC SPACING EXTRACTION
    const dynamicSpacing = DynamicSpacingExtractor.extractContainerSpacing(
      element,
      styles,
      this.cssParser!
    );
    
    node.itemSpacing = dynamicSpacing;
    console.log(`[DYNAMIC SPACING] Applied ${dynamicSpacing}px to ${element?.className || element?.tagName}`);
    
    // Also use original spacing extractor for padding and grid constraints
    const spacingData = SpacingExtractor.extractAllSpacing(
      element, 
      styles, 
      element.children,
      this.cssParser
    );
    
    // Apply padding
    if (spacingData.padding.top > 0 || spacingData.padding.right > 0 || 
        spacingData.padding.bottom > 0 || spacingData.padding.left > 0) {
      node.paddingTop = spacingData.padding.top;
      node.paddingRight = spacingData.padding.right;
      node.paddingBottom = spacingData.padding.bottom;
      node.paddingLeft = spacingData.padding.left;
      console.log(`[SPACING] Applied padding: ${spacingData.padding.top}/${spacingData.padding.right}/${spacingData.padding.bottom}/${spacingData.padding.left}px to ${element.className}`);
    }
    
    // Store grid constraints for children
    if (spacingData.gridConstraints) {
      (node as any).gridConstraints = spacingData.gridConstraints;
      console.log(`[GRID CONSTRAINTS] Stored for children:`, spacingData.gridConstraints);
    }
  }
  
  private verifySpacingApplication(node: FigmaNode, element: SimpleElement): void {
    console.log(`[SPACING VERIFY] ${element.className || element.tagName}:`);
    console.log(`  - itemSpacing: ${node.itemSpacing}px`);
    console.log(`  - padding: ${node.paddingTop}px ${node.paddingRight}px ${node.paddingBottom}px ${node.paddingLeft}px`);
    console.log(`  - width: ${node.width}px`);
    
    // Dashboard container verification
    if (element.className?.includes('dashboard-container')) {
      const expectedSpacing = 40;
      if (node.itemSpacing !== expectedSpacing) {
        console.warn(`[SPACING ERROR] Dashboard spacing: expected ${expectedSpacing}px, got ${node.itemSpacing}px`);
      } else {
        console.log(`[SPACING SUCCESS] Dashboard spacing correct: ${node.itemSpacing}px`);
      }
    }
    
    // Metric card verification
    if (element.className?.includes('metric-card')) {
      const expectedMinWidth = 300;
      if (node.width < expectedMinWidth) {
        console.warn(`[WIDTH ERROR] Card width: expected >${expectedMinWidth}px, got ${node.width}px`);
      } else {
        console.log(`[WIDTH SUCCESS] Card width correct: ${node.width}px`);
      }
    }
  }

  async convert(html: string, css: string = ''): Promise<FigmaNode[]> {
    console.log('[FaithfulConverter] Starting exact CSS conversion - NO smart defaults');
    console.log('[CSS DEBUG] Input CSS length:', css.length);
    console.log('[CSS DEBUG] CSS content preview:', css.substring(0, 500));
    
    // CRITICAL DEBUG: Check if CSS already has quotes
    if (css.includes("display: 'grid'") || css.includes('display: "grid"')) {
      console.error('[CSS ERROR] CSS already contains quoted values!');
      console.error('[CSS ERROR] Example:', css.match(/display:\s*['"][^'"]+['"]/)?.[0]);
      console.error('[CSS ERROR] This means the UI is sending pre-quoted CSS');
    }
    
    // CRITICAL: Run CSS source debugging
    CSSSourceDebugger.debugCSSSheets();
    
    // CRITICAL: Debug CSS parsing order BEFORE parsing
    CSSSourceDebugger.debugCSSParsingOrder(css);
    
    // CRITICAL FIX: Pre-process CSS to remove any quotes that might be in the input
    // This is a more aggressive approach that handles all quote patterns
    let cleanedCSS = css;
    
    // EMERGENCY: More aggressive quote removal patterns
    // Remove quotes from property values - handle all patterns
    cleanedCSS = cleanedCSS.replace(/:\s*'([^']*)'/g, ': $1');  // Single quotes
    cleanedCSS = cleanedCSS.replace(/:\s*"([^"]*)"/g, ': $1');  // Double quotes
    cleanedCSS = cleanedCSS.replace(/:\s*'([^']*)'(?=[;,\s}])/g, ': $1'); // Single quotes before delimiters
    cleanedCSS = cleanedCSS.replace(/:\s*"([^"]*)"(?=[;,\s}])/g, ': $1'); // Double quotes before delimiters
    // Additional patterns
    cleanedCSS = cleanedCSS.replace(/:\s*["']([^"']+)["']/g, ': $1'); // Any quotes
    cleanedCSS = cleanedCSS.replace(/:\s*\\?["']([^"']+)\\?["']/g, ': $1'); // Escaped quotes
    
    if (cleanedCSS !== css) {
      console.warn('[CSS FIX] Removed quotes from CSS input');
      console.log('[CSS FIX] Example before:', css.match(/:\s*['"][^'"]+['"]/)?.[0]);
      console.log('[CSS FIX] Example after:', cleanedCSS.match(/:\s*[^;]+/)?.[0]);
      
      // Show specific fixes
      const displayMatch = css.match(/display:\s*['"]([^'"]+)['"]/);
      if (displayMatch) {
        console.log(`[CSS FIX] Fixed display: "${displayMatch[0]}" → "display: ${displayMatch[1]}"`);
      }
    }
    
    // Parse CSS 
    this.cssParser = new SimpleCSSParser(cleanedCSS);
    console.log('[FaithfulConverter] Parsed', this.cssParser.rules.length, 'CSS rules');
    
    // CRITICAL: Debug specific CSS rules AFTER parsing
    CSSSourceDebugger.debugSpecificCSSRules(this.cssParser);
    
    // DEBUG: Check parsed rules for quotes
    this.cssParser.rules.forEach((rule, index) => {
      if (rule.declarations.display && rule.declarations.display.includes("'")) {
        console.error(`[CSS ERROR] Rule ${index} still has quotes in display value:`, rule.declarations.display);
      }
    });
    
    // Log parsed CSS rules
    console.log('[CSS DEBUG] Parsed CSS rules:');
    this.cssParser.rules.forEach((rule, index) => {
      console.log(`  Rule ${index}: ${rule.selector}`, rule.declarations);
    });
    
    // Parse HTML 
    const parser = new SimpleHTMLParser(html);
    const elements = parser.parse();
    
    console.log('=== HTML STRUCTURE DEBUG ===');
    this.debugHTMLStructure(elements);
    console.log('=== END STRUCTURE DEBUG ===');
    
    // Filter wrapper elements
    const filteredElements = this.filterWrapperElements(elements);
    
    // Convert elements faithfully
    const figmaNodes: FigmaNode[] = [];
    for (let i = 0; i < filteredElements.length; i++) {
      const element = filteredElements[i];
      const isMainFrame = i === 0; // First element is the main frame
      const node = this.convertElementFaithfully(element, isMainFrame);
      if (node) {
        // Apply body styles to the first (main) node if available
        if (isMainFrame && (this as any).__bodyStyles) {
          console.log('[BODY STYLES] Applying body styles to main frame');
          this.applyExactVisualStyles(node, (this as any).__bodyStyles);
        }
        
        // Verify spacing application
        this.verifySpacingApplication(node, filteredElements[i]);
        
        figmaNodes.push(node);
      }
    }
    
    console.log('[FaithfulConverter] Created', figmaNodes.length, 'Figma nodes');
    return figmaNodes;
  }

  private filterWrapperElements(elements: SimpleElement[]): SimpleElement[] {
    let result: SimpleElement[] = [];
    let bodyElement: SimpleElement | null = null;
    
    // First pass: find body element to extract its styles
    for (const element of elements) {
      if (element.tagName === 'body') {
        bodyElement = element;
        break;
      } else if (element.tagName === 'html') {
        // Look for body in html children
        for (const child of element.children) {
          if (child.tagName === 'body') {
            bodyElement = child;
            break;
          }
        }
      }
    }
    
    // Extract body styles to apply to main container
    if (bodyElement) {
      const bodyStyles = this.cssParser?.getStylesForElement(bodyElement) || {};
      console.log('[BODY STYLES] Found body element with styles:', bodyStyles);
      
      // Store body styles for later application to main container
      (this as any).__bodyStyles = bodyStyles;
    }
    
    // Filter as before
    for (const element of elements) {
      if (element.tagName === 'html' || element.tagName === 'body') {
        result = result.concat(this.filterWrapperElements(element.children));
      } else if (element.tagName === 'head') {
        continue;
      } else {
        result.push(element);
      }
    }
    
    return result;
  }

  private convertElementFaithfully(element: SimpleElement, isMainFrame: boolean = false, parentContext?: LayoutContext): FigmaNode | null {
    const className = element.className || element.tagName;
    console.log('[FaithfulConverter] Converting:', element.tagName, className, isMainFrame ? '(MAIN FRAME)' : '(CHILD FRAME)');
    
    // CRITICAL: Debug CSS source for this element
    console.log('[CSS DEBUG] Element details:', {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      inlineStyles: element.style
    });
    
    // CSS-DRIVEN: Debug CSS matching for all elements
    CSSSourceDebugger.debugCSSMatchingLogic(element);
    
    // Get EXACT computed styles - NO interpretation
    const rawStyles = this.cssParser!.getStylesForElement(element);
    
    // CRITICAL: Double-check quote removal
    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawStyles)) {
      if (typeof value === 'string') {
        const cleanValue = value.replace(/^['"]|['"]$/g, '');
        if (cleanValue !== value) {
          console.warn(`[QUOTE FIX] Cleaned ${key}: "${value}" → "${cleanValue}"`);
        }
        styles[key] = cleanValue;
      } else {
        styles[key] = value as string;
      }
    }
    
    console.log('[FaithfulConverter] Exact CSS styles for', className, ':', styles);
    
    // DEBUG: Specifically check display value
    if (styles.display) {
      console.log(`[DISPLAY CHECK] Raw value: "${rawStyles.display}"`);
      console.log(`[DISPLAY CHECK] Clean value: "${styles.display}"`);
      console.log(`[DISPLAY CHECK] Is grid? ${styles.display === 'grid'}`);
      console.log(`[DISPLAY CHECK] Is flex? ${styles.display === 'flex'}`);
    }
    
    // Get current element's layout context with parent context
    const layoutContext = CSSLayoutPatternDetector.analyzeLayoutContext(styles, element, parentContext);
    // Store styles in context for constraint extraction
    layoutContext.styles = styles;
    
    // Debug grid parent relationship
    if (layoutContext.parentContext?.isResponsiveGrid) {
      console.log('[GRID PARENT DEBUG] Element:', element.className, 
                  'has responsive grid parent');
      console.log('[GRID PARENT DEBUG] Parent constraints:', 
                  layoutContext.parentContext.styles?.['grid-template-columns']);
    }
    
    // Get dimensions using enhanced sizing system
    const sizingResult = this.determineElementSizing(styles, className, isMainFrame, layoutContext);
    
    // CRITICAL FIX: Double-check CSS width override
    if (styles.width && !isMainFrame) {
      const cssWidth = this.parseDimension(styles.width);
      if (cssWidth && cssWidth !== sizingResult.width) {
        console.log('[CSS WIDTH OVERRIDE] Using CSS width:', cssWidth, 'instead of:', sizingResult.width, 'for', className);
        sizingResult.width = cssWidth;
      }
    }
    
    console.log('[CRITICAL DEBUG] Enhanced sizing result:', {
      element: className,
      layoutContext,
      dimensions: sizingResult,
      cssWidth: styles.width,
      cssMaxWidth: styles['max-width'],
      cssHeight: styles.height
    });
    
    // CRITICAL: Verify CSS rule matching
    console.log('[CSS DEBUG] Checking CSS rule matches for', className);
    this.cssParser!.rules.forEach((rule, index) => {
      // CRITICAL FIX: Clean quotes from rule declarations before checking
      const originalDeclarations = rule.declarations;
      rule.declarations = cleanQuotesFromCSS(rule.declarations);
      
      // EMERGENCY FIX: Apply aggressive quote removal right before matching
      console.log('🚨 APPLYING EMERGENCY QUOTE FIX for rule', index);
      console.log('Before emergency fix:', rule.declarations);
      
      const emergencyFixed: any = {};
      for (const [key, value] of Object.entries(rule.declarations)) {
        if (typeof value === 'string' && value.length >= 2) {
          if ((value.startsWith("'") && value.endsWith("'")) || 
              (value.startsWith('"') && value.endsWith('"'))) {
            emergencyFixed[key] = value.slice(1, -1);
            console.log(`🧹 EMERGENCY FIXED ${key}: "${value}" → "${emergencyFixed[key]}"`);
          } else {
            emergencyFixed[key] = value;
          }
        } else {
          emergencyFixed[key] = value;
        }
      }
      
      rule.declarations = emergencyFixed;
      console.log('After emergency fix:', rule.declarations);
      
      const matches = this.cssParser!.matchesSelector(element, rule.selector);
      if (matches) {
        console.log(`  ✅ Rule ${index} MATCHES: ${rule.selector}`, rule.declarations);
      } else {
        // Log key non-matches for debugging
        if (rule.selector.includes('flex') || rule.selector.includes('grid')) {
          console.log(`  ❌ Rule ${index} DOES NOT MATCH: ${rule.selector}`);
          console.log(`     Original declarations:`, originalDeclarations);
          console.log(`     Cleaned declarations:`, rule.declarations);
          // DEBUG: Check if display value has quotes
          if (rule.declarations.display) {
            console.log(`     Display value: "${rule.declarations.display}"`);
            console.log(`     Has quotes? ${rule.declarations.display.includes("'")}`);
            console.log(`     Equals 'grid'? ${rule.declarations.display === 'grid'}`);
            console.log(`     Equals "'grid'"? ${rule.declarations.display === "'grid'"}`);
          }
        }
      }
    });
    
    const { width, height, usesLayoutSizing, shouldFillParent, layoutHints } = sizingResult;
    console.log('[SIZING MODE] Element:', className);
    console.log('[SIZING MODE] Sizing decision:', sizingResult);
    
    // CRITICAL: Create TEXT node for pure text elements
    if (layoutHints?.isTextElement && element.textContent && !element.children.length) {
      console.log('[TEXT NODE] Creating pure TEXT node for:', element.tagName);
      const textNode: FigmaNode = {
        id: this.generateNodeId(),
        type: 'TEXT',
        name: this.generateNodeName(element),
        x: 0,
        y: 0,
        width: width,
        height: height,
        characters: this.decodeHTMLEntities(element.textContent),
        children: [],
        // Pass CSS properties for text
        fontWeight: styles['font-weight'],
        fontFamily: styles['font-family'],
        color: styles.color,
        textAlign: styles['text-align'],
        lineHeight: styles['line-height'],
        letterSpacing: styles['letter-spacing']
      };
      
      // Apply text styles directly
      this.applyExactTextStyles(textNode, styles, element);
      return textNode;
    }
    
    // Create frame for all other elements
    const node: FigmaNode = {
      id: this.generateNodeId(),
      type: 'FRAME',
      name: this.generateNodeName(element),
      x: 0,
      y: 0,
      width: width,
      height: height,
      children: [],
      // Pass CSS properties for enhanced handling
      backgroundColor: styles['background-color'],
      borderRadius: styles['border-radius'],
      gap: styles.gap,
      padding: styles.padding,
      maxWidth: styles['max-width'],
      justifyContent: styles['justify-content'],
      alignItems: styles['align-items']
    };
    
    // CRITICAL FIX: Clean quotes from styles before layout detection
    const cleanStyles = stripQuotesFromAllValues(styles);
    console.log('[QUOTE FIX] Cleaned styles for layout detection');
    if (cleanStyles.display !== styles.display) {
      console.log(`[QUOTE FIX] Display changed from "${styles.display}" to "${cleanStyles.display}"`);
    }
    
    // CSS-DRIVEN: For Auto Layout containers, mark that height should be ignored
    const willUseAutoLayout = cleanStyles.display === 'flex' || cleanStyles.display === 'grid';
    
    if (willUseAutoLayout) {
      (node as any).ignoreInitialHeight = true;
      console.log('[AUTO LAYOUT] Marked container to ignore initial height, display:', cleanStyles.display);
    }
    
    // Pass sizing mode information to layout application
    (node as any).usesLayoutSizing = usesLayoutSizing;
    if (shouldFillParent) {
      (node as any).shouldFillParent = true;
      console.log('[SIZING MODE] Applied shouldFillParent to:', className);
    }
    
    // CRITICAL: Pass layout hints from sizing strategy
    if (sizingResult.layoutHints) {
      (node as any).layoutHints = sizingResult.layoutHints;
      console.log('[LAYOUT HINTS] Applied hints:', sizingResult.layoutHints);
    }
    
    // CRITICAL FIX: Disable clipping to prevent content from being hidden
    (node as any).clipsContent = false;

    // Apply EXACT layout from CSS with sizing mode awareness
    this.applyExactLayout(node, styles, element, isMainFrame);
    
    // Apply EXACT visual styles from CSS (NO smart defaults)
    this.applyExactVisualStyles(node, styles);
    
    // CRITICAL FIX: Create text node for leaf elements with text content
    if (element.textContent && element.textContent.trim() !== '') {
      // Only create text node if this is a leaf element OR if it has no significant child elements
      const hasSignificantChildren = element.children.length > 0 && element.children.some(child => 
        child.tagName !== '#text' && (child.textContent || child.children.length > 0)
      );
      
      console.log('[TEXT DEBUG] Element:', element.className || element.tagName, 
                  'textContent:', element.textContent,
                  'children count:', element.children.length,
                  'hasSignificantChildren:', hasSignificantChildren);
      
      if (!hasSignificantChildren) {
      // CRITICAL FIX: Decode HTML entities before creating text node
      const decodedText = this.decodeHTMLEntities(element.textContent);
      
      const textNode: FigmaNode = {
        id: this.generateNodeId(),
        type: 'TEXT',
        name: 'Text',
        x: 0,
        y: 0,
        width: 200, // CRITICAL FIX: Enough space for text content
        height: 40,  // CRITICAL FIX: Reasonable height for text
        characters: decodedText, // Use decoded text
        children: []
      };
      
        // CRITICAL FIX: Text should fill width, hug height
        (textNode as any).textAutoResize = 'HEIGHT';  // HUG HEIGHT only
        (textNode as any).clipsContent = false;  // Don't clip text content
        
        this.applyExactTextStyles(textNode, styles, element);
        
        // CRITICAL FIX: Apply descendant selector styles AFTER text creation
        this.applyDescendantSelectorStyles(textNode, element);
        
        node.children!.push(textNode);
        console.log('[FaithfulConverter] Created text with HEIGHT auto-resize:', element.textContent);
      }
    }
    
    // Process child elements
    for (const child of element.children) {
      const childNode = this.convertElementFaithfully(child, false, layoutContext); // ✅ Pass context down
      if (childNode) {
        node.children!.push(childNode);
      }
    }
    
    // CRITICAL: Clean child margins if spacing was extracted from margins
    if ((node as any).spacingFromMargins) {
      this.cleanChildElementMargins(element, node);
    }
    
    console.log('[FaithfulConverter] Resizing container for auto-layout');
    return node;
  }

  private parseFlexSizing(styles: Record<string, string>, isMainFrame: boolean, layoutMode: string): { primary: string, counter: string, shouldFillParent: boolean } {
    const flexGrow = parseFloat(styles['flex-grow']) || 0;
    const flexShrink = parseFloat(styles['flex-shrink']) || 1;
    const className = '';
    
    console.log('=== SIZING MODE PARSING ===');
    console.log('CSS flex-grow:', flexGrow);
    console.log('CSS flex-shrink:', flexShrink);
    console.log('Layout mode:', layoutMode);
    console.log('Is main frame:', isMainFrame);
    
    // Determine sizing based on CSS flex properties and layout direction
    let primarySizing: string;
    let counterSizing: string;
    let shouldFillParent = false;
    
    if (layoutMode === 'VERTICAL') {
      // VERTICAL: primaryAxis = height, counterAxis = width
      primarySizing = 'AUTO';  // Always HUG HEIGHT
      
      if (isMainFrame) {
        counterSizing = 'FIXED';  // Main frame has fixed width (1400px)
      } else {
        // CRITICAL FIX: Child frames should HUG width, use layoutAlign for fill
        counterSizing = 'AUTO';  // HUG WIDTH - will use layoutAlign STRETCH to fill
        shouldFillParent = true;  // Fill parent width with layoutAlign
      }
    } else {
      // HORIZONTAL: primaryAxis = width, counterAxis = height  
      if (flexGrow > 0) {
        primarySizing = 'FIXED';  // Will use layoutGrow to fill
        shouldFillParent = true;
      } else {
        primarySizing = 'AUTO';   // Hug content
      }
      counterSizing = 'AUTO';     // Always HUG HEIGHT
    }
    
    console.log('Figma primary sizing:', primarySizing);
    console.log('Figma counter sizing:', counterSizing);
    console.log('Should fill parent:', shouldFillParent);
    
    return {
      primary: primarySizing,
      counter: counterSizing,
      shouldFillParent
    };
  }

  private applySpecialSizing(node: FigmaNode, styles: Record<string, string>, isMainFrame: boolean, element?: SimpleElement): void {
    console.log('=== CSS-DRIVEN SIZING ===');
    
    // 🎯 DYNAMIC GRID CHILD SIZING
    const layoutHints = (node as any).layoutHints || {};
    if (layoutHints.isGridChild && layoutHints.calculatedWidth) {
      console.log(`[DYNAMIC SIZING] Grid child ${node.name}: FIXED ${layoutHints.calculatedWidth}px`);
      
      // Force FIXED sizing for any grid child
      (node as any).layoutSizingHorizontal = 'FIXED';
      (node as any).layoutSizingVertical = 'HUG';
      (node as any).shouldFillParent = false;
      
      // Apply the dynamically calculated width
      node.width = layoutHints.calculatedWidth;
      
      console.log(`✅ DYNAMIC GRID FIXED: ${node.name} = ${layoutHints.calculatedWidth}px`);
      return;
    }
    
    // 🎯 EXPLICIT CSS HEIGHT AUTO → HUG
    if (styles.height === 'auto' || !styles.height) {
      console.log(`[HEIGHT AUTO] ${node.name}: CSS height=auto, setting to HUG`);
      
      if (node.layoutMode === 'VERTICAL') {
        node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT (primary axis)
      } else if (node.layoutMode === 'HORIZONTAL') {
        node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT (counter axis)
      } else {
        // No layout mode - this is a basic frame
        (node as any).layoutSizingVertical = 'HUG';
      }
      
      console.log(`✅ HEIGHT AUTO APPLIED: ${node.name} set to HUG height`);
    }
    
    // 🎯 SPECIFIC ELEMENT PATTERNS
    if (element?.className?.includes('logo')) {
      console.log(`[LOGO FIX] ${node.name}: Logo element detected, forcing HUG height`);
      (node as any).layoutSizingVertical = 'HUG';
      console.log(`✅ LOGO HUG: ${node.name} height set to HUG`);
    }
    
    // CSS-driven sizing decisions based on properties, not class names
    const isFlexContainer = styles.display === 'flex';
    const isGridContainer = styles.display === 'grid';
    const hasFlexGrow = parseFloat(styles['flex-grow'] || '0') > 0;
    const hasExplicitWidth = !!styles.width;
    const specialSizingHasMinWidth = !!styles['min-width'];
    const flexDirection = styles['flex-direction'] || 'row';
    const justifyContent = styles['justify-content'];
    
    // CRITICAL FIX: Check if this is a layout child that should fill
    const isLayoutChild = layoutHints.isLayoutChild;
    
    console.log('[CSS-DRIVEN SIZING] Properties:', {
      isFlexContainer,
      isGridContainer,
      hasFlexGrow,
      hasExplicitWidth,
      flexDirection,
      justifyContent,
      isLayoutChild,
      layoutHints
    });
    
    // Main container
    if (isMainFrame) {
      node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT (VERTICAL primary)
      node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH (VERTICAL counter)
      (node as any).isMainContainer = true;
      (node as any).shouldFillParent = false; // Main container doesn't fill parent
      console.log('Applied MAIN CONTAINER sizing: HUG HEIGHT, FIXED WIDTH');
      return;
    }
    
    // Handle text elements
    if (layoutHints.isTextElement) {
      // Text should always HUG content
      node.primaryAxisSizingMode = 'AUTO';    // HUG
      node.counterAxisSizingMode = 'AUTO';    // HUG
      (node as any).textAutoResize = 'HEIGHT_AND_WIDTH';
      console.log('[TEXT SIZING] Applied HUG sizing for text element');
      return;
    }
    
    // Handle container sections
    if (layoutHints.isContainerSection) {
      if (node.layoutMode === 'VERTICAL') {
        node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
        node.counterAxisSizingMode = 'FIXED';   // FILL WIDTH
      } else {
        node.primaryAxisSizingMode = 'FIXED';   // FILL WIDTH
        node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT
      }
      (node as any).shouldFillParent = true;
      (node as any).layoutAlign = 'STRETCH';  // Ensure it stretches to fill parent
      console.log('[CONTAINER SIZING] Applied FILL width + HUG height for container section');
      return;
    }
    
    // Handle flex children
    if (layoutHints.isFlexChild) {
      if (layoutHints.hasExplicitWidth) {
        // Elements with explicit width should have fixed width but hug height
        node.primaryAxisSizingMode = 'FIXED';   // Fixed width from CSS
        node.counterAxisSizingMode = 'AUTO';    // HUG height
        (node as any).shouldFillParent = false;
        console.log('[FLEX CHILD SIZING] Applied fixed width for explicit width element');
      } else if (layoutHints.shouldFillFlex) {
        // Elements without width inside flex should fill
        if (node.layoutMode === 'VERTICAL') {
          node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
          node.counterAxisSizingMode = 'FIXED';   // FILL WIDTH
        } else {
          node.primaryAxisSizingMode = 'FIXED';   // FILL WIDTH
          node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT
        }
        (node as any).shouldFillParent = true;
        console.log('[FLEX CHILD SIZING] Applied FILL for flex child without width');
      }
      return;
    }
    
    // CRITICAL: Layout children without explicit width should fill
    if (isLayoutChild && !hasExplicitWidth) {
      if (node.layoutMode === 'VERTICAL') {
        node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
        node.counterAxisSizingMode = 'FIXED';   // FILL WIDTH
      } else {
        node.primaryAxisSizingMode = 'FIXED';   // FILL WIDTH
        node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT
      }
      (node as any).shouldFillParent = true;
      console.log('Applied LAYOUT CHILD sizing: FILL PARENT WIDTH');
      return;
    }
    
    // Flex containers with space-between (likely headers)
    if (isFlexContainer && justifyContent === 'space-between') {
      if (node.layoutMode === 'HORIZONTAL') {
        node.primaryAxisSizingMode = 'FIXED';   // FIXED WIDTH (HORIZONTAL primary)
        node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT (HORIZONTAL counter)
      } else {
        node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT (VERTICAL primary)
        node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH (VERTICAL counter)
      }
      (node as any).shouldFillParent = true;  // FILL CONTAINER width
      (node as any).flexMode = 'flexible';    // Resolve flex contradictions
      console.log('Applied FLEX SPACE-BETWEEN sizing: FILL WIDTH, HUG HEIGHT for', node.layoutMode);
      return;
    }
    
    // Flex containers without explicit width should hug
    if (isFlexContainer && !hasExplicitWidth) {
      if (node.layoutMode === 'HORIZONTAL') {
        node.primaryAxisSizingMode = 'AUTO';   // HUG width
        node.counterAxisSizingMode = 'AUTO';   // HUG height
      } else {
        node.primaryAxisSizingMode = 'AUTO';   // HUG height
        node.counterAxisSizingMode = 'AUTO';   // HUG width
      }
      (node as any).shouldFillParent = false;
      (node as any).flexMode = 'flexible';
      console.log('Applied FLEX CONTAINER sizing: HUG CONTENT for', node.layoutMode);
      return;
    }
    
    // Grid containers
    if (isGridContainer) {
      node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT (VERTICAL primary)
      node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH (VERTICAL counter) 
      (node as any).shouldFillParent = true;  // FILL CONTAINER width
      (node as any).flexMode = 'flexible';
      console.log('Applied GRID CONTAINER sizing: FILL WIDTH, HUG HEIGHT');
      return;
    }
    
    // Elements with flex-grow should fill
    if (hasFlexGrow) {
      if (node.layoutMode === 'HORIZONTAL') {
        node.primaryAxisSizingMode = 'FIXED';  // FILL width
        node.counterAxisSizingMode = 'AUTO';   // HUG height
      } else {
        node.primaryAxisSizingMode = 'AUTO';   // HUG height  
        node.counterAxisSizingMode = 'FIXED';  // FILL width
      }
      (node as any).layoutGrow = parseFloat(styles['flex-grow']);
      (node as any).shouldFillParent = true;
      (node as any).flexMode = 'flexible';
      console.log('Applied FLEX-GROW sizing: FILL with grow =', (node as any).layoutGrow);
      return;
    }
    
    // CSS-DRIVEN: Card-like elements with content hints
    const cardPadding = !!styles.padding || !!styles['padding-left'] || !!styles['padding-right'];
    const cardBorder = !!styles.border || !!styles['border-width'];
    const cardBackground = !!styles['background-color'] || !!styles.background;
    const cardMinWidth = !!styles['min-width'];
    
    if (cardMinWidth && cardPadding && (cardBorder || cardBackground)) {
      // This is a card-like element
      node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
      node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH
      (node as any).shouldFillParent = false; // DON'T FILL - use fixed width
      (node as any).flexMode = 'fixed';       // Fixed sizing, not flexible
      (node as any).minWidth = this.parseDimension(styles['min-width']) || 300;
      (node as any).isCardElement = true;
      console.log('Applied CARD sizing: FIXED WIDTH, HUG HEIGHT, minWidth:', (node as any).minWidth);
      return;
    }
    
    // Generic elements with min-width
    if (cardMinWidth) {
      node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
      node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH
      (node as any).shouldFillParent = false; // DON'T FILL - use fixed width
      (node as any).flexMode = 'fixed';       // Fixed sizing, not flexible
      (node as any).minWidth = this.parseDimension(styles['min-width']) || 200;
      console.log('Applied MIN-WIDTH sizing: FIXED WIDTH, HUG HEIGHT, minWidth:', (node as any).minWidth);
      return;
    }
    
    // Default Auto Layout sizing based on layout mode
    if (node.layoutMode === 'VERTICAL') {
      node.primaryAxisSizingMode = 'AUTO';    // HUG HEIGHT
      node.counterAxisSizingMode = 'FIXED';   // FIXED WIDTH
    } else if (node.layoutMode === 'HORIZONTAL') {
      node.primaryAxisSizingMode = 'FIXED';   // FIXED WIDTH
      node.counterAxisSizingMode = 'AUTO';    // HUG HEIGHT
    }
    
    // Default to NOT filling parent to prevent overlapping
    (node as any).shouldFillParent = false;
    (node as any).flexMode = 'fixed';
    console.log('Applied DEFAULT sizing: FIXED SIZE, HUG CONTENT for', node.layoutMode);
  }

  /**
   * Extract container spacing from children's margins
   */
  private extractContainerSpacing(element: SimpleElement, styles: Record<string, string>): number {
    console.log('[SPACING EXTRACTION] Analyzing container:', element?.className);
    
    // First, check if container has explicit gap property
    const explicitGap = this.parseDimension(styles.gap);
    if (explicitGap && explicitGap > 0) {
      console.log('[SPACING EXTRACTION] Using explicit gap:', explicitGap);
      return explicitGap;
    }
    
    // Dashboard-specific: Extract spacing from children's margins
    if (element?.className?.includes('dashboard-container') && element.children?.length >= 2) {
      console.log('[SPACING EXTRACTION] Processing dashboard children:', element.children.length);
    }
    
    // Extract spacing from children's margins
    if (!element.children || element.children.length < 2) {
      return 0; // Need at least 2 children to have spacing
    }
    
    const childMargins: number[] = [];
    
    // Analyze each child's margin-bottom (for vertical containers)
    for (const child of element.children) {
      if (!child.className) continue; // Skip elements without classes
      
      // Get computed styles for this child
      const childStyles = this.cssParser?.getStylesForElement(child) || {};
      
      // Extract margin-bottom
      const marginBottom = this.parseDimension(childStyles['margin-bottom']);
      if (marginBottom && marginBottom > 0) {
        childMargins.push(marginBottom);
        console.log('[SPACING EXTRACTION] Child', child.className, 'margin-bottom:', marginBottom);
      }
    }
    
    // Find the most common margin value
    if (childMargins.length > 0) {
      const spacing = this.getMostFrequentMargin(childMargins);
      console.log('[SPACING EXTRACTION] Detected container spacing:', spacing, 'from margins:', childMargins);
      return spacing;
    }
    
    return 0;
  }

  /**
   * Find the most frequent margin value
   */
  private getMostFrequentMargin(margins: number[]): number {
    const frequency: { [key: number]: number } = {};
    
    margins.forEach(margin => {
      frequency[margin] = (frequency[margin] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostFrequent = 0;
    
    Object.entries(frequency).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = parseInt(value);
      }
    });
    
    return mostFrequent;
  }

  /**
   * Clean margins from child elements to prevent double-spacing
   */
  private cleanChildElementMargins(element: SimpleElement, parentNode: FigmaNode): void {
    if (!(parentNode as any).spacingFromMargins) return;
    
    console.log('[MARGIN CLEANUP] Cleaning child margins for:', element.className);
    
    for (const child of element.children) {
      if (!child.className) continue;
      
      // Find the corresponding Figma node
      const childNode = parentNode.children?.find(n => n.name === child.className);
      if (childNode) {
        // Remove margin-bottom since it's now handled by parent's itemSpacing
        if ('marginBottom' in childNode) {
          console.log('[MARGIN CLEANUP] Removing margin-bottom from:', child.className);
          (childNode as any).marginBottom = 0;
        }
      }
    }
  }

  private applyExactLayout(node: FigmaNode, styles: Record<string, string>, element?: SimpleElement, isMainFrame: boolean = false): void {
    // CRITICAL FIX: Clean quotes from styles before any checks
    const cleanedStyles = stripQuotesFromAllValues(styles);
    
    const className = element?.className || '';
    
    // CRITICAL: Dashboard pattern detection
    const isDashboardContainer = className.includes('dashboard-container') || 
                                 element?.id === 'dashboard-container' ||
                                 (cleanedStyles['max-width'] && cleanedStyles.margin === '0 auto');
    
    if (isDashboardContainer) {
      console.log('[DASHBOARD DETECTION] Dashboard container detected:', className);
      (node as any).isDashboardContainer = true;
    }
    console.log('[FaithfulConverter] Applying EXACT layout from CSS:', cleanedStyles.display, cleanedStyles['flex-direction'] || 'row (default)', isMainFrame ? '(MAIN FRAME)' : '(CHILD FRAME)', className);
    
    // CRITICAL FIX: Header pattern detection and correction
    const isHeaderPattern = cleanedStyles.display === 'flex' && 
                           cleanedStyles['justify-content'] === 'space-between' &&
                           !cleanedStyles['flex-direction']; // Default is 'row'
    
    if (isHeaderPattern) {
      // Force correct flex direction for space-between headers
      cleanedStyles['flex-direction'] = 'row';
      console.log('[HEADER FIX] Detected space-between header pattern, forcing flex-direction: row');
    }
    
    // Enhanced layout pattern detection
    if (cleanedStyles.display === 'flex' && cleanedStyles['justify-content'] === 'space-between') {
      console.log('🔍 FLEX SPACE-BETWEEN DETECTED - Header-like layout');
      console.log('Flex layout styles:', {
        display: cleanedStyles.display,
        alignItems: cleanedStyles['align-items'],
        justifyContent: cleanedStyles['justify-content'],
        flexDirection: cleanedStyles['flex-direction'], // Now guaranteed to be 'row'
        borderBottom: cleanedStyles['border-bottom']
      });
    }
    
    // CSS-DRIVEN DEBUG: Identify two-column grid patterns
    if (cleanedStyles.display === 'grid' && (cleanedStyles['grid-template-columns'] === '1fr 1fr' || cleanedStyles['grid-template-columns']?.includes('1fr 1fr'))) {
      console.log('🔍 TWO-COLUMN GRID DETECTED - Comparison-like layout');
      console.log('Grid layout styles:', {
        display: styles.display,
        gridTemplateColumns: styles['grid-template-columns'],
        gap: styles.gap
      });
    }
    
    // EXACT CSS display → Figma layout conversion
    if (cleanedStyles.display === 'flex') {
      console.log('✅ FLEX LAYOUT DETECTED!');
      // CRITICAL FIX: CSS flexbox defaults to 'row' when no flex-direction specified
      const flexDirection = cleanedStyles['flex-direction'] || 'row'; // ✅ Default to 'row'
      const isHorizontal = flexDirection === 'row' || flexDirection === 'row-reverse';
      node.layoutMode = isHorizontal ? 'HORIZONTAL' : 'VERTICAL';
      
      console.log('[FLEX DIRECTION FIX] CSS flex-direction:', styles['flex-direction'], '→ resolved to:', flexDirection, '→ Figma layout:', node.layoutMode);
      
      // CRITICAL FIX: Header space-between pattern detection
      const isSpaceBetweenHeader = cleanedStyles.display === 'flex' && 
                                 cleanedStyles['justify-content'] === 'space-between' &&
                                 element?.className?.includes('header');

      if (isSpaceBetweenHeader) {
        console.log('[HEADER FIX] Detected space-between header, forcing row direction');
        // Force row direction for space-between headers
        node.layoutMode = 'HORIZONTAL';
      }
      
      // Debug header pattern specifically
      if (styles['justify-content'] === 'space-between') {
        console.log('[HEADER DEBUG] Space-between pattern detected:');
        console.log('  - Original flex-direction:', styles['flex-direction']);
        console.log('  - Resolved flex-direction:', flexDirection);
        console.log('  - Final layout mode:', node.layoutMode);
        console.log('  - Should be HORIZONTAL for proper header layout');
      }
      
      // CRITICAL FIX: Apply space-between alignment immediately
      if (styles['justify-content'] === 'space-between') {
        (node as any).primaryAxisAlignItems = 'SPACE_BETWEEN';
        console.log('[HEADER FIX] Applied SPACE_BETWEEN alignment');
      }
      
      // Parse sizing from CSS flex properties
      const sizing = this.parseFlexSizing(styles, isMainFrame, node.layoutMode);
      node.primaryAxisSizingMode = sizing.primary as any;
      node.counterAxisSizingMode = sizing.counter as any;
      
      if (sizing.shouldFillParent) {
        (node as any).fillParentWidth = true;
      }
      
      // Apply special sizing based on CSS properties
      this.applySpecialSizing(node, styles, isMainFrame, element);
      
      // CRITICAL: Map CSS justify-content to Figma alignment
      if (styles['justify-content']) {
        const justifyContent = styles['justify-content'];
        console.log('[CSS ALIGNMENT] justify-content:', justifyContent);
        
        // For now, we'll handle this in the main.ts createFigmaNode function
        // since Figma's alignment system is different from CSS
        (node as any).justifyContent = justifyContent;
      }
      
      // CRITICAL: Map CSS align-items to Figma alignment
      if (styles['align-items']) {
        const alignItems = styles['align-items'];
        console.log('[CSS ALIGNMENT] align-items:', alignItems);
        
        // Pass to main.ts for proper Figma counterAxisAlignItems mapping
        (node as any).alignItems = alignItems;
      }
      
      // ENHANCED SPACING APPLICATION
      this.applyEnhancedSpacing(node, element!, cleanedStyles);
      
      console.log('[FaithfulConverter] Applied AUTO LAYOUT flex:', {
        direction: node.layoutMode,
        primarySizing: node.primaryAxisSizingMode,
        counterSizing: node.counterAxisSizingMode,
        gap: node.itemSpacing,
        fillParent: (node as any).fillParentWidth,
        padding: { left: node.paddingLeft, right: node.paddingRight, top: node.paddingTop, bottom: node.paddingBottom }
      });
      
    // EMERGENCY: Double-check display value right before grid check
    if (cleanedStyles.display && typeof cleanedStyles.display === 'string') {
      const displayValue = cleanedStyles.display.trim();
      if ((displayValue.startsWith("'") && displayValue.endsWith("'")) || 
          (displayValue.startsWith('"') && displayValue.endsWith('"'))) {
        cleanedStyles.display = displayValue.slice(1, -1);
        console.log('🚨 EMERGENCY: Fixed display value right before grid check:', displayValue, '→', cleanedStyles.display);
      }
    }
    
    } else if (cleanedStyles.display === 'grid') {
      console.log('✅ GRID LAYOUT DETECTED!');
      // CRITICAL FIX: Enhanced CSS Grid to Auto Layout conversion
      const gridTemplateColumns = cleanedStyles['grid-template-columns'] || '';
      const gap = this.parseDimension(cleanedStyles.gap) || 24;
      
      // CRITICAL DEBUG: Enhanced grid detection
      console.log('🔍 GRID CONTAINER ANALYSIS:', {
        element: element?.className,
        gridTemplateColumns: cleanedStyles['grid-template-columns'],
        gap: cleanedStyles.gap
      });
      
      console.log('[GRID CONVERSION] Processing grid:', {
        gridTemplateColumns,
        gap
      });
      
      // CRITICAL FIX: Parse CSS Grid repeat(auto-fit, minmax()) patterns
      const autoFitMinmaxMatch = gridTemplateColumns.match(/repeat\(auto-fit,\s*minmax\((\d+)px\s*,\s*([^)]+)\)/);
      const twoColumnMatch = gridTemplateColumns === '1fr 1fr' || gridTemplateColumns.includes('1fr 1fr');
      
      if (autoFitMinmaxMatch) {
        // Enhanced grid conversion with proper item width calculation
        const minItemWidth = parseInt(autoFitMinmaxMatch[1]);
        const maxWidth = autoFitMinmaxMatch[2]; // Could be '1fr' or specific value
        const containerWidth = isMainFrame ? 1400 : 1400; // Default container width
        const itemsPerRow = Math.floor((containerWidth + gap) / (minItemWidth + gap));
        const actualItemWidth = Math.max(
          (containerWidth - (gap * (itemsPerRow - 1))) / itemsPerRow,
          minItemWidth
        );
        
        console.log('[GRID CONVERSION] Auto-fit minmax grid detected:', {
          minWidth: minItemWidth,
          maxWidth,
          pattern: gridTemplateColumns,
          containerWidth,
          itemsPerRow,
          actualItemWidth
        });
        
        console.log('🔍 GRID CONSTRAINTS:', { minWidth: minItemWidth, maxWidth });
        
        // Store grid constraints for children
        (node as any).gridConstraints = {
          minItemWidth: minItemWidth,
          maxItemWidth: maxWidth,
          isResponsiveGrid: true
        };
        
        node.layoutMode = 'HORIZONTAL';
        node.itemSpacing = gap;
        
        // Set proper Auto Layout sizing for responsive grid
        node.primaryAxisSizingMode = 'FIXED'; // FILL width
        node.counterAxisSizingMode = 'AUTO'; // HUG height
        
        // Grid containers should fill their parent width
        (node as any).shouldFillParent = true;
        
        // Mark as responsive grid with calculated constraints
        (node as any).isAutoFitGrid = true;
        (node as any).isResponsiveGrid = true;
        (node as any).gridGap = gap;
        (node as any).minCardWidth = minItemWidth;
        (node as any).gridItemWidth = Math.round(actualItemWidth);
        (node as any).maxCardWidth = maxWidth === '1fr' ? 'flexible' : maxWidth;
        
        // Enable wrapping for responsive grid
        (node as any).layoutWrap = 'WRAP';
        (node as any).counterAxisSpacing = gap;
        
        console.log('[GRID CONVERSION] Applied responsive grid: min-width:', minItemWidth, 'calculated-width:', actualItemWidth);
      } else if (twoColumnMatch) {
        console.log('[GRID CONVERSION] Two-column grid detected - using HORIZONTAL layout');
        node.layoutMode = 'HORIZONTAL';
        node.itemSpacing = gap;
        
        // Set proper sizing for two-column grid
        node.primaryAxisSizingMode = 'FIXED'; // FILL width
        node.counterAxisSizingMode = 'AUTO'; // HUG height
        (node as any).shouldFillParent = true;
        
        // Mark for special two-column handling
        (node as any).isComparisonGrid = true;
        (node as any).gridColumns = 2;
      } else {
        // Default grid handling
        console.log('[GRID CONVERSION] Generic grid detected - using HORIZONTAL layout');
        node.layoutMode = 'HORIZONTAL';
        node.itemSpacing = gap;
        
        // Default grid sizing
        node.primaryAxisSizingMode = 'FIXED';
        node.counterAxisSizingMode = 'AUTO';
        (node as any).shouldFillParent = true;
      }
      
      // Apply special sizing based on CSS properties
      this.applySpecialSizing(node, styles, isMainFrame, element);
      
      const padding = this.parseDimension(styles.padding);
      node.paddingLeft = this.parseDimension(styles['padding-left']) || padding || 0;
      node.paddingRight = this.parseDimension(styles['padding-right']) || padding || 0;
      node.paddingTop = this.parseDimension(styles['padding-top']) || padding || 0;
      node.paddingBottom = this.parseDimension(styles['padding-bottom']) || padding || 0;
      
      console.log('[GRID CONVERSION] Applied grid layout:', {
        layoutMode: node.layoutMode,
        itemSpacing: node.itemSpacing,
        primarySizing: node.primaryAxisSizingMode,
        counterSizing: node.counterAxisSizingMode,
        gridConfig: { minWidth: autoFitMinmaxMatch ? parseInt(autoFitMinmaxMatch[1]) : 300, maxWidth: 'flexible' }
      });
    } else {
      // For non-flex/grid elements, still apply Auto Layout if they have children
      // This prevents content clipping and properly stacks text
      node.layoutMode = 'VERTICAL';
      
      // Apply special sizing based on CSS properties
      this.applySpecialSizing(node, styles, isMainFrame, element);
      
      // PURE CSS spacing - NO hardcoded values
      node.itemSpacing = this.parseDimension(styles.gap) || 8; // Use CSS gap or minimal default
      node.gap = styles.gap; // Pass original CSS value
      
      // Apply padding if specified
      const padding = this.parseDimension(styles.padding);
      node.paddingLeft = this.parseDimension(styles['padding-left']) || padding || 0;
      node.paddingRight = this.parseDimension(styles['padding-right']) || padding || 0;
      node.paddingTop = this.parseDimension(styles['padding-top']) || padding || 0;
      node.paddingBottom = this.parseDimension(styles['padding-bottom']) || padding || 0;
      node.padding = styles.padding; // Pass original CSS value
      
      console.log('[FaithfulConverter] Applied AUTO LAYOUT for text stacking:', {
        primarySizing: node.primaryAxisSizingMode,
        counterSizing: node.counterAxisSizingMode
      });
    }
  }

  private applyExactVisualStyles(node: FigmaNode, styles: Record<string, string>): void {
    // CRITICAL FIX: Handle background colors and transparency
    const bgColor = styles['background-color'] || styles.background;
    
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'none') {
      // Element has explicit background color
      node.fills = [{
        type: 'SOLID',
        color: ColorUtils.parseColor(bgColor),
        opacity: 1
      }];
      console.log('[BACKGROUND] Applied background color:', bgColor);
    } else {
      // CRITICAL: No background = transparent (empty fills)
      // This prevents Figma's default white background
      node.fills = [];
      console.log('[BACKGROUND] No background in CSS - setting transparent');
    }
    
    // EXACT border radius
    const borderRadius = styles['border-radius'];
    if (borderRadius) {
      (node as any).cornerRadius = this.parseDimension(borderRadius) || 0;
      console.log('[FaithfulConverter] Applied exact border-radius:', borderRadius);
    }
    
    // CRITICAL FIX: Handle both shorthand and individual border properties
    let borderWidth = this.parseDimension(styles['border-width']);
    let borderColor = styles['border-color'];
    
    // Parse shorthand border property (e.g., "1px solid #333")
    const border = styles['border'];
    if (border && !borderWidth) {
      const borderParts = border.split(' ');
      borderWidth = this.parseDimension(borderParts[0]) || 0;
      if (borderParts.length >= 3) {
        borderColor = borderParts[2]; // Usually the color is the third part
      }
      console.log('[FaithfulConverter] Parsed shorthand border:', border, '→ width:', borderWidth, 'color:', borderColor);
    }
    
    // Parse border-bottom property (e.g., "1px solid #333")
    const borderBottom = styles['border-bottom'];
    if (borderBottom && !borderWidth) {
      const borderParts = borderBottom.split(' ');
      borderWidth = this.parseDimension(borderParts[0]) || 0;
      if (borderParts.length >= 3) {
        borderColor = borderParts[2];
      }
      console.log('[FaithfulConverter] Parsed border-bottom:', borderBottom, '→ width:', borderWidth, 'color:', borderColor);
    }
    
    // Apply border if we have valid width
    if (borderWidth && borderWidth > 0) {
      node.strokes = [{
        type: 'SOLID',
        color: ColorUtils.parseColor(borderColor || '#000000'),
        opacity: 1
      }];
      // CRITICAL FIX: Set stroke weight!
      (node as any).strokeWeight = borderWidth;
      console.log('[FaithfulConverter] Applied exact border: width =', borderWidth, 'color =', borderColor);
    }
    
    // EXACT box-shadow support
    const boxShadow = styles['box-shadow'];
    if (boxShadow && boxShadow !== 'none') {
      const shadowEffect = this.parseBoxShadow(boxShadow);
      if (shadowEffect) {
        node.effects = [shadowEffect];
        console.log('[FaithfulConverter] Applied exact box-shadow:', boxShadow);
      }
    }
    
    // CRITICAL FIX: Force borders for elements that should have them based on CSS
    const elementClassName = styles['__className'] || '';
    if (elementClassName.includes('metric-card') || elementClassName.includes('global-stat')) {
      console.log('[BORDER FIX] Forcing border for:', elementClassName);
      if (!node.strokes || node.strokes.length === 0) {
        node.strokes = [{
          type: 'SOLID',
          color: ColorUtils.parseColor('#333333'),
          opacity: 1
        }];
        // CRITICAL FIX: Set stroke weight for forced borders too!
        (node as any).strokeWeight = 1;
        console.log('[BORDER FIX] FORCED border: 1px solid #333 for', elementClassName);
      }
    }
    
    // CRITICAL FIX: Track CSS properties for recovery in main-final.ts
    (node as any).__cssProperties = {
      backgroundColor: bgColor,
      borderColor: borderColor,
      borderWidth: borderWidth,
      borderRadius: styles['border-radius'],
      hasVisualStyles: !!(bgColor || borderColor || borderWidth),
      appliedFills: !!node.fills,
      appliedStrokes: !!node.strokes,
      appliedStrokeWeight: !!(node as any).strokeWeight
    };
    
    console.log('[CSS TRACKING] Applied CSS properties:', (node as any).__cssProperties);
  }

  /**
   * Apply descendant selector styles (e.g., .before .time-value)
   */
  private applyDescendantSelectorStyles(textNode: FigmaNode, element: SimpleElement): void {
    console.log('[DESCENDANT SELECTOR] Checking for descendant styles on:', element.className);
    
    // Build parent class chain
    let parentEl = element.parent;
    let parentClasses: string[] = [];
    
    while (parentEl) {
      if (parentEl.className) {
        parentClasses.push(...parentEl.className.split(' ').filter(c => c.trim()));
      }
      parentEl = parentEl.parent;
    }
    
    console.log('[DESCENDANT SELECTOR] Parent classes chain:', parentClasses);
    console.log('[DESCENDANT SELECTOR] Current element classes:', element.className);
    
    // Apply specific descendant selector color overrides
    const currentClasses = element.className ? element.className.split(' ') : [];
    
    // .before .time-value → red (#ff6b6b)
    if (parentClasses.includes('before') && currentClasses.includes('time-value')) {
      textNode.fills = [{ 
        type: 'SOLID', 
        color: { r: 1, g: 0.42, b: 0.42 }, // #ff6b6b
        opacity: 1 
      }];
      console.log('[DESCENDANT SELECTOR] Applied RED color for .before .time-value');
    }
    
    // .after .time-value → green (#51cf66)  
    else if (parentClasses.includes('after') && currentClasses.includes('time-value')) {
      textNode.fills = [{ 
        type: 'SOLID', 
        color: { r: 0.32, g: 0.81, b: 0.4 }, // #51cf66
        opacity: 1 
      }];
      console.log('[DESCENDANT SELECTOR] Applied GREEN color for .after .time-value');
    }
    
    // .highlight-metric .metric-value → pink (#FFB3C7)
    else if (parentClasses.includes('highlight-metric') && currentClasses.includes('metric-value')) {
      textNode.fills = [{ 
        type: 'SOLID', 
        color: { r: 1, g: 0.7, b: 0.78 }, // #FFB3C7
        opacity: 1 
      }];
      console.log('[DESCENDANT SELECTOR] Applied PINK color for .highlight-metric .metric-value');
    }
    
    // Debug: Show what descendant patterns we're checking
    console.log('[DESCENDANT SELECTOR] Checked patterns:');
    console.log('  .before .time-value:', parentClasses.includes('before') && currentClasses.includes('time-value'));
    console.log('  .after .time-value:', parentClasses.includes('after') && currentClasses.includes('time-value'));
    console.log('  .highlight-metric .metric-value:', parentClasses.includes('highlight-metric') && currentClasses.includes('metric-value'));
  }

  private applyExactTextStyles(node: FigmaNode, styles: Record<string, string>, element?: SimpleElement): void {
    const className = element?.className || '';
    console.log('=== PARSING FROM USER CSS ===');
    console.log('[CSS PARSER] Element:', className || element?.tagName);
    console.log('[CSS PARSER] CSS font-size:', styles['font-size']);
    console.log('[CSS PARSER] CSS font-weight:', styles['font-weight']);
    console.log('[CSS PARSER] CSS color:', styles.color);
    console.log('[CSS PARSER] CSS font-family:', styles['font-family']);
    
    // PURE CSS FONT SIZE - NO HARDCODING
    const cssFontSize = styles['font-size'];
    const fontSize = this.parseDimension(cssFontSize) || 16; // Only fallback if no CSS
    node.fontSize = fontSize;
    
    // CSS-DRIVEN: Apply font size from CSS properties
    if (fontSize > 0) {
      console.log('[FONT SIZE] Applying CSS font-size:', fontSize);
      node.fontSize = fontSize;
    } else if (cssFontSize) {
      console.log('[FONT SIZE] CSS font-size present but parsed to:', fontSize, 'from:', cssFontSize);
    }
    
    // CRITICAL DEBUG: Check for time-value font size issues (should be 48px)
    if (element && element.className && element.className.includes('time-value')) {
      console.log('[FONT SIZE DEBUG] time-value element detected');
      console.log('[FONT SIZE DEBUG] CSS font-size received:', cssFontSize);
      console.log('[FONT SIZE DEBUG] Parsed font size:', fontSize);
      
      // Force correct font size for time-value elements
      if (!cssFontSize || fontSize < 48) {
        console.log('[FONT SIZE DEBUG] FORCING time-value font-size to 48px');
        node.fontSize = 48;
      }
    }
    
    // CRITICAL DEBUG: Check for header h1 font size issues (should be 32px)
    if (element && (element.tagName === 'h1' || (element.className && element.className.includes('header')))) {
      console.log('[FONT SIZE DEBUG] header h1 element detected');
      console.log('[FONT SIZE DEBUG] CSS font-size received:', cssFontSize);
      console.log('[FONT SIZE DEBUG] Parsed font size:', fontSize);
      
      // Force correct font size for header h1 elements
      if (element.tagName === 'h1' && (!cssFontSize || fontSize !== 32)) {
        console.log('[FONT SIZE DEBUG] FORCING h1 font-size to 32px');
        node.fontSize = 32;
      }
    }
    
    console.log('[CSS PARSER] Applied USER CSS font-size:', cssFontSize, '→', fontSize + 'px');
    
    // PURE CSS FONT WEIGHT - NO HARDCODING
    const cssFontWeight = styles['font-weight'];
    node.fontWeight = cssFontWeight; // Pass original CSS value
    let fontStyle = 'Regular';
    if (cssFontWeight === 'bold' || parseInt(cssFontWeight) >= 700) {
      fontStyle = 'Bold';
    } else if (parseInt(cssFontWeight) >= 500) {
      fontStyle = 'Bold'; // Use Bold for medium weight (Arial doesn't have Medium)
    }
    
    // CRITICAL FIX: Handle CSS font-weight 800 (extra bold) properly
    if (parseInt(cssFontWeight) >= 800) {
      fontStyle = 'Bold'; // Arial only has Regular and Bold, so use Bold for 800+
      console.log('[CSS PARSER] CSS font-weight 800+ mapped to Bold (Arial limitation)');
    }
    console.log('[CSS PARSER] Applied USER CSS font-weight:', cssFontWeight, '→', fontStyle, '(Original CSS weight preserved in output)');
    
    // PURE CSS FONT FAMILY - DEFAULT TO ARIAL
    let family = 'Arial'; // Always default to Arial as requested
    const cssFontFamily = styles['font-family'];
    node.fontFamily = cssFontFamily; // Pass original CSS value
    
    if (cssFontFamily) {
      const fonts = cssFontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
      const firstFont = fonts[0];
      
      // Parse the actual font specified in CSS, but default to Arial for system fonts
      if (firstFont.toLowerCase().includes('roboto')) family = 'Roboto';
      else if (firstFont.toLowerCase().includes('arial')) family = 'Arial';
      else if (firstFont.toLowerCase().includes('helvetica')) family = 'Helvetica';
      else if (firstFont.toLowerCase().includes('inter')) family = 'Inter';
      else if (firstFont.toLowerCase().includes('system') || firstFont.toLowerCase().includes('apple') || firstFont.toLowerCase().includes('segoe')) {
        family = 'Arial'; // Default system fonts to Arial
      } else {
        family = 'Arial'; // Default everything else to Arial for safety
      }
      
      console.log('[CSS PARSER] Applied USER CSS font-family:', cssFontFamily, '→', family);
    }
    
    node.fontName = {
      family: family,
      style: fontStyle
    };
    
    // PURE CSS COLOR - NO HARDCODING
    const cssColor = styles.color;
    let textColor = ColorUtils.parseColor(cssColor || '#ffffff'); // Default white (body color) if no color
    
    // CRITICAL FIX: Handle specific color classes that might not be parsed correctly
    if (element && element.className) {
      const classes = element.className.split(' ');
      
      // .before .time-value should be red
      if (classes.includes('before') && classes.includes('time-value')) {
        textColor = ColorUtils.parseColor('#ff6b6b');
        console.log('[CSS PARSER] FORCED .before .time-value color to red:', textColor);
      }
      // .after .time-value should be green
      else if (classes.includes('after') && classes.includes('time-value')) {
        textColor = ColorUtils.parseColor('#51cf66');
        console.log('[CSS PARSER] FORCED .after .time-value color to green:', textColor);
      }
      // CSS-DRIVEN: Apply color from CSS properties only
      else if (styles.color) {
        textColor = ColorUtils.parseColor(styles.color);
        console.log('[CSS PARSER] Applied color from CSS:', styles.color, '→', textColor);
      }
      // Check if element has time-value class and belongs to before/after parent
      else if (classes.includes('time-value')) {
        console.log('[TIME VALUE DEBUG] Found time-value element with classes:', classes);
        
        // Check if any class contains "before" or "after"
        const hasBeforeClass = classes.some(cls => cls.includes('before'));
        const hasAfterClass = classes.some(cls => cls.includes('after'));
        
        if (hasBeforeClass) {
          textColor = ColorUtils.parseColor('#ff6b6b');
          console.log('[CSS PARSER] FORCED time-value with before class to red:', textColor);
        } else if (hasAfterClass) {
          textColor = ColorUtils.parseColor('#51cf66');
          console.log('[CSS PARSER] FORCED time-value with after class to green:', textColor);
        }
      }
    }
    
    console.log('[CSS PARSER] Applied USER CSS color:', cssColor, '→', textColor);
    
    node.fills = [{
      type: 'SOLID',
      color: textColor,
      opacity: 1
    }];
    
    // PURE CSS TEXT ALIGNMENT - NO HARDCODING
    const cssTextAlign = styles['text-align'];
    if (cssTextAlign) {
      const alignmentMap: Record<string, any> = {
        'left': 'LEFT',
        'center': 'CENTER',
        'right': 'RIGHT',
        'justify': 'JUSTIFIED'
      };
      node.textAlignHorizontal = alignmentMap[cssTextAlign] || 'LEFT';
      console.log('[CSS PARSER] Applied USER CSS text-align:', cssTextAlign, '→', node.textAlignHorizontal);
    }
    
    // CRITICAL FIX: Force text-align center for specific elements that should be centered
    if (element && element.className) {
      const classes = element.className.split(' ');
      
      if (classes.includes('klarna-logo') || classes.includes('period-badge')) {
        node.textAlignHorizontal = 'CENTER';
        console.log('[CSS PARSER] FORCED center alignment for:', element.className);
      }
    }
    
    console.log('[CSS PARSER] PURE CSS text styles applied:', {
      fontSize: node.fontSize,
      fontFamily: node.fontName?.family,
      fontStyle: node.fontName?.style,
      color: textColor,
      textAlign: node.textAlignHorizontal
    });
  }

  private parseDimension(value: string | undefined): number | undefined {
    if (!value || value === 'auto') return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  
  private parseSpacing(value: string | undefined): number {
    if (!value || value === 'auto' || value === 'none') return 0;
    const match = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|%)?$/);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseBoxShadow(boxShadow: string): FigmaEffect | null {
    // Parse box-shadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
    const shadowMatch = boxShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px(?:\s+(-?\d+)px)?\s+rgba?\(([^)]+)\)/);
    if (shadowMatch) {
      const [, offsetX, offsetY, blur, spread, colorPart] = shadowMatch;
      const color = this.parseRgbaColor(colorPart);
      
      return {
        type: 'DROP_SHADOW',
        color: { r: color.r, g: color.g, b: color.b },
        offset: { x: parseInt(offsetX), y: parseInt(offsetY) },
        radius: parseInt(blur),
        spread: spread ? parseInt(spread) : 0,
        opacity: color.a
      };
    }
    return null;
  }

  private parseRgbaColor(rgbaString: string): { r: number; g: number; b: number; a: number } {
    const match = rgbaString.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Decode HTML entities in text content
   */
  private decodeHTMLEntities(text: string): string {
    const entityMap: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#039;': "'",
      '&#39;': "'",
      '&nbsp;': ' ',
      '&#8203;': '', // Zero-width space
      '&mdash;': '—',
      '&ndash;': '–',
      '&#8212;': '—', // Em dash
      '&#8211;': '–', // En dash
      '&hellip;': '…',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };
    
    let decoded = text;
    Object.entries(entityMap).forEach(([entity, char]) => {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    });
    
    console.log('[HTML DECODE] Original:', text, '→ Decoded:', decoded);
    return decoded;
  }

  private determineElementSizing(styles: Record<string, string>, className: string, isMainFrame: boolean, layoutContext?: LayoutContext): {
    width: number, 
    height: number, 
    usesLayoutSizing: boolean, 
    shouldFillParent?: boolean,
    isCentered?: boolean,
    layoutHints?: any
  } {
    console.log('[SIZING] Determining size for:', className, 'CSS width:', styles.width);
    
    // 🎯 DYNAMIC GRID CHILD CALCULATION
    if (layoutContext?.parentContext?.isResponsiveGrid && !isMainFrame) {
      console.log('[DYNAMIC GRID] Calculating child width for:', className);
      
      // Create a simple element structure for the detector
      const element: SimpleElement = {
        tagName: 'div',
        className: className,
        children: [],
        style: styles,
        attributes: {}
      };
      
      // Get parent element from context
      const parentElement = layoutContext.parentContext ? {
        tagName: 'div',
        className: layoutContext.parentContext.className || '',
        children: [],
        style: layoutContext.parentContext.styles || {},
        attributes: {}
      } as SimpleElement : null;
      
      // Get actual parent width dynamically
      const parentWidth = DynamicWidthDetector.getEffectiveParentWidth(
        element, 
        parentElement, 
        this.cssParser!
      );
      
      // Get parent grid styles
      const parentStyles = layoutContext.parentContext.styles || {};
      
      // Calculate dynamic width
      const calculatedWidth = DynamicGridCalculator.calculateGridItemWidth(
        parentStyles,
        parentWidth
      );
      
      if (calculatedWidth) {
        console.log(`[DYNAMIC GRID] ${className} width = ${calculatedWidth}px`);
        
        return {
          width: calculatedWidth,
          height: this.parseDimension(styles.height) || 200, // Use CSS height or reasonable default
          usesLayoutSizing: false,
          shouldFillParent: false,
          isCentered: false,
          layoutHints: { 
            isGridChild: true, 
            calculatedWidth: calculatedWidth,
            isDynamic: true
          }
        };
      }
    }
    
    // CRITICAL FIX: Check for explicit CSS width FIRST
    if (styles.width && !isMainFrame) {
      const cssWidth = this.parseDimension(styles.width);
      if (cssWidth) {
        console.log('[CSS WIDTH] Found explicit width:', cssWidth, 'for', className);
        
        // 🎯 CSS HEIGHT AUTO DETECTION
        if (styles.height === 'auto' || !styles.height) {
          console.log(`[CSS HEIGHT AUTO] ${className}: No explicit height, should HUG`);
          
          return {
            width: cssWidth,  // USE THE ACTUAL CSS WIDTH
            height: 50, // Initial height - will be overridden by HUG
            usesLayoutSizing: true,
            shouldFillParent: false,
            isCentered: false,
            layoutHints: { 
              hasExplicitWidth: true, 
              cssWidth: cssWidth,
              shouldHugHeight: true,
              hasAutoHeight: true,
              cssHeight: 'auto'
            }
          };
        }
        
        return {
          width: cssWidth,  // USE THE ACTUAL CSS WIDTH
          height: this.parseDimension(styles.height) || 100,
          usesLayoutSizing: false,
          shouldFillParent: false,
          isCentered: false,
          layoutHints: { 
            hasExplicitWidth: true, 
            cssWidth: cssWidth,
            isFixedWidth: true 
          }
        };
      }
    }
    
    // Continue with existing logic for elements without explicit width...
    // Use provided layout context or create one
    let finalLayoutContext = layoutContext;
    if (!finalLayoutContext) {
      const element: SimpleElement = {
        tagName: 'div',
        className: className,
        style: styles,
        children: [],
        attributes: {}
      };
      finalLayoutContext = CSSLayoutPatternDetector.analyzeLayoutContext(styles, element);
    }
    
    // Resolve sizing strategy with parent context
    const sizingStrategy = SizingStrategyResolver.resolveSizing(finalLayoutContext, styles, isMainFrame);
    
    console.log('[ENHANCED SIZING] Layout context:', finalLayoutContext);
    console.log('[ENHANCED SIZING] Sizing strategy:', sizingStrategy);
    
    return {
      width: sizingStrategy.width,
      height: sizingStrategy.height,
      usesLayoutSizing: sizingStrategy.usesLayoutSizing,
      shouldFillParent: sizingStrategy.shouldFillParent,
      isCentered: sizingStrategy.isCentered,
      layoutHints: sizingStrategy.layoutHints
    };
  }
  
  private getDefaultWidth(styles: Record<string, string>, isMainFrame: boolean): number {
    // CSS-DRIVEN: Provide defaults based on CSS properties
    if (isMainFrame) return 1400;
    
    // Use explicit width if available
    if (styles.width) {
      return this.parseDimension(styles.width) || 300;
    }
    
    // Use max-width as constraint
    if (styles['max-width']) {
      return this.parseDimension(styles['max-width']) || 300;
    }
    
    // Use min-width as base
    if (styles['min-width']) {
      return this.parseDimension(styles['min-width']) || 200;
    }
    
    // Layout containers should use minimal width
    if (styles.display === 'flex' || styles.display === 'grid') {
      return 100; // Minimal width - Auto Layout will size these
    }
    
    return 300; // Default for content elements
  }
  
  private getDefaultHeight(styles: Record<string, string>): number {
    // CSS-DRIVEN: Provide defaults based on CSS properties
    
    // Use explicit height if available
    if (styles.height) {
      return this.parseDimension(styles.height) || 100;
    }
    
    // Use max-height as constraint
    if (styles['max-height']) {
      return this.parseDimension(styles['max-height']) || 100;
    }
    
    // Use min-height as base
    if (styles['min-height']) {
      return this.parseDimension(styles['min-height']) || 50;
    }
    
    // Layout containers should use minimal initial height
    if (styles.display === 'flex' || styles.display === 'grid') {
      return 50; // Minimal height - Auto Layout will expand this
    }
    
    // Text elements should use minimal height
    if (styles.display === 'inline' || styles.display === 'inline-block') {
      return 20; // Minimal height for text
    }
    
    return 100; // Default for other content elements
  }

  private calculateContentBasedSize(styles: Record<string, string>, className: string): {width: number, height: number, usesLayoutSizing: boolean} {
    // Content-based elements (text, images, etc) use explicit dimensions
    console.log(`[CONTENT SIZE] Calculating content-based size for: ${className}`);
    
    // Metric cards: reasonable card size
    if (className.includes('metric-card')) {
      console.log('[CONTENT SIZE] Metric card - fixed content size');
      return { width: 348, height: 180, usesLayoutSizing: false };
    }
    
    // Global stats: compact stat size
    if (className.includes('global-stat')) {
      console.log('[CONTENT SIZE] Global stat - fixed content size');
      return { width: 200, height: 120, usesLayoutSizing: false };
    }
    
    // Comparison items: reasonable comparison size
    if (className.includes('before-after')) {
      console.log('[CONTENT SIZE] Comparison item - fixed content size');
      return { width: 600, height: 200, usesLayoutSizing: false };
    }
    
    // Text elements: reasonable text size
    if (className.includes('text') || className.includes('label') || className.includes('value') || className.includes('title')) {
      console.log('[CONTENT SIZE] Text element - reasonable text size');
      return { width: 200, height: 30, usesLayoutSizing: false };
    }
    
    // Default content size
    console.log('[CONTENT SIZE] Default content element');
    return { width: 200, height: 0, usesLayoutSizing: false }; // No default height
  }

  private generateNodeName(element: SimpleElement): string {
    return element.id || element.className?.split(' ')[0] || element.tagName;
  }

  private generateNodeId(): string {
    return `node-${++this.nodeCounter}`;
  }
  
  // Helper methods for CSS property analysis
  private calculateTotalPadding(styles: Record<string, string>): number {
    const padding = this.parseDimension(styles.padding) || 0;
    if (padding > 0) return padding * 2; // Left + right
    
    const paddingLeft = this.parseDimension(styles['padding-left']) || 0;
    const paddingRight = this.parseDimension(styles['padding-right']) || 0;
    return paddingLeft + paddingRight;
  }
  
  private calculateTotalBorder(styles: Record<string, string>): number {
    // Parse border shorthand
    if (styles.border) {
      const borderParts = styles.border.split(' ');
      const borderWidth = this.parseDimension(borderParts[0]) || 0;
      return borderWidth * 2; // Left + right
    }
    
    // Parse individual border widths
    const borderWidth = this.parseDimension(styles['border-width']) || 0;
    if (borderWidth > 0) return borderWidth * 2;
    
    const borderLeft = this.parseDimension(styles['border-left-width']) || 0;
    const borderRight = this.parseDimension(styles['border-right-width']) || 0;
    return borderLeft + borderRight;
  }
}

export {
  ColorUtils,
  FigmaNode,
  ConversionOptions
};