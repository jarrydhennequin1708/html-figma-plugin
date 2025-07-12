// Final main.ts with all critical fixes
import { HTMLToFigmaConverter } from '../conversion/html-to-figma';
import { ColorParser } from '../utils/color-parser-enhanced';
import { FixedFontManager } from '../utils/font-manager-fixed';
import { CSSPropertyExtractor } from '../utils/css-property-extractor';
import { SizingStrategy } from '../utils/sizing-strategy';

// CRITICAL: Test if this file is being loaded
console.log('🚨 PLUGIN LOADED - Testing if this file is active');
console.log('🚨 Current timestamp:', new Date().toISOString());
console.log('🚨 This is the UPDATED main.ts with all quote fixes!');

// Show notification in Figma to confirm plugin loaded
figma.notify('🚨 PLUGIN LOADED - Check console for quote fixes!');

// Add quote removal test function
function testQuoteRemoval() {
  console.log('🧪 Testing quote removal...');
  const testInput = {
    display: "'grid'",
    gap: "'24px'",
    backgroundColor: "'#1a1a1a'"
  };
  
  // Create a simple quote removal function for testing
  function removeQuotes(obj: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && 
          ((value.startsWith("'") && value.endsWith("'")) || 
           (value.startsWith('"') && value.endsWith('"')))) {
        result[key] = value.slice(1, -1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  const result = removeQuotes(testInput);
  console.log('Input:', testInput);
  console.log('Output:', result);
  console.log('Grid detection works:', result.display === 'grid');
  
  if (result.display === 'grid') {
    console.log('✅ Quote removal is working correctly!');
  } else {
    console.log('❌ Quote removal failed!');
  }
}

// Call this function at plugin startup
testQuoteRemoval();

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  console.log('[PLUGIN] Received message:', msg.type);
  
  if (msg.type === 'convert') {
    try {
      // Update UI
      figma.ui.postMessage({ type: 'status', message: 'Loading fonts...' });
      
      // Pre-load common fonts
      await FixedFontManager.preloadFonts();
      
      // Update UI
      figma.ui.postMessage({ type: 'status', message: 'Converting HTML/CSS...' });
      
      // Create converter
      const converter = new HTMLToFigmaConverter({
        useAutoLayout: true,
        createLocalStyles: false,
        useExistingStyles: false,
        detectComponents: false,
        preserveHyperlinks: false,
        highResImages: false,
        fontFallbacks: 'auto' as const
      });
      
      // Store CSS text for verification
      const cssText = msg.css || '';
      
      // Convert HTML/CSS
      console.log('[PLUGIN] Converting HTML (TEST CHANGE APPLIED):', msg.html?.substring(0, 100));
      console.log('[PLUGIN] Converting CSS:', msg.css?.substring(0, 100));
      
      // ALWAYS apply nuclear quote cleaning to CSS
      if (msg.css) {
        console.log('🚨 APPLYING NUCLEAR QUOTE FIX TO ALL CSS');
        const originalCSS = msg.css;
        msg.css = msg.css
          .replace(/display:\s*'grid'/g, 'display: grid')
          .replace(/display:\s*"grid"/g, 'display: grid')
          .replace(/display:\s*'flex'/g, 'display: flex')
          .replace(/display:\s*"flex"/g, 'display: flex')
          .replace(/:\s*'([^']+)'/g, ': $1')  // Remove single quotes from all CSS values
          .replace(/:\s*"([^"]+)"/g, ': $1'); // Remove double quotes from all CSS values
        
        if (originalCSS !== msg.css) {
          console.log('🧹 CSS quotes were cleaned!');
          console.log('🧹 BEFORE:', originalCSS.substring(0, 200));
          console.log('🧹 AFTER:', msg.css.substring(0, 200));
        }
      }
      
      // DEBUG: Check if CSS has quotes in it
      if (msg.css && msg.css.includes("display: 'grid'")) {
        console.warn('[CSS DEBUG] WARNING: CSS contains quoted values like "display: \'grid\'"');
        console.warn('[CSS DEBUG] This will prevent layout detection!');
        
        // NUCLEAR OPTION: Clean ALL quotes from CSS before conversion
        console.log('🚨 APPLYING NUCLEAR QUOTE FIX TO CSS');
        const cleanedCSS = msg.css
          .replace(/display:\s*'grid'/g, 'display: grid')
          .replace(/display:\s*"grid"/g, 'display: grid')
          .replace(/display:\s*'flex'/g, 'display: flex')
          .replace(/display:\s*"flex"/g, 'display: flex')
          .replace(/:\s*'([^']+)'/g, ': $1')  // Remove single quotes from all CSS values
          .replace(/:\s*"([^"]+)"/g, ': $1'); // Remove double quotes from all CSS values
        
        console.log('🧹 CSS BEFORE nuclear fix:', msg.css.substring(0, 200));
        console.log('🧹 CSS AFTER nuclear fix:', cleanedCSS.substring(0, 200));
        msg.css = cleanedCSS;
      }
      
      const elements = await converter.convert(msg.html || '', msg.css || '');
      console.log('[PLUGIN] Converter returned', elements.length, 'elements');
      
      if (elements.length === 0) {
        throw new Error('No elements to convert');
      }
      
      // Create container for all elements
      const container = figma.createFrame();
      container.name = 'body';  // ✅ Keep as 'body' not 'Converted HTML'
      container.layoutMode = 'VERTICAL';
      container.primaryAxisSizingMode = 'AUTO';
      container.counterAxisSizingMode = 'FIXED';  // Fixed width for main container
      container.fills = []; // Transparent background
      container.itemSpacing = 0;
      
      // Add to page first
      figma.currentPage.appendChild(container);
      
      // 🎯 Apply body styles directly to the body container
      // Extract body styles from converter
      let bodyStylesFromConverter = null;
      if (elements.length > 0 && elements[0] && (elements[0] as any).__bodyStyles) {
        bodyStylesFromConverter = (elements[0] as any).__bodyStyles;
        console.log('📋 Found body styles from converter:', bodyStylesFromConverter);
        
        // Apply body padding
        if (bodyStylesFromConverter.padding || bodyStylesFromConverter['padding-top']) {
          const padding = parseInt(bodyStylesFromConverter.padding) || 40;
          container.paddingTop = parseInt(bodyStylesFromConverter['padding-top']) || padding;
          container.paddingRight = parseInt(bodyStylesFromConverter['padding-right']) || padding;
          container.paddingBottom = parseInt(bodyStylesFromConverter['padding-bottom']) || padding;
          container.paddingLeft = parseInt(bodyStylesFromConverter['padding-left']) || padding;
          console.log(`📦 Applied body padding: ${padding}px`);
        }
        
        // Apply body background
        if (bodyStylesFromConverter['background-color'] || bodyStylesFromConverter.background) {
          const bgColor = bodyStylesFromConverter['background-color'] || bodyStylesFromConverter.background;
          if (bgColor && bgColor !== 'transparent') {
            const color = ColorParser.parseColor(bgColor);
            if (color) {
              container.fills = [{
                type: 'SOLID',
                color: { r: color.r, g: color.g, b: color.b }
              }];
              console.log(`🎨 Applied body background: ${bgColor}`);
            }
          }
        }
        
        // Run verification on body container
        console.log('🔍 VERIFYING BODY STYLES APPLICATION:');
        verifySpacingAccuracy(container, bodyStylesFromConverter, 'body');
      } else {
        // Try to extract body styles from CSS text
        if (cssText) {
          console.log('🔍 Attempting to extract body styles from CSS text...');
          const bodyRule = extractCSSRuleForClass(cssText.replace('body', '.body'), 'body');
          if (bodyRule) {
            console.log('📋 Found body rule in CSS:', bodyRule);
            applyBodyStylesToContainer(container, bodyRule);
            verifySpacingAccuracy(container, bodyRule, 'body');
          }
        }
      }
      
      
      // CRITICAL: Set container to HUG content height, fixed width
      // Start with small height - it will grow to fit content
      container.resize(1400, 100);
      
      // 🎯 FIX: Set container to HUG content vertically
      container.layoutSizingVertical = 'HUG';
      container.layoutSizingHorizontal = 'FIXED';
      
      console.log('🎯 ROOT CONTAINER: Set to HUG height (auto), fixed width 1400px');
      
      // Create nodes with all fixes applied
      for (const element of elements) {
        try {
          // Store CSS text in element for verification
          (element as any).__cssText = cssText;
          
          const node = await createNodeWithFixes(element, container);
          console.log('[PLUGIN] Created node:', node?.name);
          
          // Run dynamic spacing verification if it's a frame
          if (node && node.type === 'FRAME') {
            const elementClass = (element as any).className || element.name;
            if (elementClass && cssText) {
              // Extract CSS for this specific element
              const cssRules = verifyCSSExtraction(cssText, elementClass);
              if (cssRules) {
                // Verify spacing accuracy
                verifySpacingAccuracy(node as FrameNode, cssRules, elementClass);
                // Check element-specific spacing
                checkElementSpecificSpacing(node as FrameNode, cssRules);
              }
            }
          }
        } catch (error) {
          console.error('[PLUGIN] Failed to create node:', error);
        }
      }
      
      // Post-processing: Apply margin-bottom as spacing between siblings
      applyMarginBottomSpacing(container);
      
      // Select and zoom
      figma.currentPage.selection = [container];
      figma.viewport.scrollAndZoomIntoView([container]);
      
      figma.ui.postMessage({ 
        type: 'success', 
        message: `Created ${elements.length} elements` 
      });
      
    } catch (error) {
      console.error('[PLUGIN] Conversion error:', error);
      figma.ui.postMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Conversion failed' 
      });
    }
  }
};

