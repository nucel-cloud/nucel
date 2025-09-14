import type { Adapter } from '@sveltejs/kit';
import { build } from './build.js';
import type { SvelteKitNucelAwsAdapterOptions } from '../types/index.js';

export default function adapter(options: SvelteKitNucelAwsAdapterOptions = {}): Adapter {
  const {
    out = '.nucel-build',
    precompress = false,
    envPrefix = '',
    polyfill = true,
  } = options;

  return {
    name: '@donswayo/pulumi-sveltekit-aws',
    
    async adapt(builder) {
      await build({
        builder,
        out,
        precompress,
        envPrefix,
        polyfill,
      });
    },
  };
}