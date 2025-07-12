# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Figma plugin called "CodeToFigma" that converts HTML and CSS code into Figma design elements. The plugin is built with TypeScript and uses the Figma Plugin API.

## Development Commands

### Build the plugin
```bash
npm run build
```
This runs TypeScript compilation and copies the UI HTML file to the dist directory.

### Install dependencies
```bash
npm install
```

## Architecture

### Core Structure
- **src/plugin/main.ts**: Entry point for the Figma plugin. Contains embedded UI HTML and handles communication between UI and conversion engine.
- **src/conversion/html-figma-converter.ts**: Main conversion engine that transforms HTML/CSS into Figma-compatible node structures.

### Key Classes
- **HTMLToFigmaConverter**: Main converter class that orchestrates the conversion process
- **FontManager**: Handles font mapping between web fonts and Figma fonts
- **CSSParser**: Parses CSS and extracts styles for conversion
- **LayoutConverter**: Converts CSS layout properties (flexbox) to Figma Auto Layout
- **ComponentDetector**: Identifies reusable patterns for component creation

### Conversion Flow
1. Plugin UI accepts HTML and CSS input
2. Message sent to plugin main process
3. HTMLToFigmaConverter processes the input using JSDOM and CSS parser
4. Converter creates FigmaNode objects with appropriate properties
5. Main process creates actual Figma nodes from the converter output

## Important Implementation Details

- The plugin UI is embedded directly in main.ts as an HTML string
- Conversion supports advanced features like Auto Layout, component detection, and font fallbacks
- The converter outputs intermediate FigmaNode objects that need to be manually transformed into actual Figma nodes
- Test file exists at src/conversion/converter-test.ts but imports are commented out

## TypeScript Configuration

The project uses strict TypeScript settings with ES modules target. Check tsconfig.json for compiler options.