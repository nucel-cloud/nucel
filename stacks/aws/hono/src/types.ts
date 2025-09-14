import * as pulumi from '@pulumi/pulumi';

/**
 * Hono Nucel AWS Component configuration
 */
export interface HonoNucelAwsArgs {
  /**
   * Path to the built Hono application
   */
  buildPath: string;
  
  /**
   * Environment variables for the Lambda function
   */
  environment?: Record<string, pulumi.Input<string>>;
  
  /**
   * Lambda configuration
   */
  lambda?: LambdaConfig;
  
  /**
   * CloudFront price class
   * @default "PriceClass_100"
   */
  priceClass?: string;
  
  /**
   * Custom domain configuration
   */
  domain?: DomainConfig;
  
  /**
   * Resource tags
   */
  tags?: Record<string, string>;

  /**
   * Enable response streaming for Lambda
   * @default false
   */
  streaming?: boolean;

  /**
   * Enable Lambda@Edge deployment
   * @default false
   */
  edge?: boolean;
}

/**
 * Lambda configuration options
 */
export interface LambdaConfig {
  /**
   * Memory size in MB
   * @default 1024
   */
  memorySize?: number;
  
  /**
   * Timeout in seconds
   * @default 30
   */
  timeout?: number;
  
  /**
   * Runtime version
   * @default "nodejs22.x"
   */
  runtime?: string;
  
  /**
   * Reserved concurrent executions
   */
  reservedConcurrentExecutions?: number;

  /**
   * Architecture
   * @default "arm64"
   */
  architecture?: 'x86_64' | 'arm64';
}

/**
 * Domain configuration
 */
export interface DomainConfig {
  /**
   * Domain name
   */
  name: string;
  
  /**
   * ACM certificate ARN
   */
  certificateArn: string;
  
  /**
   * Route53 hosted zone ID
   */
  hostedZoneId?: string;
}

/**
 * Hono adapter configuration
 */
export interface HonoNucelAwsAdapterOptions {
  /**
   * Output directory
   * @default ".nucel-build"
   */
  out?: string;
  
  /**
   * Precompress static assets
   * @default false
   */
  precompress?: boolean;
  
  /**
   * Environment variable prefix to include
   * @default ""
   */
  envPrefix?: string;
  
  /**
   * Bundle the application with esbuild
   * @default true
   */
  bundle?: boolean;

  /**
   * Minify the bundled code
   * @default true
   */
  minify?: boolean;

  /**
   * Generate source maps
   * @default false
   */
  sourcemap?: boolean;

  /**
   * External packages to exclude from bundling
   * @default []
   */
  external?: string[];

  /**
   * Static assets directory to copy
   */
  staticDir?: string;

  /**
   * Enable response streaming
   * @default false
   */
  streaming?: boolean;
}

/**
 * Build configuration for Hono
 */
export interface HonoBuildConfig {
  /**
   * Path to the Hono application entry file
   */
  entryPoint: string;
  
  /**
   * Output directory
   */
  out: string;
  
  /**
   * Static assets directory
   */
  staticDir?: string;
  
  /**
   * Environment variables to include
   */
  environment?: Record<string, string>;

  /**
   * Bundle options
   */
  bundle?: boolean;
  minify?: boolean;
  sourcemap?: boolean;
  external?: string[];
  streaming?: boolean;
}

/**
 * Deployment outputs
 */
export interface DeploymentOutputs {
  /**
   * CloudFront distribution URL
   */
  url: pulumi.Output<string>;
  
  /**
   * CloudFront distribution ID
   */
  distributionId: pulumi.Output<string>;
  
  /**
   * S3 bucket name
   */
  bucketName: pulumi.Output<string>;
  
  /**
   * Lambda function ARN
   */
  functionArn: pulumi.Output<string>;
}

/**
 * AWS managed cache policies for CloudFront
 */
export const CACHE_POLICIES = {
  CACHING_OPTIMIZED: '658327ea-f89d-4fab-a63d-7e88639e58f6',
  CACHING_DISABLED: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
  CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS: 'b2884449-e4de-46a7-ac36-70bc7f1ddd6d',
} as const;

/**
 * AWS managed origin request policies for CloudFront
 */
export const ORIGIN_REQUEST_POLICIES = {
  ALL_VIEWER: '216adef6-5c7f-47e4-b989-5492eafa07d3',
  ALL_VIEWER_EXCEPT_HOST_HEADER: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
  CORS_S3_ORIGIN: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
  CORS_CUSTOM_ORIGIN: '59781a5b-3903-41f3-afcb-af62929ccde1',
  USER_AGENT_REFERER_HEADERS: 'acba4595-bd28-49b8-b9fe-13317c0390fa',
} as const;

/**
 * AWS managed response headers policies for CloudFront
 */
export const RESPONSE_HEADERS_POLICIES = {
  CORS_WITH_PREFLIGHT: '5cc3b908-e619-4b99-88e5-2cf7f45965bd',
  CORS_WITH_PREFLIGHT_AND_SECURITY_HEADERS: 'eaab4381-ed33-4a86-88ca-d9558dc6cd63',
  SECURITY_HEADERS: '67f7725c-6f97-4210-82d7-5512b31e9d03',
} as const;