import * as pulumi from '@pulumi/pulumi';
import { existsSync } from 'fs';
import { join } from 'path';

// Import types
import { ReactRouterNucelAwsArgs, DeploymentOutputs } from './types.js';

// Import components
import { createLambda } from './components/lambda.js';
import { createS3Bucket } from './components/s3.js';
import { createCloudFrontDistribution } from './components/cloudfront.js';

/**
 * React Router Nucel AWS Component
 * 
 * This component deploys a React Router application to AWS using:
 * - Lambda for server-side rendering
 * - S3 for static assets
 * - CloudFront for CDN distribution
 */
export class ReactRouterNucelAws extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly functionArn: pulumi.Output<string>;
  
  constructor(
    name: string,
    args: ReactRouterNucelAwsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nucel:react-router-aws', name, {}, opts);
    
    const { 
      buildPath, 
      environment = {}, 
      lambda = {}, 
      priceClass = 'PriceClass_100', 
      domain,
      tags = {} 
    } = args;
    
    // Validate build path
    if (!existsSync(buildPath)) {
      throw new Error(`Build path does not exist: ${buildPath}`);
    }
    
    const serverPath = join(buildPath, 'server');
    const clientPath = join(buildPath, 'client');
    
    if (!existsSync(serverPath) || !existsSync(clientPath)) {
      throw new Error('Invalid build structure. Expected server/ and client/ directories.');
    }
    
    // Create S3 bucket and upload assets
    const s3Result = createS3Bucket({
      name,
      clientPath,
      tags,
      parent: this,
    });
    
    // Create Lambda function
    const lambdaResult = createLambda({
      name,
      serverPath,
      environment,
      lambda,
      tags,
      parent: this,
    });
    
    // Create CloudFront distribution
    const distribution = createCloudFrontDistribution({
      name,
      bucket: s3Result.bucket,
      functionUrl: lambdaResult.functionUrl,
      oai: s3Result.oai,
      uploadCommands: s3Result.uploadCommands,
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
export type { ReactRouterNucelAwsArgs } from './types.js';
export type { LambdaConfig, DomainConfig } from './types.js';

// Also export the adapter
export { default as adapter } from './adapter/index.js';