import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { CustomErrorResponse, CacheBehavior, CloudFrontLoggingConfig } from "../types/index.js";

interface CloudFrontDistributionArgs {
  name: string;
  bucketRegionalDomainName: pulumi.Output<string>;
  bucketId: pulumi.Output<string>;
  originAccessControlId: pulumi.Output<string>;
  domain?: {
    name: string;
    certificateArn?: pulumi.Input<string>;
    includeWWW?: boolean;
  };
  priceClass?: string;
  logging?: CloudFrontLoggingConfig;
  waitForDeployment?: boolean;
  customErrorResponses?: CustomErrorResponse[];
  cacheBehaviors?: CacheBehavior[];
  defaultRootObject?: string;
  enableCompression?: boolean;
  tags?: Record<string, string>;
}

export function createCloudFrontDistribution(
  args: CloudFrontDistributionArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const aliases = args.domain 
    ? args.domain.includeWWW !== false
      ? [args.domain.name, `www.${args.domain.name}`]
      : [args.domain.name]
    : undefined;

  // Default SPA error responses
  const defaultSPAErrorResponses: CustomErrorResponse[] = [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 0,
    },
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 0,
    },
  ];

  const customErrorResponses = args.customErrorResponses || defaultSPAErrorResponses;

  const originId = `${args.name}-s3-origin`;

  // Create cache policy for static assets
  const staticAssetsCachePolicy = new aws.cloudfront.CachePolicy(
    `${args.name}-static-assets-cache-policy`,
    {
      name: `${args.name}-static-assets-policy`,
      comment: "Cache policy for static assets",
      defaultTtl: 86400, // 1 day
      maxTtl: 31536000, // 1 year
      minTtl: 1,
      parametersInCacheKeyAndForwardedToOrigin: {
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        queryStringsConfig: {
          queryStringBehavior: "none",
        },
        headersConfig: {
          headerBehavior: "none",
        },
        cookiesConfig: {
          cookieBehavior: "none",
        },
      },
    },
    opts
  );

  // Create cache policy for HTML/dynamic content
  const dynamicContentCachePolicy = new aws.cloudfront.CachePolicy(
    `${args.name}-dynamic-content-cache-policy`,
    {
      name: `${args.name}-dynamic-content-policy`,
      comment: "Cache policy for HTML and dynamic content",
      defaultTtl: 0,
      maxTtl: 86400,
      minTtl: 0,
      parametersInCacheKeyAndForwardedToOrigin: {
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        queryStringsConfig: {
          queryStringBehavior: "all",
        },
        headersConfig: {
          headerBehavior: "none",
        },
        cookiesConfig: {
          cookieBehavior: "none",
        },
      },
    },
    opts
  );

  // Build cache behaviors
  const orderedCacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = [
    {
      pathPattern: "*.js",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: true,
    },
    {
      pathPattern: "*.css",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: true,
    },
    {
      pathPattern: "*.jpg",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: false,
    },
    {
      pathPattern: "*.jpeg",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: false,
    },
    {
      pathPattern: "*.png",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: false,
    },
    {
      pathPattern: "*.gif",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: false,
    },
    {
      pathPattern: "*.svg",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: true,
    },
    {
      pathPattern: "*.woff",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: true,
    },
    {
      pathPattern: "*.woff2",
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: staticAssetsCachePolicy.id,
      compress: true,
    },
  ];

  const distributionArgs: aws.cloudfront.DistributionArgs = {
    enabled: true,
    isIpv6Enabled: true,
    httpVersion: "http2and3",
    priceClass: args.priceClass || "PriceClass_100",
    aliases,
    waitForDeployment: args.waitForDeployment !== false,
    tags: args.tags,
    defaultRootObject: args.defaultRootObject || "index.html",

    origins: [
      {
        originId,
        domainName: args.bucketRegionalDomainName,
        originAccessControlId: args.originAccessControlId,
        s3OriginConfig: {
          originAccessIdentity: "", // Empty string when using OAC
        },
      },
    ],

    defaultCacheBehavior: {
      targetOriginId: originId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      cachePolicyId: dynamicContentCachePolicy.id,
      compress: args.enableCompression !== false,
    },

    orderedCacheBehaviors,

    customErrorResponses: customErrorResponses.map(err => ({
      errorCode: err.errorCode,
      responseCode: err.responseCode,
      responsePagePath: err.responsePagePath,
      errorCachingMinTtl: err.errorCachingMinTtl,
    })),

    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },

    viewerCertificate: args.domain?.certificateArn
      ? {
          acmCertificateArn: args.domain.certificateArn,
          sslSupportMethod: "sni-only",
          minimumProtocolVersion: "TLSv1.2_2021",
        }
      : {
          cloudfrontDefaultCertificate: true,
        },
  };

  if (args.logging) {
    distributionArgs.loggingConfig = {
      bucket: args.logging.bucket!,
      prefix: args.logging.prefix,
      includeCookies: args.logging.includeCookies || false,
    };
  }

  const distribution = new aws.cloudfront.Distribution(
    `${args.name}-cdn`,
    distributionArgs,
    opts
  );

  return {
    distribution,
    distributionId: distribution.id,
    distributionArn: distribution.arn,
    domainName: distribution.domainName,
    hostedZoneId: distribution.hostedZoneId,
    url: args.domain 
      ? pulumi.interpolate`https://${args.domain.name}`
      : pulumi.interpolate`https://${distribution.domainName}`,
  };
}