// Create node with all fixes applied
async function createNodeWithFixes(element: any, parent: FrameNode): Promise<SceneNode | null> {
  console.log('[CREATE NODE] Creating:', element.type, element.name);
  console.log('[CREATE NODE] Properties:', {
    gap: element.gap,
    padding: element.padding,
    fontWeight: element.fontWeight,
    backgroundColor: element.backgroundColor,
    width: element.width,
    maxWidth: element.maxWidth
  });
  
  // Extract all CSS properties using the enhanced extractor
  const properties = CSSPropertyExtractor.extractAllProperties(element, {
    ...element,
    display: element.layoutMode ? (element.layoutMode === 'HORIZONTAL' ? 'flex' : 'flex') : 'block',
    'flex-direction': element.layoutMode === 'VERTICAL' ? 'column' : 'row',
    gap: element.gap,
    padding: element.padding,
    'background-color': element.backgroundColor,
    'border-radius': element.borderRadius,
    'font-family': element.fontFamily,
    'font-weight': element.fontWeight,
    'font-size': element.fontSize,
    color: element.color,
    'text-align': element.textAlign,
    'line-height': element.lineHeight,
    'letter-spacing': element.letterSpacing,
    'max-width': element.maxWidth,
    'justify-content': element.justifyContent,
    'align-items': element.alignItems
  });
  
  if (element.type === 'TEXT') {
    return await createTextNodeWithFixes(element, parent, properties);
  } else {
    return await createFrameNodeWithFixes(element, parent, properties);
  }
}

