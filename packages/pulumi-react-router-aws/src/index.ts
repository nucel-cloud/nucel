import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { globbySync } from 'globby';
import * as mime from 'mime-types';

export interface ReactRouterAwsDeploymentArgs {
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
   * Custom domain configuration
   */
  domain?: {
    name: string;
    certificateArn?: string;
  };
  
  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
}

export class ReactRouterAwsDeployment extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly functionArn: pulumi.Output<string>;
  
  constructor(
    name: string,
    args: ReactRouterAwsDeploymentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('react-router-aws:deployment', name, {}, opts);
    
    const { buildPath, environment = {}, lambda = {}, priceClass = 'PriceClass_100', tags = {} } = args;
    
    // Validate build path
    if (!existsSync(buildPath)) {
      throw new Error(`Build path does not exist: ${buildPath}`);
    }
    
    const serverPath = join(buildPath, 'server');
    const clientPath = join(buildPath, 'client');
    
    if (!existsSync(serverPath) || !existsSync(clientPath)) {
      throw new Error('Invalid build structure. Expected server/ and client/ directories.');
    }
    
    // Create S3 bucket for static assets
    const assetsBucket = new aws.s3.BucketV2(`${name}-assets`, {
      forceDestroy: true,
      tags,
    }, { parent: this });
    
    // Block public access
    new aws.s3.BucketPublicAccessBlock(`${name}-assets-pab`, {
      bucket: assetsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });
    
    // Upload static assets to S3
    const clientFiles = globbySync('**/*', {
      cwd: clientPath,
      dot: true,
    });
    
    const s3Objects: aws.s3.BucketObjectv2[] = [];
    
    for (const file of clientFiles) {
      const filePath = join(clientPath, file);
      const contentType = mime.lookup(file) || 'application/octet-stream';
      
      const s3Object = new aws.s3.BucketObjectv2(`${name}-asset-${file.replace(/[^a-zA-Z0-9]/g, '-')}`, {
        bucket: assetsBucket.id,
        key: file,
        source: new pulumi.asset.FileAsset(filePath),
        contentType,
        cacheControl: file.match(/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
        tags,
      }, { parent: this });
      
      s3Objects.push(s3Object);
    }
    
    // Create Lambda function for SSR
    const lambdaRole = new aws.iam.Role(`${name}-lambda-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags,
    }, { parent: this });
    
    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(`${name}-lambda-policy`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });
    
    // Create Lambda deployment package
    const lambdaZipPath = `/tmp/react-router-lambda-${Date.now()}.zip`;
    
    const createLambdaZip = async (): Promise<pulumi.asset.FileArchive> => {
      return new Promise((resolve, reject) => {
        const output = createWriteStream(lambdaZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
          resolve(new pulumi.asset.FileArchive(lambdaZipPath));
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        
        // Add server files including node_modules
        archive.directory(serverPath, false);
        
        archive.finalize();
      });
    };
    
    const lambdaCode = pulumi.output(createLambdaZip());
    
    // Create Lambda function
    const lambdaFunction = new aws.lambda.Function(`${name}-function`, {
      runtime: 'nodejs20.x',
      handler: 'handler.handler',
      code: lambdaCode,
      role: lambdaRole.arn,
      memorySize: lambda.memory || 512,
      timeout: lambda.timeout || 30,
      architectures: [lambda.architecture || 'arm64'],
      environment: {
        variables: {
          NODE_ENV: 'production',
          ...environment,
        },
      },
      tags,
    }, { parent: this });
    
    // Create Lambda Function URL
    const functionUrl = new aws.lambda.FunctionUrl(`${name}-function-url`, {
      functionName: lambdaFunction.name,
      authorizationType: 'NONE',
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['*'],
        maxAge: 86400,
      },
    }, { parent: this });
    
    // Grant public access to Lambda Function URL
    const lambdaPermission = new aws.lambda.Permission(`${name}-lambda-url-permission`, {
      action: 'lambda:InvokeFunctionUrl',
      function: lambdaFunction.name,
      principal: '*',
      functionUrlAuthType: 'NONE',
    }, { parent: this });
    
    // Create CloudFront Origin Access Identity
    const oai = new aws.cloudfront.OriginAccessIdentity(`${name}-oai`, {
      comment: `OAI for ${name} React Router app`,
    }, { parent: this });
    
    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
      enabled: true,
      httpVersion: 'http2and3',
      priceClass,
      
      origins: [
        // S3 origin for static assets
        {
          domainName: assetsBucket.bucketRegionalDomainName,
          originId: 's3-assets',
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
        // Lambda Function URL origin for SSR
        {
          domainName: functionUrl.functionUrl.apply(url => new URL(url).hostname),
          originId: 'lambda-ssr',
          customHeaders: [
            {
              name: 'x-forwarded-host',
              value: functionUrl.functionUrl.apply(url => new URL(url).hostname),
            },
          ],
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: 'https-only',
            originSslProtocols: ['TLSv1.2'],
            originReadTimeout: 30,
            originKeepaliveTimeout: 5,
          },
        },
      ],
      
      defaultCacheBehavior: {
        targetOriginId: 'lambda-ssr',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        
        // Use managed cache policy and origin request policy for Lambda Function URLs
        cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
        originRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac', // AllViewerExceptHostHeader
        
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 86400,
      },
      
      orderedCacheBehaviors: [
        // Assets directory - must be first to match /assets/* paths
        {
          pathPattern: '/assets/*',
          targetOriginId: 's3-assets',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,
        },
        // Public assets from S3
        {
          pathPattern: '/favicon.ico',
          targetOriginId: 's3-assets',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,
        },
      ],
      
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      
      viewerCertificate: args.domain?.certificateArn
        ? {
            acmCertificateArn: args.domain.certificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: 'TLSv1.2_2021',
          }
        : {
            cloudfrontDefaultCertificate: true,
          },
      
      aliases: args.domain ? [args.domain.name] : undefined,
      
      tags,
    }, { parent: this, dependsOn: s3Objects });
    
    // Update S3 bucket policy to allow CloudFront OAI access
    new aws.s3.BucketPolicy(`${name}-assets-policy`, {
      bucket: assetsBucket.id,
      policy: pulumi.all([oai.iamArn, assetsBucket.id]).apply(([oaiArn, bucketId]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: {
              AWS: oaiArn,
            },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketId}/*`,
          }],
        })
      ),
    }, { parent: this });
    
    // Set outputs
    this.url = distribution.domainName.apply(domain => `https://${domain}`);
    this.distributionId = distribution.id;
    this.bucketName = assetsBucket.id;
    this.functionArn = lambdaFunction.arn;
    
    this.registerOutputs({
      url: this.url,
      distributionId: this.distributionId,
      bucketName: this.bucketName,
      functionArn: this.functionArn,
    });
  }
}