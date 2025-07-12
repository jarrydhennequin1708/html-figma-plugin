// Utility functions for parsing CSS values

export function parsePixelValue(value: string): number {
  if (!value || value === 'auto' || value === 'none') return 0;
  const match = value.match(/([\d.]+)px/);
  return match ? parseFloat(match[1]) : 0;
}

export function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === 'transparent' || color === 'none' || color === 'rgba(0, 0, 0, 0)') return null;
  
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]) / 255,
      g: parseInt(rgbMatch[2]) / 255,
      b: parseInt(rgbMatch[3]) / 255,
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
    };
  }
  
  // Handle hex
  const hexMatch = color.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16) / 255,
        g: parseInt(hex[1] + hex[1], 16) / 255,
        b: parseInt(hex[2] + hex[2], 16) / 255,
        a: 1
      };
    } else {
      return {
        r: parseInt(hex.substr(0, 2), 16) / 255,
        g: parseInt(hex.substr(2, 2), 16) / 255,
        b: parseInt(hex.substr(4, 2), 16) / 255,
        a: 1
      };
    }
  }
  
  return null;
}

export function parseBorderRadius(
  topLeft: string, 
  topRight: string, 
  bottomRight: string, 
  bottomLeft: string
): number {
  // Return single radius if all corners are the same
  const tl = parsePixelValue(topLeft);
  const tr = parsePixelValue(topRight);
  const br = parsePixelValue(bottomRight);
  const bl = parsePixelValue(bottomLeft);
  
  if (tl === tr && tr === br && br === bl) {
    return tl;
  }
  
  // For now, return average (Figma doesn't support individual corners in the same way)
  return (tl + tr + br + bl) / 4;
}

export function parseBoxShadow(boxShadow: string): any[] {
  if (!boxShadow || boxShadow === 'none') return [];
  
  const shadows: any[] = [];
  
  // Handle multiple shadows
  const shadowParts = boxShadow.split(/,(?![^(]*\))/);
  
  for (const shadow of shadowParts) {
    // Match: [inset] offsetX offsetY blur [spread] color
    const match = shadow.match(/(inset\s+)?([-\d.]+)px\s+([-\d.]+)px\s+([\d.]+)px\s*([-\d.]+px)?\s*(rgba?\([^)]+\)|#[0-9a-f]+|\w+)/i);
    
    if (match) {
      const isInset = !!match[1];
      const offsetX = parseFloat(match[2]);
      const offsetY = parseFloat(match[3]);
      const blur = parseFloat(match[4]);
      const spread = match[5] ? parseFloat(match[5]) : 0;
      const colorStr = match[6];
      
      const color = parseColor(colorStr);
      if (color) {
        shadows.push({
          type: isInset ? 'INNER_SHADOW' : 'DROP_SHADOW',
          color: { r: color.r, g: color.g, b: color.b },
          offset: { x: offsetX, y: offsetY },
          radius: blur,
          spread: spread,
          visible: true,
          blendMode: 'NORMAL'
        });
      }
    }
  }
  
  return shadows;
}

export function parseFontFamily(fontFamily: string): string {
  // Extract first font and map to available Figma fonts
  const fonts = fontFamily.split(',').map(f => f.trim().replace(/["']/g, ''));
  const firstFont = fonts[0].toLowerCase();
  
  // Map common fonts to Figma equivalents
  if (firstFont.includes('arial') || firstFont.includes('helvetica')) {
    return 'Arial';
  } else if (firstFont.includes('roboto')) {
    return 'Roboto';
  } else if (firstFont.includes('inter')) {
    return 'Inter';
  } else if (firstFont.includes('system') || firstFont.includes('-apple-system')) {
    return 'Inter'; // Default system font
  }
  
  return 'Inter'; // Default fallback
}

export function parseFontWeight(fontWeight: string): string {
  const weight = parseInt(fontWeight) || 400;
  
  if (weight >= 700) return 'Bold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

export function parseTextAlign(textAlign: string): 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED' {
  switch (textAlign) {
    case 'right': return 'RIGHT';
    case 'center': return 'CENTER';
    case 'justify': return 'JUSTIFIED';
    default: return 'LEFT';
  }
}

export function parseLineHeight(lineHeight: string, fontSize: number): any {
  if (!lineHeight || lineHeight === 'normal') {
    return { unit: 'AUTO' };
  }
  
  // Handle unitless values (multipliers)
  const unitless = parseFloat(lineHeight);
  if (!isNaN(unitless) && lineHeight.indexOf('px') === -1 && lineHeight.indexOf('%') === -1) {
    return {
      unit: 'PIXELS',
      value: unitless * fontSize
    };
  }
  
  // Handle pixel values
  const pixels = parsePixelValue(lineHeight);
  if (pixels > 0) {
    return {
      unit: 'PIXELS',
      value: pixels
    };
  }
  
  // Handle percentage
  const percentMatch = lineHeight.match(/([\d.]+)%/);
  if (percentMatch) {
    return {
      unit: 'PERCENT',
      value: parseFloat(percentMatch[1])
    };
  }
  
  return { unit: 'AUTO' };
}

export function parseLetterSpacing(letterSpacing: string): any {
  if (!letterSpacing || letterSpacing === 'normal') {
    return { unit: 'PIXELS', value: 0 };
  }
  
  const pixels = parsePixelValue(letterSpacing);
  if (pixels !== 0) {
    return {
      unit: 'PIXELS',
      value: pixels
    };
  }
  
  // Handle em values
  const emMatch = letterSpacing.match(/([-\d.]+)em/);
  if (emMatch) {
    return {
      unit: 'PERCENT',
      value: parseFloat(emMatch[1]) * 100
    };
  }
  
  return { unit: 'PIXELS', value: 0 };
}