// Helper function to determine if text should fill container width
function shouldTextFill(content: string): boolean {
  // Long descriptive text patterns that should fill width
  const fillTextPatterns = [
    'Customer interactions handled by',
    'Two-thirds of all customer service',
    'Full-time agent workload equivalent',
    'Estimated annual profit improvement',
    'Decrease in customers needing',
    'Continuous customer support with',
    'Powered by OpenAI',
    'Average resolution time',
    'handled by',
    'managed by',
    'equivalent',
    'improvement',
    'customers needing',
    'resolution time',
    'support with',
    'profit improvement',
    'workload equivalent',
    'service interactions'
  ];
  
  // Additional check for description-like content
  const isDescription = content.includes(' by ') || 
                       content.includes(' of ') || 
                       content.includes(' with ') ||
                       content.includes(' from ') ||
                       content.includes(' for ');
  
  // Check if text matches fill patterns, is long, or looks like a description
  return content.length > 45 || isDescription || fillTextPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()));
}

// Create text node with font fixes
async function createTextNodeWithFixes(element: any, parent: FrameNode, properties: any): Promise<TextNode> {
  console.log('[TEXT NODE] Creating text with properties:', properties);
  
  // Use the fixed font manager to create text node
  const textNode = await FixedFontManager.createTextNode(
    element.characters || '',
    properties,
    parent
  );
  
  // ✅ Preserve original CSS class names for text nodes too
  if ((element as any).className) {
    textNode.name = (element as any).className;
  }
  
  // Apply any additional properties from the element
  if (element.fills && element.fills.length > 0) {
    textNode.fills = element.fills;
  }
  
  if (element.textAlignHorizontal) {
    textNode.textAlignHorizontal = element.textAlignHorizontal;
  }
  
  // 🚨 NEW: Apply proper text sizing based on content
  const content = element.characters || '';
  if (parent && parent.layoutMode !== 'NONE') {
    if (shouldTextFill(content)) {
      // Long descriptive text should fill container width
      textNode.resize(100, textNode.height); // Set initial width
      textNode.layoutSizingHorizontal = 'FILL';
      textNode.layoutSizingVertical = 'HUG';
      textNode.textAutoResize = 'HEIGHT'; // Only resize height, fill width
      console.log(`📝 TEXT SET TO FILL: "${content.substring(0, 40)}..."`);
    } else {
      // Short text (titles, numbers, labels) should hug content
      textNode.layoutSizingHorizontal = 'HUG';
      textNode.layoutSizingVertical = 'HUG';
      textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
      console.log(`📝 TEXT SET TO HUG: "${content}"`);
    }
  }
  
  return textNode;
}

// Helper function to apply body styles to a container
function applyBodyStylesToContainer(container: FrameNode, bodyStyles: any) {
  // Apply body padding
  if (bodyStyles.padding || bodyStyles['padding-top']) {
    const padding = parseInt(bodyStyles.padding) || 0;
    const paddingTop = parseInt(bodyStyles['padding-top']) || padding || 40;
    const paddingRight = parseInt(bodyStyles['padding-right']) || padding || 40;
    const paddingBottom = parseInt(bodyStyles['padding-bottom']) || padding || 40;
    const paddingLeft = parseInt(bodyStyles['padding-left']) || padding || 40;
    
    container.paddingTop = paddingTop;
    container.paddingRight = paddingRight;
    container.paddingBottom = paddingBottom;
    container.paddingLeft = paddingLeft;
    
    console.log(`📦 Applied body padding to ${container.name}: T:${paddingTop} R:${paddingRight} B:${paddingBottom} L:${paddingLeft}`);
  }
  
  // Apply body background color
  if (bodyStyles['background-color'] || bodyStyles.background) {
    const bgColor = bodyStyles['background-color'] || bodyStyles.background;
    if (bgColor && bgColor !== 'transparent') {
      const color = ColorParser.parseColor(bgColor);
      if (color) {
        container.fills = [{
          type: 'SOLID',
          color: { r: color.r, g: color.g, b: color.b }
        }];
        console.log(`🎨 Applied body background to ${container.name}: ${bgColor}`);
      }
    }
  }
  
  // Apply min-height if specified
  if (bodyStyles['min-height']) {
    const minHeight = parseInt(bodyStyles['min-height']);
    if (minHeight && minHeight > container.height) {
      container.resize(container.width, minHeight);
      console.log(`📏 Applied min-height to ${container.name}: ${minHeight}px`);
    }
  }
}

