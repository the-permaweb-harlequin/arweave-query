/**
 * Cross-platform base64url encoding/decoding utilities
 * Works in both Node.js and browser environments
 */

/**
 * Convert base64url string to Uint8Array
 */
export function base64urlToBytes(base64url: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64url, 'base64url'));
  } else {
    // Browser environment
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    
    // Decode base64 to binary string
    const binaryString = atob(padded);
    
    // Convert to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Convert Uint8Array or DuckDB blob to base64url string
 */
export function bytesToBase64url(bytes: Uint8Array | any): string {
  // Handle null/undefined values
  if (!bytes) return '';
  
  // Handle DuckDB blob values
  const actualBytes = bytes?.bytes || bytes;
  
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(actualBytes).toString('base64url');
  } else {
    // Browser environment
    // Convert Uint8Array to binary string
    let binaryString = '';
    for (let i = 0; i < actualBytes.length; i++) {
      binaryString += String.fromCharCode(actualBytes[i]);
    }
    
    // Encode to base64
    const base64 = btoa(binaryString);
    
    // Convert base64 to base64url
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

/**
 * Convert Uint8Array to Buffer (Node.js) or return as-is (browser)
 * This is for DuckDB parameter passing
 */
export function bytesToBuffer(bytes: Uint8Array): Uint8Array | Buffer {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment - convert to Buffer for DuckDB
    return Buffer.from(bytes);
  } else {
    // Browser environment - return Uint8Array as-is
    return bytes;
  }
}

/**
 * Convert base64url to standard base64 for DuckDB comparison
 * DuckDB's base64() function returns standard base64 (with +, /, =)
 */
export function base64urlToBase64(base64url: string): string {
  // Replace URL-safe characters with standard base64 characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padding);
  
  return base64;
}
