import type { Builder } from '@sveltejs/kit';
import * as pulumi from "@pulumi/pulumi";

export interface SvelteKitNucelAwsAdapterOptions {
  /**
   * Output directory for the build
   * @default '.nucel-build'
   */
  out?: string;
  
  /**
   * Enable precompression of assets
   * @default false
   */
  precompress?: boolean;
  
  /**
   * Environment variable prefix
   * @default ''
   */
  envPrefix?: string;
  
  /**
   * Add Node.js polyfills
   * @default true
   */
  polyfill?: boolean;
}

export interface BuildOptions extends SvelteKitNucelAwsAdapterOptions {
  builder: Builder;
}

export interface SvelteKitNucelAwsArgs {
  /**
   * Path to the SvelteKit build output
   */
  buildPath: string;
  
  /**
   * Environment variables for Lambda functions
   */
  environment?: Record<string, pulumi.Input<string>>;
  
  /**
   * Custom domain configuration
   */
  domain?: {
    name: string;
    certificateArn?: pulumi.Input<string>;
  };
  
  /**
   * Lambda function configuration
   */
  lambda?: {
    memory?: number;
    timeout?: number;
    architecture?: 'x86_64' | 'arm64';
  };
  
  /**
   * CloudFront price class
   */
  priceClass?: string;
  
  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
}

export interface HandlerContext {
  server: any;
  env: Record<string, string>;
}