import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { 
  CACHE_POLICIES, 
  ORIGIN_REQUEST_POLICIES, 
  RESPONSE_HEADERS_POLICIES,
  DomainConfig 
} from '../types.js';

export interface CreateCloudFrontArgs {
  name: string;
  bucket: aws.s3.Bucket;
  functionUrl: aws.lambda.FunctionUrl;
  oai: aws.cloudfront.OriginAccessIdentity;
  s3Objects: aws.s3.BucketObject[];
  priceClass?: string;
  domain?: DomainConfig;
  tags?: Record<string, string>;
  parent: pulumi.ComponentResource;
}

export function createCloudFrontDistribution(args: CreateCloudFrontArgs): aws.cloudfront.Distribution {
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
  const distribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
    enabled: true,
    httpVersion: 'http2and3', // Enable HTTP/2 and HTTP/3
    priceClass,
    isIpv6Enabled: true, // Enable IPv6
    comment: `CloudFront distribution for ${name} React Router app`,
    waitForDeployment: true,
    
    origins: [
      // S3 origin for static assets
      {
        domainName: bucket.bucketRegionalDomainName,
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
      cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
      compress: true,
      
      // Use AWS managed policies
      cachePolicyId: CACHE_POLICIES.CACHING_DISABLED, // Dynamic SSR content
      originRequestPolicyId: ORIGIN_REQUEST_POLICIES.ALL_VIEWER_EXCEPT_HOST_HEADER,
      responseHeadersPolicyId: RESPONSE_HEADERS_POLICIES.CORS_WITH_PREFLIGHT,
    },
    
    orderedCacheBehaviors: [
      // Assets directory - immutable assets with content hashing
      {
        pathPattern: '/assets/*',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
      },
      // JavaScript files
      {
        pathPattern: '*.js',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
      },
      // CSS files
      {
        pathPattern: '*.css',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
      },
      // Images
      {
        pathPattern: '*.{jpg,jpeg,png,gif,webp,svg,ico}',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
      },
      // Fonts
      {
        pathPattern: '*.{woff,woff2,ttf,otf,eot}',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
        originRequestPolicyId: ORIGIN_REQUEST_POLICIES.CORS_S3_ORIGIN,
      },
      // Favicon
      {
        pathPattern: '/favicon.ico',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
      },
      // Robots.txt
      {
        pathPattern: '/robots.txt',
        targetOriginId: 's3-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        compress: false,
        cachePolicyId: CACHE_POLICIES.CACHING_OPTIMIZED,
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
    
    // Custom error pages
    customErrorResponses: [
      {
        errorCode: 404,
        responseCode: 404,
        responsePagePath: '/404.html',
        errorCachingMinTtl: 86400,
      },
      {
        errorCode: 403,
        responseCode: 404,
        responsePagePath: '/404.html',
        errorCachingMinTtl: 86400,
      },
    ],
    
    tags,
  }, { parent, dependsOn: s3Objects });
  
  return distribution;
}