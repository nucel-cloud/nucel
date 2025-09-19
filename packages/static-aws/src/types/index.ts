import * as pulumi from "@pulumi/pulumi";

export interface StaticSiteArgs {
  /**
   * Path to the website contents to deploy
   */
  sitePath: string;

  /**
   * Custom domain configuration
   */
  domain?: DomainConfig;

  /**
   * CloudFront price class
   * @default "PriceClass_100"
   */
  priceClass?: string;

  /**
   * CloudFront logging configuration
   */
  logging?: CloudFrontLoggingConfig;

  /**
   * Wait for CloudFront deployment to complete
   * @default true
   */
  waitForDeployment?: boolean;

  /**
   * Custom error page configurations for SPAs
   * @default [{ errorCode: 404, responseCode: 200, responsePagePath: "/index.html" }]
   */
  customErrorResponses?: CustomErrorResponse[];

  /**
   * Cache behaviors for different path patterns
   */
  cacheBehaviors?: CacheBehavior[];

  /**
   * Environment name for resource naming
   */
  environment?: string;

  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;

  /**
   * Default root object
   * @default "index.html"
   */
  defaultRootObject?: string;

  /**
   * Enable CloudFront compression
   * @default true
   */
  enableCompression?: boolean;
}

export interface DomainConfig {
  /**
   * The domain name to use (e.g., "example.com")
   */
  name: string;

  /**
   * ARN of existing ACM certificate (must be in us-east-1)
   * If not provided, a certificate will be created
   */
  certificateArn?: pulumi.Input<string>;

  /**
   * Include www subdomain
   * @default true
   */
  includeWWW?: boolean;

  /**
   * Hosted zone ID for the domain
   * If not provided, will be looked up automatically
   */
  hostedZoneId?: pulumi.Input<string>;
}

export interface CloudFrontLoggingConfig {
  /**
   * S3 bucket for logs (will be created if not provided)
   */
  bucket?: pulumi.Input<string>;

  /**
   * Prefix for log files
   */
  prefix?: string;

  /**
   * Include cookies in logs
   * @default false
   */
  includeCookies?: boolean;
}

export interface CustomErrorResponse {
  errorCode: number;
  responseCode?: number;
  responsePagePath?: string;
  errorCachingMinTtl?: number;
}

export interface CacheBehavior {
  pathPattern: string;
  targetOriginId?: string;
  viewerProtocolPolicy?: "allow-all" | "https-only" | "redirect-to-https";
  allowedMethods?: string[];
  cachedMethods?: string[];
  compress?: boolean;
  defaultTtl?: number;
  maxTtl?: number;
  minTtl?: number;
}