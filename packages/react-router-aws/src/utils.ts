import { RESERVED_ENV_PREFIXES } from './types.js';

/**
 * Validates and filters environment variables for Lambda
 */
export function validateEnvironmentVariables(
  environment: Record<string, string>
): Record<string, string> {
  const validEnvVars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(environment)) {
    // Skip AWS reserved environment variables
    if (RESERVED_ENV_PREFIXES.some(prefix => key.startsWith(prefix))) {
      if (process.env.PULUMI_VERBOSE || process.env.DEBUG) {
        console.warn(`Skipping reserved AWS environment variable: ${key}`);
      }
      continue;
    }
    
    // Validate key format (must match [a-zA-Z][a-zA-Z0-9_]+)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      if (process.env.PULUMI_VERBOSE || process.env.DEBUG) {
        console.warn(`Skipping invalid environment variable name: ${key} (must match pattern [a-zA-Z][a-zA-Z0-9_]+)`);
      }
      continue;
    }
    
    validEnvVars[key] = value;
  }
  
  return validEnvVars;
}

/**
 * Gets the appropriate content type for a file
 */
export function getContentType(file: string): string {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  
  const ext = file.substring(file.lastIndexOf('.'));
  return mimeTypes[ext] || 'application/octet-stream';
}