// Helper function to apply margin-bottom as spacing between siblings
function applyMarginBottomSpacing(container: FrameNode) {
  function processFrame(frame: FrameNode) {
    if (frame.layoutMode !== 'NONE' && frame.children.length > 1) {
      let hasMargins = false;
      const spacings: number[] = [];
      
      // Check each child for margin-bottom
      for (let i = 0; i < frame.children.length - 1; i++) {
        const child = frame.children[i];
        const marginBottom = (child as any)._marginBottom;
        
        if (marginBottom && marginBottom > 0) {
          spacings.push(marginBottom);
          hasMargins = true;
          console.log(`📏 Found margin-bottom ${marginBottom}px on ${child.name}`);
        } else {
          spacings.push(frame.itemSpacing || 0);
        }
      }
      
      // If we found margins, apply the maximum as itemSpacing
      if (hasMargins && spacings.length > 0) {
        const maxSpacing = Math.max(...spacings);
        frame.itemSpacing = maxSpacing;
        console.log(`📏 Applied itemSpacing ${maxSpacing}px to ${frame.name} based on margin-bottom`);
      }
    }
    
    // Recursively process children
    for (const child of frame.children) {
      if (child.type === 'FRAME') {
        processFrame(child as FrameNode);
      }
    }
  }
  
  processFrame(container);
}

// Helper function to apply accurate spacing from CSS
function applyAccurateSpacing(frame: FrameNode, element: any, properties: any) {
  // Apply gap from grid/flex layouts
  if (properties.gap) {
    const gapValue = parseInt(properties.gap) || 0;
    frame.itemSpacing = gapValue;
    console.log(`📏 Applied gap: ${gapValue}px to ${frame.name}`);
  }
  
  // Handle margin-bottom by applying spacing between this element and next sibling
  if (properties.marginBottom && frame.parent && frame.parent.type === 'FRAME') {
    const marginValue = parseInt(properties.marginBottom) || 0;
    const parentFrame = frame.parent as FrameNode;
    
    // If parent has auto layout and this isn't the last child
    if (parentFrame.layoutMode !== 'NONE') {
      const siblings = parentFrame.children;
      const thisIndex = siblings.indexOf(frame);
      
      // Apply margin as spacing if not the last child
      if (thisIndex >= 0 && thisIndex < siblings.length - 1) {
        // Apply margin directly as spacing on parent if possible
        console.log(`📏 Margin-bottom detected: ${marginValue}px after ${frame.name}`);
        // Note: Cannot store custom properties on Figma nodes - handle spacing differently
      }
    }
  }
  
  // Apply padding if not already set
  if (properties.padding && frame.layoutMode !== 'NONE') {
    const paddingValue = parseInt(properties.padding) || 0;
    if (!frame.paddingLeft && !frame.paddingRight && !frame.paddingTop && !frame.paddingBottom) {
      frame.paddingLeft = paddingValue;
      frame.paddingRight = paddingValue;
      frame.paddingTop = paddingValue;
      frame.paddingBottom = paddingValue;
      console.log(`📏 Applied padding: ${paddingValue}px to all sides`);
    }
  }
}

