import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { CACHE_POLICIES, ORIGIN_REQUEST_POLICIES, RESPONSE_HEADERS_POLICIES } from '../types.js';

export interface CreateCloudFrontArgs {
  name: string;
  bucket: aws.s3.Bucket;
  functionUrl: aws.lambda.FunctionUrl;
  oai: aws.cloudfront.OriginAccessIdentity;
  s3Objects: aws.s3.BucketObject[];
  priceClass?: string;
  domain?: {
    name: string;
    certificateArn: string;
  };
  tags?: Record<string, string>;
  parent?: pulumi.ComponentResource;
}

export function createCloudFrontDistribution(args: CreateCloudFrontArgs) {
  const {
    name,
    bucket,
    functionUrl,
    oai,
    s3Objects,
    priceClass = 'PriceClass_100',
    domain,
    tags = {},
    parent
  } = args;

  // Create CloudFront distribution with performance optimizations
  const distribution = new aws.cloudfront.Distribution(
    `${name}-distribution`,
    {
      enabled: true,
      httpVersion: 'http2and3', // Enable HTTP/2 and HTTP/3
      priceClass,
      isIpv6Enabled: true, // Enable IPv6
      comment: `CloudFront distribution for ${name} Hono app`,
      waitForDeployment: true,
      
      origins: [
        // Lambda Function URL origin for API
        {
          domainName: functionUrl.functionUrl.apply(url => new URL(url).hostname),
          originId: 'lambda-api',
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
        // S3 origin for static assets (if any)
        {
          domainName: bucket.bucketRegionalDomainName,
          originId: 's3-static',
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
      ],
      
      defaultCacheBehavior: {
        targetOriginId: 'lambda-api',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        // Use AWS managed policies for API endpoints
        cachePolicyId: CACHE_POLICIES.CACHING_DISABLED, // Dynamic API content
        originRequestPolicyId: ORIGIN_REQUEST_POLICIES.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicyId: RESPONSE_HEADERS_POLICIES.CORS_WITH_PREFLIGHT,
      },
      
      orderedCacheBehaviors: [
        // Static assets patterns
        {
          pathPattern: '/static/*',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        {
          pathPattern: '/assets/*',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        // Common static file extensions
        {
          pathPattern: '*.css',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        {
          pathPattern: '*.js',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        // Images
        {
          pathPattern: '*.jpg',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.jpeg',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.png',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.gif',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.webp',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.svg',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        {
          pathPattern: '*.ico',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        },
        // Fonts
        {
          pathPattern: '*.woff',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        {
          pathPattern: '*.woff2',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        {
          pathPattern: '*.ttf',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
        {
          pathPattern: '*.otf',
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
          originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
        },
      ],
      
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      
      viewerCertificate: domain?.certificateArn
        ? {
            acmCertificateArn: domain.certificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: 'TLSv1.2_2021',
          }
        : {
            cloudfrontDefaultCertificate: true,
          },
      
      aliases: domain ? [domain.name] : undefined,
      
      // Custom error pages for API
      customErrorResponses: [
        {
          errorCode: 404,
          responseCode: 404,
          responsePagePath: '/404',
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 403,
          responseCode: 403,
          responsePagePath: '/403',
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 500,
          responseCode: 500,
          responsePagePath: '/500',
          errorCachingMinTtl: 60,
        },
      ],
      
      tags,
    },
    { parent, dependsOn: s3Objects }
  );

  return distribution;
}