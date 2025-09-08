import { buildHonoForAws } from './build.js';
import type { HonoNucelAwsAdapterOptions } from '../types.js';

/**
 * Hono adapter for AWS Lambda deployment via Nucel
 * 
 * @param options - Adapter configuration options
 * @returns Build function for Hono application
 */
export default function adapter(options: HonoNucelAwsAdapterOptions = {}) {
  return {
    name: '@nucel.cloud/hono-aws',
    
    async build(entryPoint: string) {
      const {
        out = '.nucel-build',
        precompress = false,
        envPrefix = '',
        bundle = true,
        minify = true,
        sourcemap = false,
        external = [],
        staticDir,
        streaming = false,
      } = options;

      return buildHonoForAws(
        {
          entryPoint,
          out,
          staticDir,
          environment: process.env as Record<string, string>,
          bundle,
          minify,
          sourcemap,
          external,
          streaming,
        },
        options
      );
    },
  };
}

// Re-export build function for direct use
export { buildHonoForAws } from './build.js';

// Re-export types for convenience
export type { HonoNucelAwsAdapterOptions, HonoBuildConfig } from '../types.js';