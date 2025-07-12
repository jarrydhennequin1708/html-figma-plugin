// Shared type definitions for the HTML to Figma converter

export interface ComputedElementData {
  tagName: string;
  textContent?: string;
  rect: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  computedStyles: {
    // Layout
    display: string;
    position: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    flexWrap: string;
    gap: string;
    
    // Sizing
    width: string;
    height: string;
    minWidth: string;
    maxWidth: string;
    minHeight: string;
    maxHeight: string;
    flexGrow: string;
    flexShrink: string;
    flexBasis: string;
    
    // Spacing
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    
    // Visual
    backgroundColor: string;
    backgroundImage: string;
    opacity: string;
    
    // Border
    borderTopWidth: string;
    borderRightWidth: string;
    borderBottomWidth: string;
    borderLeftWidth: string;
    borderTopColor: string;
    borderRightColor: string;
    borderBottomColor: string;
    borderLeftColor: string;
    borderTopLeftRadius: string;
    borderTopRightRadius: string;
    borderBottomRightRadius: string;
    borderBottomLeftRadius: string;
    
    // Text
    color: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    lineHeight: string;
    letterSpacing: string;
    textAlign: string;
    textTransform: string;
    
    // Effects
    boxShadow: string;
    filter: string;
  };
  children: ComputedElementData[];
}

export interface FigmaNodeData {
  type: 'FRAME' | 'TEXT' | 'GROUP';
  name?: string;
  // Position and size
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  
  // Visual properties
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  cornerRadius?: number;
  strokeWeight?: number;
  
  // Text specific
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  textAlignHorizontal?: string;
  lineHeight?: any;
  letterSpacing?: any;
  
  // Auto Layout
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  layoutAlign?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutWrap?: string;
  
  // Children
  children?: FigmaNodeData[];
}