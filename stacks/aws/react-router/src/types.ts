import * as pulumi from '@pulumi/pulumi';

export interface ReactRouterNucelAwsArgs {
  /**
   * Path to the built React Router application (output from adapter)
   */
  buildPath: string;
  
  /**
   * Environment variables for the Lambda function
   */
  environment?: Record<string, string>;
  
  /**
   * Lambda configuration
   */
  lambda?: LambdaConfig;
  
  /**
   * CloudFront price class
   */
  priceClass?: string;
  
  /**
   * Custom domain configuration
   */
  domain?: DomainConfig;
  
  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
}

export interface LambdaConfig {
  memory?: number;
  timeout?: number;
  architecture?: 'x86_64' | 'arm64';
  reservedConcurrency?: number;
  streaming?: boolean;
}

export interface DomainConfig {
  name: string;
  certificateArn?: pulumi.Input<string>;
}

export interface DeploymentOutputs {
  url: pulumi.Output<string>;
  distributionId: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  functionArn: pulumi.Output<string>;
}

// AWS Lambda reserved environment variable prefixes
export const RESERVED_ENV_PREFIXES = [
  'AWS_',
  'LAMBDA_',
  '_HANDLER',
  '_X_AMZN_'
] as const;

// CloudFront managed cache policy IDs
export const CACHE_POLICIES = {
  CACHING_DISABLED: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
  CACHING_OPTIMIZED: '658327ea-f89d-4fab-a63d-7e88639e58f6',
  CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS: 'b2884449-e4de-46a7-ac36-70bc7f1ddd6d',
} as const;

// CloudFront managed origin request policy IDs
export const ORIGIN_REQUEST_POLICIES = {
  ALL_VIEWER_EXCEPT_HOST_HEADER: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
  CORS_S3_ORIGIN: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
  CORS_CUSTOM_ORIGIN: '59781a5b-3903-41f3-afcb-af62929ccde1',
} as const;

// CloudFront managed response headers policy IDs
export const RESPONSE_HEADERS_POLICIES = {
  CORS_WITH_PREFLIGHT: '5cc3b908-e619-4b99-88e5-2cf7f45965bd',
  SECURITY_HEADERS: '67f7725c-6f97-4210-82d7-5512b31e9d03',
} as const;