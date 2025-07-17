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
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
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