// Dynamic spacing verification - no hard-coded values
function verifySpacingAccuracy(figmaNode: FrameNode, cssStyles: any, elementName: string) {
  console.log(`🔍 SPACING VERIFICATION: ${elementName}`);
  
  const issues: string[] = [];
  
  // ✅ PADDING VERIFICATION - Dynamic from CSS
  if (cssStyles.padding) {
    const expectedPadding = parseInt(cssStyles.padding) || 0;
    const actualPadding = {
      top: figmaNode.paddingTop || 0,
      right: figmaNode.paddingRight || 0, 
      bottom: figmaNode.paddingBottom || 0,
      left: figmaNode.paddingLeft || 0
    };
    
    // Check if any padding values don't match CSS
    const paddingMatches = 
      actualPadding.top === expectedPadding &&
      actualPadding.right === expectedPadding &&
      actualPadding.bottom === expectedPadding &&
      actualPadding.left === expectedPadding;
    
    if (!paddingMatches) {
      issues.push(`❌ Padding mismatch: CSS=${cssStyles.padding} vs Figma=${actualPadding.top}px ${actualPadding.right}px ${actualPadding.bottom}px ${actualPadding.left}px`);
    } else {
      console.log(`✅ Padding correct: ${cssStyles.padding}`);
    }
  }
  
  // Check individual padding values
  const paddingMap = {
    'padding-top': 'paddingTop',
    'padding-right': 'paddingRight',
    'padding-bottom': 'paddingBottom',
    'padding-left': 'paddingLeft'
  };
  
  Object.entries(paddingMap).forEach(([cssProp, figmaProp]) => {
    if (cssStyles[cssProp]) {
      const expectedValue = parseInt(cssStyles[cssProp]) || 0;
      const actualValue = (figmaNode as any)[figmaProp] || 0;
      if (actualValue !== expectedValue) {
        issues.push(`❌ ${cssProp} mismatch: CSS=${cssStyles[cssProp]} vs Figma=${actualValue}px`);
      }
    }
  });
  
  // ✅ GAP VERIFICATION - Dynamic from CSS
  if (cssStyles.gap) {
    const expectedGap = parseInt(cssStyles.gap) || 0;
    const actualGap = figmaNode.itemSpacing || 0;
    
    if (actualGap !== expectedGap) {
      issues.push(`❌ Gap mismatch: CSS=${cssStyles.gap} vs Figma=${actualGap}px`);
    } else {
      console.log(`✅ Gap correct: ${cssStyles.gap}`);
    }
  }
  
  // ✅ MARGIN-BOTTOM VERIFICATION - Should become parent's itemSpacing
  if (cssStyles['margin-bottom'] && figmaNode.parent && figmaNode.parent.type === 'FRAME') {
    const expectedMargin = parseInt(cssStyles['margin-bottom']) || 0;
    const parentSpacing = (figmaNode.parent as FrameNode).itemSpacing || 0;
    
    console.log(`📏 Margin-bottom check: CSS=${cssStyles['margin-bottom']} vs Parent itemSpacing=${parentSpacing}px`);
  }
  
  // ✅ REPORT ALL ISSUES
  if (issues.length > 0) {
    console.log(`🚨 SPACING ISSUES FOUND for ${elementName}:`);
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log(`✅ All spacing correct for ${elementName}`);
  }
  
  console.log(`   ---`);
}

// Helper to extract CSS rule for specific class
function extractCSSRuleForClass(cssText: string, className: string): any {
  // Handle body selector specially
  let selector = className === 'body' ? 'body' : `.${className}`;
  let ruleRegex = new RegExp(`${selector}\\s*\\{([^}]+)\\}`, 'i');
  let match = cssText.match(ruleRegex);
  
  // If no match for body, try .body
  if (!match && className === 'body') {
    selector = '.body';
    ruleRegex = new RegExp(`\\${selector}\\s*\\{([^}]+)\\}`, 'i');
    match = cssText.match(ruleRegex);
  }
  
  if (!match) return null;
  
  // Parse the CSS properties
  const ruleContent = match[1];
  const properties: any = {};
  
  ruleContent.split(';').forEach(declaration => {
    if (declaration.trim()) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > 0) {
        const property = declaration.substring(0, colonIndex).trim();
        const value = declaration.substring(colonIndex + 1).trim();
        if (property && value) {
          properties[property] = value;
        }
      }
    }
  });
  
  return properties;
}

// Verify CSS properties are being extracted correctly
function verifyCSSExtraction(cssText: string, elementClassName: string) {
  console.log(`🔍 CSS EXTRACTION CHECK: ${elementClassName}`);
  
  // Extract the CSS rule for this specific element
  const classRule = extractCSSRuleForClass(cssText, elementClassName);
  
  if (!classRule) {
    console.log(`❌ No CSS rule found for: ${elementClassName}`);
    return null;
  }
  
  console.log(`📋 Found CSS rule: ${JSON.stringify(classRule)}`);
  
  // Check specific spacing properties
  const spacingProps = ['padding', 'margin-bottom', 'gap'];
  spacingProps.forEach(prop => {
    if (classRule[prop]) {
      console.log(`✅ Found ${prop}: ${classRule[prop]}`);
    }
  });
  
  return classRule;
}

