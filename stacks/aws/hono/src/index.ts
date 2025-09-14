import * as pulumi from '@pulumi/pulumi';
import { existsSync } from 'fs';
import { join } from 'path';

// Import types
import { HonoNucelAwsArgs, DeploymentOutputs } from './types.js';

// Import components
import { createLambda } from './components/lambda.js';
import { createS3Bucket } from './components/s3.js';
import { createCloudFrontDistribution } from './components/cloudfront.js';

/**
 * Hono Nucel AWS Component
 * 
 * This component deploys a Hono application to AWS using:
 * - Lambda for serverless API execution
 * - S3 for static assets (optional)
 * - CloudFront for CDN distribution
 */
export class HonoNucelAws extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly functionArn: pulumi.Output<string>;
  
  constructor(
    name: string,
    args: HonoNucelAwsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nucel:hono-aws', name, {}, opts);
    
    const { 
      buildPath, 
      environment = {}, 
      lambda = {}, 
      priceClass = 'PriceClass_100', 
      domain,
      tags = {},
      streaming = false,
      edge = false, // TODO: Implement Lambda@Edge support
    } = args;
    
    // Validate build path
    if (!existsSync(buildPath)) {
      throw new Error(`Build path does not exist: ${buildPath}`);
    }
    
    const serverPath = join(buildPath, 'server');
    const staticPath = join(buildPath, 'static');
    
    if (!existsSync(serverPath)) {
      throw new Error('Invalid build structure. Expected server/ directory.');
    }
    
    // Create S3 bucket and upload static assets (if any)
    const s3Result = createS3Bucket({
      name,
      staticPath,
      tags,
      parent: this,
    });
    
    // Create Lambda function with optional streaming
    const lambdaResult = createLambda({
      name,
      serverPath,
      environment,
      lambda,
      tags,
      parent: this,
      streaming,
    });
    
    // Create CloudFront distribution
    const distribution = createCloudFrontDistribution({
      name,
      bucket: s3Result.bucket,
      functionUrl: lambdaResult.functionUrl,
      oai: s3Result.oai,
      s3Objects: s3Result.objects,
      priceClass,
      domain,
      tags,
      parent: this,
    });
    
    // Set outputs
    this.url = distribution.domainName.apply(domain => `https://${domain}`);
    this.distributionId = distribution.id;
    this.bucketName = s3Result.bucket.id;
    this.functionArn = lambdaResult.function.arn;
    
    this.registerOutputs({
      url: this.url,
      distributionId: this.distributionId,
      bucketName: this.bucketName,
      functionArn: this.functionArn,
    });
  }
}

// Re-export types for convenience
export type { HonoNucelAwsArgs, HonoBuildConfig, HonoNucelAwsAdapterOptions } from './types.js';
export type { LambdaConfig, DomainConfig } from './types.js';

// Also export the adapter
export { default as adapter } from './adapter/index.js';

// Export a helper to create Hono AWS deployment
export function createHonoAwsDeployment(
  name: string,
  args: HonoNucelAwsArgs,
  opts?: pulumi.ComponentResourceOptions
): HonoNucelAws {
  return new HonoNucelAws(name, args, opts);
}