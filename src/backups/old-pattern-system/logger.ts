// Simple logger utility with conditional output
export class Logger {
  private static isDebug = false; // Set to true during development
  
  static log(...args: any[]) {
    if (this.isDebug) {
      console.log(...args);
    }
  }
  
  static info(...args: any[]) {
    console.log('[INFO]', ...args);
  }
  
  static warn(...args: any[]) {
    console.warn('[WARN]', ...args);
  }
  
  static error(...args: any[]) {
    console.error('[ERROR]', ...args);
  }
  
  static debug(...args: any[]) {
    if (this.isDebug) {
      console.log('[DEBUG]', ...args);
    }
  }
}