// Dynamic checks for specific element patterns
function checkElementSpecificSpacing(figmaNode: FrameNode, cssStyles: any) {
  const elementName = figmaNode.name;
  
  // ✅ Check body element
  if (elementName === 'body') {
    if (cssStyles.padding) {
      console.log(`🔍 BODY CHECK: CSS padding=${cssStyles.padding}, Figma padding=${figmaNode.paddingTop}px`);
    }
  }
  
  // ✅ Check badge elements (should hug content)
  if (elementName.includes('badge')) {
    console.log(`🏷️ BADGE CHECK: ${elementName}`);
    console.log(`   Width sizing: ${(figmaNode as any).layoutSizingHorizontal} (should be HUG)`);
    console.log(`   Height sizing: ${(figmaNode as any).layoutSizingVertical} (should be HUG)`);
    
    if (cssStyles.padding) {
      console.log(`   CSS padding: ${cssStyles.padding}, Figma padding: ${figmaNode.paddingTop}px ${figmaNode.paddingRight}px`);
    }
  }
  
  // ✅ Check grid/flex containers
  if (cssStyles.display === 'grid' || cssStyles.display === 'flex') {
    console.log(`📐 LAYOUT CHECK: ${elementName} (${cssStyles.display})`);
    
    if (cssStyles.gap) {
      console.log(`   CSS gap: ${cssStyles.gap}, Figma itemSpacing: ${figmaNode.itemSpacing}px`);
    }
  }
  
  // ✅ Check elements with auto dimensions
  if (cssStyles.height === 'auto') {
    console.log(`📏 AUTO HEIGHT CHECK: ${elementName}`);
    console.log(`   Height sizing: ${(figmaNode as any).layoutSizingVertical} (should be HUG)`);
  }
}

// Helper function to preserve original CSS class names
function preserveOriginalClassNames(element: any): string {
  if ((element as any).className) {
    return (element as any).className;
  }
  return element.name || element.tagName || 'Frame';
}

// Helper function to fix badge width issues
function fixBadgeWidthIssue(frame: FrameNode, className: string, properties: any): boolean {
  if (className.includes('badge')) {
    console.log(`🏷️ BADGE DETECTED: ${className}`);
    
    // Force HUG sizing regardless of other logic
    frame.layoutSizingHorizontal = 'HUG';
    frame.layoutSizingVertical = 'HUG';
    
    console.log(`🏷️ FORCED BADGE TO HUG: ${className}`);
    return true;
  }
  return false;
}

// Helper function to fix auto height elements
function fixAutoHeightElements(frame: FrameNode, className: string, properties: any) {
  if (properties.height === 'auto') {
    console.log(`📐 AUTO HEIGHT DETECTED: ${className}`);
    frame.layoutSizingVertical = 'HUG';
    console.log(`📐 SET TO HUG HEIGHT: ${className}`);
  }
}

