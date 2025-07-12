import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions, DomainConfig, CloudFrontLoggingConfig } from "../../types/index.js";
import { createCachePolicies, createResponseHeadersPolicy, createViewerRequestFunction } from "./policies.js";

export type CloudFrontArgs = {
  name: string;
  serverFunctionUrl?: pulumi.Output<string>;
  imageFunctionUrl?: pulumi.Output<string>;
  bucketRegionalDomainName: pulumi.Output<string>;
  bucketId: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
  assetPathPatterns: string[];
  domain?: DomainConfig;
  priceClass?: string;
  logging?: CloudFrontLoggingConfig;
  tags?: Record<string, string>;
};

export type CloudFrontOutputs = {
  distribution: aws.cloudfront.Distribution;
  distributionId: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
  url: pulumi.Output<string>;
};

export function createCloudFrontDistribution(
  args: CloudFrontArgs,
  opts?: ComponentOptions
): CloudFrontOutputs {
  const {
    name,
    serverFunctionUrl,
    imageFunctionUrl,
    bucketRegionalDomainName,
    bucketId,
    bucketArn,
    assetPathPatterns,
    domain,
    priceClass = "PriceClass_100",
    logging,
    tags = {},
  } = args;

  // Origin Access Identity
  const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(`${name}-oai`, {
    comment: `OAI for ${name}`,
  }, opts);

  // Policies and Functions
  const policies = createCachePolicies(name, opts);
  const responseHeadersPolicy = createResponseHeadersPolicy(name, opts);
  const viewerRequestFunction = createViewerRequestFunction(name, opts);

  // Build origins
  const origins: aws.types.input.cloudfront.DistributionOrigin[] = [];

  if (serverFunctionUrl) {
    origins.push({
      originId: "server",
      domainName: serverFunctionUrl.apply(url => 
        url.replace("https://", "").replace("/", "")
      ),
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
        originReadTimeout: 60,
        originKeepaliveTimeout: 60,
      },
    });
  }

  if (imageFunctionUrl) {
    origins.push({
      originId: "image",
      domainName: imageFunctionUrl.apply(url => 
        url.replace("https://", "").replace("/", "")
      ),
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
        originReadTimeout: 60,
        originKeepaliveTimeout: 60,
      },
    });
  }

  origins.push({
    originId: "static",
    domainName: bucketRegionalDomainName,
    originPath: "/_assets",
    s3OriginConfig: {
      originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
    },
  });

  // Build cache behaviors
  const orderedCacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = [
    {
      pathPattern: "_next/static/*",
      targetOriginId: "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: policies.staticAssetsOptimizedCache.id,
    },
    {
      pathPattern: "_next/data/*",
      targetOriginId: serverFunctionUrl ? "server" : "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: policies.serverCachePolicy.id,
      originRequestPolicyId: policies.serverOriginRequestPolicy,
      functionAssociations: [{
        eventType: "viewer-request",
        functionArn: viewerRequestFunction.arn,
      }],
    },
  ];

  if (imageFunctionUrl) {
    orderedCacheBehaviors.push({
      pathPattern: "_next/image*",
      targetOriginId: "image",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: policies.serverCachePolicy.id,
      originRequestPolicyId: policies.serverOriginRequestPolicy,
    });
  }

  orderedCacheBehaviors.push(
    {
      pathPattern: "api/*",
      targetOriginId: serverFunctionUrl ? "server" : "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      compress: true,
      cachePolicyId: policies.serverCachePolicy.id,
      originRequestPolicyId: policies.serverOriginRequestPolicy,
      responseHeadersPolicyId: responseHeadersPolicy.id,
      functionAssociations: [{
        eventType: "viewer-request",
        functionArn: viewerRequestFunction.arn,
      }],
    },
    {
      pathPattern: "app/*",
      targetOriginId: serverFunctionUrl ? "server" : "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      compress: true,
      cachePolicyId: policies.serverCachePolicy.id,
      originRequestPolicyId: policies.serverOriginRequestPolicy,
      responseHeadersPolicyId: responseHeadersPolicy.id,
      functionAssociations: [{
        eventType: "viewer-request",
        functionArn: viewerRequestFunction.arn,
      }],
    },
    ...assetPathPatterns.map(pattern => ({
      pathPattern: pattern,
      targetOriginId: "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: policies.staticAssetsOptimizedCache.id,
    }))
  );

  // Create distribution
  const distribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
    enabled: true,
    httpVersion: "http3",
    isIpv6Enabled: true,
    priceClass,
    waitForDeployment: true,
    
    aliases: domain ? [domain.name] : [],
    viewerCertificate: domain?.certificateArn ? {
      acmCertificateArn: domain.certificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    } : {
      cloudfrontDefaultCertificate: true,
    },
    
    origins,
    
    defaultCacheBehavior: serverFunctionUrl ? {
      targetOriginId: "server",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      compress: true,
      cachePolicyId: policies.serverCachePolicy.id,
      originRequestPolicyId: policies.serverOriginRequestPolicy,
      responseHeadersPolicyId: responseHeadersPolicy.id,
      functionAssociations: [{
        eventType: "viewer-request",
        functionArn: viewerRequestFunction.arn,
      }],
    } : {
      targetOriginId: "static",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      compress: true,
      cachePolicyId: policies.staticCachePolicy,
    },
    
    orderedCacheBehaviors,
    
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    
    customErrorResponses: [
      {
        errorCode: 403,
        responseCode: 200,
        responsePagePath: "/404",
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: "/404",
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 502,
        responseCode: 502,
        responsePagePath: "/error.html",
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 503,
        responseCode: 503,
        responsePagePath: "/error.html",
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 504,
        responseCode: 504,
        responsePagePath: "/error.html",
        errorCachingMinTtl: 0,
      },
    ],
    
    defaultRootObject: "",
    
    loggingConfig: logging ? {
      bucket: logging.bucket,
      prefix: logging.prefix ?? `${name}/`,
      includeCookies: false,
    } : undefined,
    
    tags,
  }, opts);

  // S3 bucket policy for CloudFront
  new aws.s3.BucketPolicy(`${name}-assets-policy`, {
    bucket: bucketId,
    policy: pulumi.all([bucketArn, originAccessIdentity.s3CanonicalUserId])
      .apply(([arn, oaiUserId]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontServicePrincipal",
            Effect: "Allow",
            Principal: {
              CanonicalUser: oaiUserId,
            },
            Action: "s3:GetObject",
            Resource: `${arn}/*`,
          },
          {
            Sid: "AllowCloudFrontServicePrincipalBucket",
            Effect: "Allow",
            Principal: {
              CanonicalUser: oaiUserId,
            },
            Action: "s3:ListBucket",
            Resource: arn,
          },
        ],
      })),
  }, opts);

  return {
    distribution,
    distributionId: distribution.id,
    domainName: distribution.domainName,
    url: pulumi.interpolate`https://${distribution.domainName}`,
  };
}