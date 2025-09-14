import * as pulumi from "@pulumi/pulumi";

export type LambdaConfig = {
  memory?: number;
  timeout?: number;
  reservedConcurrentExecutions?: number;
  provisionedConcurrency?: number;
};

export type ImageLambdaConfig = {
  memory?: number;
  timeout?: number;
};

export type RevalidationLambdaConfig = {
  memory?: number;
  timeout?: number;
};

export type WarmerLambdaConfig = {
  enabled?: boolean;
  memory?: number;
  timeout?: number;
  concurrency?: number;
  schedule?: string;
};

export type DomainConfig = {
  name: string;
  certificateArn?: pulumi.Input<string>;
};

export type CloudFrontLoggingConfig = {
  bucket: string;
  prefix?: string;
  includeCookies?: boolean;
  enableRealtimeLogs?: boolean; // Send logs to Kinesis for real-time processing
};

export type CloudFrontSecurityConfig = {
  enableOriginAccessControl?: boolean; // Use OAC instead of OAI (more secure)
  restrictGeoLocations?: string[]; // ISO country codes to restrict (e.g., ["CN", "RU"])
  webAclId?: pulumi.Input<string>; // Optional WAF ACL if user already has one
};

export type NextArgs = {
  /**
   * Path to the Next.js application
   */
  appPath: string;
  
  /**
   * OpenNext build output directory
   */
  openNextPath?: string;
  
  /**
   * Environment variables for Lambda functions
   */
  environment?: Record<string, pulumi.Input<string>>;
  
  /**
   * Custom domain configuration
   */
  domain?: DomainConfig;
  
  /**
   * Lambda function configurations
   */
  lambda?: {
    server?: LambdaConfig;
    image?: ImageLambdaConfig;
    revalidation?: RevalidationLambdaConfig;
    warmer?: WarmerLambdaConfig;
  };
  
  /**
   * Enable streaming responses
   */
  streaming?: boolean;
  
  /**
   * CloudFront price class
   */
  priceClass?: string;
  
  /**
   * Enable CloudFront logging
   */
  cloudFrontLogging?: CloudFrontLoggingConfig;
  
  /**
   * Wait for CloudFront distribution deployment to complete
   */
  waitForDeployment?: boolean;
  
  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
  
  /**
   * Use shared CloudFront policies to reduce AWS resource limits.
   * Set to false if you need custom policies for specific requirements.
   * Default: true
   */
  useSharedPolicies?: boolean;
  
  /**
   * Custom CloudFront response headers policy ID.
   * If provided, this will be used instead of creating a new one.
   * Useful when you need specific security headers like custom X-Frame-Options.
   */
  customResponseHeadersPolicyId?: pulumi.Input<string>;
  
  /**
   * CloudFront security configuration
   */
  security?: CloudFrontSecurityConfig;
};

export type OpenNextPaths = {
  serverFunction: string;
  imageFunction: string;
  revalidationFunction: string;
  warmerFunction: string;
  assets: string;
};

export type ComponentOptions = {
  parent?: pulumi.Resource;
};

export type NextOutputs = {
  url: pulumi.Output<string>;
  distributionId: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  serverFunctionUrl?: pulumi.Output<string>;
  imageFunctionUrl?: pulumi.Output<string>;
  serverFunctionArn?: pulumi.Output<string>;
  imageFunctionArn?: pulumi.Output<string>;
};