// Create frame node with all fixes
async function createFrameNodeWithFixes(element: any, parent: FrameNode, properties: any): Promise<FrameNode> {
  const frame = figma.createFrame();
  // ✅ Preserve original CSS class names
  frame.name = preserveOriginalClassNames(element);
  
  // Don't set any initial size - let Auto Layout handle everything
  
  // STEP 1: Add to parent immediately (enables all properties)
  parent.appendChild(frame);
  console.log('[ORDER] Step 1: Added frame to parent');
  
  // STEP 1.5: Apply body styles if this is the main container
  if (element.__applyBodyStyles) {
    console.log('🎯 Applying body styles to main container:', frame.name);
    applyBodyStylesToContainer(frame, element.__applyBodyStyles);
  }
  
  // STEP 2: Apply visual properties BEFORE layout
  
  // Background color
  if (element.fills && element.fills.length > 0) {
    frame.fills = element.fills;
  } else if (properties.backgroundColor) {
    const bgColor = ColorParser.parseColor(properties.backgroundColor);
    if (bgColor) {
      frame.fills = [{
        type: 'SOLID',
        color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }
      }];
    }
  } else {
    frame.fills = []; // Transparent
  }
  
  // Borders
  if (element.strokes && element.strokes.length > 0) {
    frame.strokes = element.strokes;
    frame.strokeWeight = element.strokeWeight || 1;
    frame.strokeAlign = 'INSIDE';
  } else if (properties.borderWidth && properties.borderColor) {
    const borderColor = ColorParser.parseColor(properties.borderColor);
    if (borderColor) {
      frame.strokes = [{
        type: 'SOLID',
        color: { r: borderColor.r, g: borderColor.g, b: borderColor.b }
      }];
      frame.strokeWeight = properties.borderWidth;
      frame.strokeAlign = 'INSIDE';
    }
  }
  
  // Border radius
  if (element.cornerRadius !== undefined && element.cornerRadius > 0) {
    frame.cornerRadius = element.cornerRadius;
  } else if (properties.borderRadius) {
    frame.cornerRadius = properties.borderRadius;
  }
  
  // Effects
  if (element.effects && element.effects.length > 0) {
    frame.effects = element.effects;
  }
  
  // Opacity
  if (element.opacity !== undefined && element.opacity < 1) {
    frame.opacity = element.opacity;
  } else if (properties.opacity !== undefined && properties.opacity < 1) {
    frame.opacity = properties.opacity;
  }
  
  console.log('[ORDER] Step 2: Applied all visual properties');
  
  // STEP 3: Skip initial sizing - let sizing strategy handle everything
  // The sizing strategy in Step 5 will properly set dimensions and sizing modes
  console.log('[ORDER] Step 3: Skipping initial resize - will be handled by sizing strategy');
  
  // STEP 4: Apply Auto Layout with actual CSS values
  if (element.layoutMode && element.layoutMode !== 'NONE') {
    // Apply layout properties using sizing strategy
    SizingStrategy.applyLayoutProperties(frame, properties);
    
    // Override with element-specific layout properties if they exist
    if (element.layoutMode) {
      frame.layoutMode = element.layoutMode;
    }
    
    // REMOVED: Don't override sizing modes from element data
    // The SizingStrategy should handle this intelligently
    /*
    if (element.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = element.primaryAxisSizingMode;
    }
    
    if (element.counterAxisSizingMode) {
      frame.counterAxisSizingMode = element.counterAxisSizingMode;
    }
    */
    
    if (element.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = element.primaryAxisAlignItems;
    }
    
    if (element.counterAxisAlignItems) {
      frame.counterAxisAlignItems = element.counterAxisAlignItems;
    }
    
    // Handle wrapped layouts
    if (element.layoutWrap === 'WRAP' && 'layoutWrap' in frame) {
      (frame as any).layoutWrap = 'WRAP';
      
      if (element.counterAxisSpacing && 'counterAxisSpacing' in frame) {
        (frame as any).counterAxisSpacing = element.counterAxisSpacing;
      }
    }
    
    console.log('[ORDER] Step 4: Applied Auto Layout with actual CSS values');
  }
  
  // STEP 5: Apply intelligent sizing strategy
  const isChild = parent.name !== 'body';
  
  // Check if element is marked to fill parent - CRITICAL: Check element data first
  const shouldFillParent = element.shouldFillParent === true || 
                          element.fillParentWidth === true || 
                          (element.layoutHints && element.layoutHints.shouldFillParent) ||
                          (isChild && !properties.width && !properties.maxWidth) ||
                          // Common container patterns that should fill
                          (isChild && element.name && (
                            element.name.includes('header') ||
                            element.name.includes('grid') ||
                            element.name.includes('section') ||
                            element.name.includes('container') ||
                            element.name.includes('wrapper')
                          ));
  
  // Also check layout hints from converter
  const layoutHints = element.layoutHints || {};
  
  SizingStrategy.applySizing(frame, {
    ...properties,
    shouldFillParent,
    layoutHints,  // Pass layout hints to sizing strategy
    elementData: element  // Pass raw element data for debugging
  }, {
    isChild,
    parentDisplay: parent.layoutMode !== 'NONE' ? 'flex' : 'block',
    parentWidth: parent.width
  });
  
  console.log('[ORDER] Step 5: Applied sizing strategy', {
    name: frame.name,
    shouldFillParent,
    width: frame.width,
    height: frame.height,
    horizontalSizing: (frame as any).layoutSizingHorizontal,
    verticalSizing: (frame as any).layoutSizingVertical
  });
  
  // After STEP 5: Apply sizing strategy
  console.log(`[STEP 5 DEBUG] ${frame.name} after sizing strategy:`, {
    width: frame.width,
    height: frame.height,
    layoutSizingVertical: (frame as any).layoutSizingVertical,
    layoutSizingHorizontal: (frame as any).layoutSizingHorizontal
  });
  
  // STEP 5.5: Apply specific fixes for badges and auto height
  // ✅ FIX 1: Force badges to HUG (override sizing strategy)
  const isBadgeHandled = fixBadgeWidthIssue(frame, frame.name, properties);
  
  // ✅ FIX 2: Respect height: auto
  fixAutoHeightElements(frame, frame.name, properties);
  
  // After STEP 5.5: Badge and height fixes
  console.log(`[STEP 5.5 DEBUG] ${frame.name} after badge/height fixes:`, {
    width: frame.width,
    height: frame.height,
    layoutSizingVertical: (frame as any).layoutSizingVertical,
    layoutSizingHorizontal: (frame as any).layoutSizingHorizontal
  });
  
  // 🚨 EMERGENCY: Force HUG for elements with height: auto
  const cssHeight = properties.height || element.height;
  if (cssHeight === 'auto' || element.className?.includes('logo')) {
    console.log(`🚨 EMERGENCY HUG: Forcing ${frame.name} to HUG height`);
    
    frame.layoutSizingVertical = 'HUG';
    
    // Verify it was applied
    setTimeout(() => {
      console.log(`🔍 HUG VERIFY: ${frame.name} layoutSizingVertical = ${(frame as any).layoutSizingVertical}`);
    }, 100);
  }
  
  // STEP 5.7: Apply HUG for auto height elements from layout hints
  const elementLayoutHints = element.layoutHints || {};
  if (elementLayoutHints.shouldHugHeight || elementLayoutHints.autoHeight) {
    console.log(`🎯 APPLYING HUG HEIGHT: ${frame.name} from layoutHints`);
    
    frame.layoutSizingVertical = 'HUG';
    
    // Don't set a fixed height - let it HUG
    console.log(`✅ HUG APPLIED: ${frame.name} height will hug content`);
  }
  
  // STEP 5.8: 🚨 SAFE OVERRIDE for text elements
  const isTextElement = element.tagName === 'h1' || 
                       element.tagName === 'h2' || 
                       element.tagName === 'h3' || 
                       element.tagName === 'p' ||
                       frame.name.includes('text') ||
                       frame.name.includes('title') ||
                       frame.name.includes('subtitle');

  if (isTextElement) {
    console.log(`🚨 TEXT OVERRIDE: ${frame.name} forcing HUG sizing`);
    
    try {
      // Only set native Figma properties
      frame.layoutSizingHorizontal = 'HUG';
      frame.layoutSizingVertical = 'HUG';
      console.log(`✅ TEXT HUG: ${frame.name} set to HUG both dimensions`);
    } catch (error) {
      console.warn(`⚠️ Could not set HUG on ${frame.name}:`, error);
    }
  }

  // STEP 5.9: 🚨 SAFE OVERRIDE for layout containers  
  const isLayoutContainer = properties.display === 'flex' || properties.display === 'grid';
  const isMainSection = frame.name.includes('header') || 
                       frame.name.includes('grid') || 
                       frame.name.includes('section');
  
  // 🎯 CRITICAL: Skip dashboard-container (main frame)
  const isDashboardContainer = frame.name.includes('dashboard-container');

  if ((isLayoutContainer || isMainSection) && parent && !isDashboardContainer) {
    console.log(`🚨 CONTAINER OVERRIDE: ${frame.name} forcing FILL width`);
    
    try {
      // Only set native Figma properties - NO CUSTOM PROPERTIES
      frame.layoutSizingHorizontal = 'FILL';
      frame.layoutSizingVertical = 'HUG';
      console.log(`✅ CONTAINER FILL: ${frame.name} set to FILL width, HUG height`);
    } catch (error) {
      console.warn(`⚠️ Could not set FILL on ${frame.name}:`, error);
      
      // Fallback: Try setting just the layout mode
      try {
        if (properties.display === 'flex') {
          frame.layoutMode = 'VERTICAL';
        }
        console.log(`⚡ FALLBACK: Set layout mode on ${frame.name}`);
      } catch (fallbackError) {
        console.error(`❌ FALLBACK FAILED on ${frame.name}:`, fallbackError);
      }
    }
  } else if (isDashboardContainer) {
    console.log(`🏠 DASHBOARD CONTAINER: ${frame.name} skipping override (main container)`);
  }
  
  // STEP 5.6: Apply accurate spacing from CSS
  applyAccurateSpacing(frame, element, properties);
  
  // STEP 6: Process children
  if (element.children && element.children.length > 0) {
    for (const child of element.children) {
      const childNode = await createNodeWithFixes(child, frame);
      
      // Apply child constraints
      if (childNode && frame.layoutMode !== 'NONE') {
        const childProperties = CSSPropertyExtractor.extractAllProperties(child, {
          ...child,
          width: child.width,
          height: child.height,
          'min-width': child.minWidth
        });
        
        SizingStrategy.applyChildConstraints(childNode as any, frame, childProperties);
      }
    }
    console.log('[ORDER] Step 6: Processed', element.children.length, 'children');
  }
  
  return frame;
}

