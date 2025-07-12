// Comprehensive CSS color parser utility

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseColor(cssColor: string): RGB | null {
  if (!cssColor || cssColor === 'transparent') return null;
  
  // Remove spaces and lowercase
  const color = cssColor.replace(/\s/g, '').toLowerCase();
  
  // 3-digit hex: #rgb
  if (/^#[0-9a-f]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split('').map(c => 
      parseInt(c + c, 16) / 255
    );
    return { r, g, b };
  }
  
  // 6-digit hex: #rrggbb
  if (/^#[0-9a-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  
  // 8-digit hex: #rrggbbaa (ignore alpha)
  if (/^#[0-9a-f]{8}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  
  // rgb(r, g, b) or rgb(r g b)
  const rgbMatch = color.match(/^rgb\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\)$/);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255
    };
  }
  
  // rgba(r, g, b, a) - ignore alpha
  const rgbaMatch = color.match(/^rgba\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\s*,?\s*[\d.]+\)$/);
  if (rgbaMatch) {
    const [_, r, g, b] = rgbaMatch;
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255
    };
  }
  
  // hsl/hsla conversion
  const hslMatch = color.match(/^hsla?\((\d+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/);
  if (hslMatch) {
    const [_, h, s, l] = hslMatch;
    const hNum = parseInt(h) / 360;
    const sNum = parseFloat(s) / 100;
    const lNum = parseFloat(l) / 100;
    return hslToRgb(hNum, sNum, lNum);
  }
  
  // Extended named colors
  const namedColors: Record<string, RGB> = {
    'aliceblue': { r: 0.94, g: 0.97, b: 1 },
    'antiquewhite': { r: 0.98, g: 0.92, b: 0.84 },
    'aqua': { r: 0, g: 1, b: 1 },
    'aquamarine': { r: 0.5, g: 1, b: 0.83 },
    'azure': { r: 0.94, g: 1, b: 1 },
    'beige': { r: 0.96, g: 0.96, b: 0.86 },
    'bisque': { r: 1, g: 0.89, b: 0.77 },
    'black': { r: 0, g: 0, b: 0 },
    'blanchedalmond': { r: 1, g: 0.92, b: 0.8 },
    'blue': { r: 0, g: 0, b: 1 },
    'blueviolet': { r: 0.54, g: 0.17, b: 0.89 },
    'brown': { r: 0.65, g: 0.16, b: 0.16 },
    'burlywood': { r: 0.87, g: 0.72, b: 0.53 },
    'cadetblue': { r: 0.37, g: 0.62, b: 0.63 },
    'chartreuse': { r: 0.5, g: 1, b: 0 },
    'chocolate': { r: 0.82, g: 0.41, b: 0.12 },
    'coral': { r: 1, g: 0.5, b: 0.31 },
    'cornflowerblue': { r: 0.39, g: 0.58, b: 0.93 },
    'cornsilk': { r: 1, g: 0.97, b: 0.86 },
    'crimson': { r: 0.86, g: 0.08, b: 0.24 },
    'cyan': { r: 0, g: 1, b: 1 },
    'darkblue': { r: 0, g: 0, b: 0.55 },
    'darkcyan': { r: 0, g: 0.55, b: 0.55 },
    'darkgoldenrod': { r: 0.72, g: 0.53, b: 0.04 },
    'darkgray': { r: 0.66, g: 0.66, b: 0.66 },
    'darkgrey': { r: 0.66, g: 0.66, b: 0.66 },
    'darkgreen': { r: 0, g: 0.39, b: 0 },
    'darkkhaki': { r: 0.74, g: 0.72, b: 0.42 },
    'darkmagenta': { r: 0.55, g: 0, b: 0.55 },
    'darkolivegreen': { r: 0.33, g: 0.42, b: 0.18 },
    'darkorange': { r: 1, g: 0.55, b: 0 },
    'darkorchid': { r: 0.6, g: 0.2, b: 0.8 },
    'darkred': { r: 0.55, g: 0, b: 0 },
    'darksalmon': { r: 0.91, g: 0.59, b: 0.48 },
    'darkseagreen': { r: 0.56, g: 0.74, b: 0.56 },
    'darkslateblue': { r: 0.28, g: 0.24, b: 0.55 },
    'darkslategray': { r: 0.18, g: 0.31, b: 0.31 },
    'darkslategrey': { r: 0.18, g: 0.31, b: 0.31 },
    'darkturquoise': { r: 0, g: 0.81, b: 0.82 },
    'darkviolet': { r: 0.58, g: 0, b: 0.83 },
    'deeppink': { r: 1, g: 0.08, b: 0.58 },
    'deepskyblue': { r: 0, g: 0.75, b: 1 },
    'dimgray': { r: 0.41, g: 0.41, b: 0.41 },
    'dimgrey': { r: 0.41, g: 0.41, b: 0.41 },
    'dodgerblue': { r: 0.12, g: 0.56, b: 1 },
    'firebrick': { r: 0.7, g: 0.13, b: 0.13 },
    'floralwhite': { r: 1, g: 0.98, b: 0.94 },
    'forestgreen': { r: 0.13, g: 0.55, b: 0.13 },
    'fuchsia': { r: 1, g: 0, b: 1 },
    'gainsboro': { r: 0.86, g: 0.86, b: 0.86 },
    'ghostwhite': { r: 0.97, g: 0.97, b: 1 },
    'gold': { r: 1, g: 0.84, b: 0 },
    'goldenrod': { r: 0.85, g: 0.65, b: 0.13 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 },
    'grey': { r: 0.5, g: 0.5, b: 0.5 },
    'green': { r: 0, g: 0.5, b: 0 },
    'greenyellow': { r: 0.68, g: 1, b: 0.18 },
    'honeydew': { r: 0.94, g: 1, b: 0.94 },
    'hotpink': { r: 1, g: 0.41, b: 0.71 },
    'indianred': { r: 0.8, g: 0.36, b: 0.36 },
    'indigo': { r: 0.29, g: 0, b: 0.51 },
    'ivory': { r: 1, g: 1, b: 0.94 },
    'khaki': { r: 0.94, g: 0.9, b: 0.55 },
    'lavender': { r: 0.9, g: 0.9, b: 0.98 },
    'lavenderblush': { r: 1, g: 0.94, b: 0.96 },
    'lawngreen': { r: 0.49, g: 0.99, b: 0 },
    'lemonchiffon': { r: 1, g: 0.98, b: 0.8 },
    'lightblue': { r: 0.68, g: 0.85, b: 0.9 },
    'lightcoral': { r: 0.94, g: 0.5, b: 0.5 },
    'lightcyan': { r: 0.88, g: 1, b: 1 },
    'lightgoldenrodyellow': { r: 0.98, g: 0.98, b: 0.82 },
    'lightgray': { r: 0.83, g: 0.83, b: 0.83 },
    'lightgrey': { r: 0.83, g: 0.83, b: 0.83 },
    'lightgreen': { r: 0.56, g: 0.93, b: 0.56 },
    'lightpink': { r: 1, g: 0.71, b: 0.76 },
    'lightsalmon': { r: 1, g: 0.63, b: 0.48 },
    'lightseagreen': { r: 0.13, g: 0.7, b: 0.67 },
    'lightskyblue': { r: 0.53, g: 0.81, b: 0.98 },
    'lightslategray': { r: 0.47, g: 0.53, b: 0.6 },
    'lightslategrey': { r: 0.47, g: 0.53, b: 0.6 },
    'lightsteelblue': { r: 0.69, g: 0.77, b: 0.87 },
    'lightyellow': { r: 1, g: 1, b: 0.88 },
    'lime': { r: 0, g: 1, b: 0 },
    'limegreen': { r: 0.2, g: 0.8, b: 0.2 },
    'linen': { r: 0.98, g: 0.94, b: 0.9 },
    'magenta': { r: 1, g: 0, b: 1 },
    'maroon': { r: 0.5, g: 0, b: 0 },
    'mediumaquamarine': { r: 0.4, g: 0.8, b: 0.67 },
    'mediumblue': { r: 0, g: 0, b: 0.8 },
    'mediumorchid': { r: 0.73, g: 0.33, b: 0.83 },
    'mediumpurple': { r: 0.58, g: 0.44, b: 0.86 },
    'mediumseagreen': { r: 0.24, g: 0.7, b: 0.44 },
    'mediumslateblue': { r: 0.48, g: 0.41, b: 0.93 },
    'mediumspringgreen': { r: 0, g: 0.98, b: 0.6 },
    'mediumturquoise': { r: 0.28, g: 0.82, b: 0.8 },
    'mediumvioletred': { r: 0.78, g: 0.08, b: 0.52 },
    'midnightblue': { r: 0.1, g: 0.1, b: 0.44 },
    'mintcream': { r: 0.96, g: 1, b: 0.98 },
    'mistyrose': { r: 1, g: 0.89, b: 0.88 },
    'moccasin': { r: 1, g: 0.89, b: 0.71 },
    'navajowhite': { r: 1, g: 0.87, b: 0.68 },
    'navy': { r: 0, g: 0, b: 0.5 },
    'oldlace': { r: 0.99, g: 0.96, b: 0.9 },
    'olive': { r: 0.5, g: 0.5, b: 0 },
    'olivedrab': { r: 0.42, g: 0.56, b: 0.14 },
    'orange': { r: 1, g: 0.65, b: 0 },
    'orangered': { r: 1, g: 0.27, b: 0 },
    'orchid': { r: 0.85, g: 0.44, b: 0.84 },
    'palegoldenrod': { r: 0.93, g: 0.91, b: 0.67 },
    'palegreen': { r: 0.6, g: 0.98, b: 0.6 },
    'paleturquoise': { r: 0.69, g: 0.93, b: 0.93 },
    'palevioletred': { r: 0.86, g: 0.44, b: 0.58 },
    'papayawhip': { r: 1, g: 0.94, b: 0.84 },
    'peachpuff': { r: 1, g: 0.85, b: 0.73 },
    'peru': { r: 0.8, g: 0.52, b: 0.25 },
    'pink': { r: 1, g: 0.75, b: 0.8 },
    'plum': { r: 0.87, g: 0.63, b: 0.87 },
    'powderblue': { r: 0.69, g: 0.88, b: 0.9 },
    'purple': { r: 0.5, g: 0, b: 0.5 },
    'rebeccapurple': { r: 0.4, g: 0.2, b: 0.6 },
    'red': { r: 1, g: 0, b: 0 },
    'rosybrown': { r: 0.74, g: 0.56, b: 0.56 },
    'royalblue': { r: 0.25, g: 0.41, b: 0.88 },
    'saddlebrown': { r: 0.55, g: 0.27, b: 0.07 },
    'salmon': { r: 0.98, g: 0.5, b: 0.45 },
    'sandybrown': { r: 0.96, g: 0.64, b: 0.38 },
    'seagreen': { r: 0.18, g: 0.55, b: 0.34 },
    'seashell': { r: 1, g: 0.96, b: 0.93 },
    'sienna': { r: 0.63, g: 0.32, b: 0.18 },
    'silver': { r: 0.75, g: 0.75, b: 0.75 },
    'skyblue': { r: 0.53, g: 0.81, b: 0.92 },
    'slateblue': { r: 0.42, g: 0.35, b: 0.8 },
    'slategray': { r: 0.44, g: 0.5, b: 0.56 },
    'slategrey': { r: 0.44, g: 0.5, b: 0.56 },
    'snow': { r: 1, g: 0.98, b: 0.98 },
    'springgreen': { r: 0, g: 1, b: 0.5 },
    'steelblue': { r: 0.27, g: 0.51, b: 0.71 },
    'tan': { r: 0.82, g: 0.71, b: 0.55 },
    'teal': { r: 0, g: 0.5, b: 0.5 },
    'thistle': { r: 0.85, g: 0.75, b: 0.85 },
    'tomato': { r: 1, g: 0.39, b: 0.28 },
    'turquoise': { r: 0.25, g: 0.88, b: 0.82 },
    'violet': { r: 0.93, g: 0.51, b: 0.93 },
    'wheat': { r: 0.96, g: 0.87, b: 0.7 },
    'white': { r: 1, g: 1, b: 1 },
    'whitesmoke': { r: 0.96, g: 0.96, b: 0.96 },
    'yellow': { r: 1, g: 1, b: 0 },
    'yellowgreen': { r: 0.6, g: 0.8, b: 0.2 }
  };
  
  return namedColors[color] || null;
}

// HSL to RGB conversion helper
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return { r, g, b };
}

export function parseBorderWidth(borderWidth: string): number {
  if (!borderWidth || borderWidth === 'none') return 0;
  
  const width = parseFloat(borderWidth);
  if (isNaN(width)) return 0;
  
  // Convert common keywords
  if (borderWidth === 'thin') return 1;
  if (borderWidth === 'medium') return 3;
  if (borderWidth === 'thick') return 5;
  
  return width;
}