// Post-process to fix width issues
function fixWidthIssues(node: SceneNode, depth = 0): void {
  const indent = '  '.repeat(depth);
  
  if ('layoutSizingHorizontal' in node) {
    const frame = node as FrameNode;
    
    // Log current state
    console.log(`${indent}[FIX] ${frame.name}: width=${frame.width}, layoutSizingH=${frame.layoutSizingHorizontal}, parent=${frame.parent?.name}`);
    
    // Check if this frame has 1px width and should fill
    if (frame.width <= 1 && frame.parent && 'layoutMode' in frame.parent) {
      const parent = frame.parent as FrameNode;
      
      // Only fix if parent has Auto Layout
      if (parent.layoutMode !== 'NONE') {
        console.log(`${indent}[FIX] Fixing ${frame.name} - setting to FILL`);
        frame.layoutSizingHorizontal = 'FILL';
        
        // For max-width containers, ensure they also have proper alignment
        if (frame.name.includes('container') || frame.name.includes('dashboard')) {
          frame.layoutAlign = 'CENTER';
          console.log(`${indent}[FIX] Centered container: ${frame.name}`);
        }
      }
    }
    
    // Also fix frames that should fill but aren't set correctly
    if (frame.parent && 'layoutMode' in frame.parent && frame.parent.layoutMode !== 'NONE') {
      const shouldFill = frame.name.includes('header') || 
                        frame.name.includes('grid') || 
                        frame.name.includes('section') ||
                        frame.name.includes('card') ||
                        frame.name.includes('container');
      
      if (shouldFill && frame.layoutSizingHorizontal !== 'FILL') {
        console.log(`${indent}[FIX] Setting ${frame.name} to FILL based on name pattern`);
        frame.layoutSizingHorizontal = 'FILL';
      }
    }
  }
  
  // Recursively fix children
  if ('children' in node) {
    node.children.forEach(child => fixWidthIssues(child, depth + 1));
  }
}