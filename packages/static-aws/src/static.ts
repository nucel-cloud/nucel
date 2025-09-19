import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { StaticSiteArgs } from "./types/index.js";
import { 
  createS3Component, 
  createLogsBucket, 
  uploadAssets, 
  createOriginAccessControl,
  createBucketPolicy
} from "./components/s3.js";
import { createCloudFrontDistribution } from "./components/cloudfront.js";
import { createCertificate } from "./components/acm.js";
import { createAliasRecord, createWWWAliasRecord } from "./components/route53.js";

export class StaticSite extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;
  public readonly distributionDomainName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly certificateArn?: pulumi.Output<string>;

  constructor(
    name: string,
    args: StaticSiteArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("nucel:aws:StaticSite", name, {}, opts);

    const defaultOptions = { parent: this };

    // Create S3 bucket for static content
    const s3 = createS3Component(
      {
        name,
        environment: args.environment,
        tags: args.tags,
      },
      defaultOptions
    );

    // Create logs bucket if logging is enabled
    let logsBucket: ReturnType<typeof createLogsBucket> | undefined;
    if (args.logging && !args.logging.bucket) {
      logsBucket = createLogsBucket(
        {
          name,
          environment: args.environment,
          tags: args.tags,
        },
        defaultOptions
      );
    }

    // Upload static assets to S3
    uploadAssets(
      {
        name,
        bucket: s3.bucket,
        sitePath: args.sitePath,
        tags: args.tags,
      },
      defaultOptions
    );

    // Create Origin Access Control for CloudFront
    const oac = createOriginAccessControl(name, defaultOptions);

    // Handle certificate creation or use existing
    let certificateArn: pulumi.Input<string> | undefined;
    if (args.domain) {
      if (args.domain.certificateArn) {
        certificateArn = args.domain.certificateArn;
        this.certificateArn = pulumi.output(certificateArn);
      } else {
        const cert = createCertificate(
          {
            domainName: args.domain.name,
            includeWWW: args.domain.includeWWW,
            hostedZoneId: args.domain.hostedZoneId,
            tags: args.tags,
          },
          defaultOptions
        );
        certificateArn = cert.certificateArn;
        this.certificateArn = cert.certificateArn;
      }
    }

    // Create CloudFront distribution
    const cloudfront = createCloudFrontDistribution(
      {
        name,
        bucketRegionalDomainName: s3.bucketRegionalDomainName,
        bucketId: s3.bucketName,
        originAccessControlId: oac.id,
        domain: args.domain
          ? {
              name: args.domain.name,
              certificateArn,
              includeWWW: args.domain.includeWWW,
            }
          : undefined,
        priceClass: args.priceClass,
        logging: args.logging
          ? {
              bucket: args.logging.bucket || logsBucket?.bucketDomainName,
              prefix: args.logging.prefix || `${name}/`,
              includeCookies: args.logging.includeCookies,
            }
          : undefined,
        waitForDeployment: args.waitForDeployment,
        customErrorResponses: args.customErrorResponses,
        cacheBehaviors: args.cacheBehaviors,
        defaultRootObject: args.defaultRootObject,
        enableCompression: args.enableCompression,
        tags: args.tags,
      },
      defaultOptions
    );

    // Create bucket policy to allow CloudFront access
    createBucketPolicy(
      name,
      s3.bucket,
      cloudfront.distributionArn,
      { ...defaultOptions, dependsOn: [s3.publicAccessBlock] }
    );

    // Create Route53 DNS records if domain is configured
    if (args.domain) {
      createAliasRecord(
        {
          domainName: args.domain.name,
          distribution: cloudfront.distribution,
          hostedZoneId: args.domain.hostedZoneId,
        },
        defaultOptions
      );

      if (args.domain.includeWWW !== false) {
        createWWWAliasRecord(
          args.domain.name,
          cloudfront.distribution,
          args.domain.hostedZoneId,
          defaultOptions
        );
      }
    }

    // Set outputs
    this.url = cloudfront.url;
    this.distributionId = cloudfront.distributionId;
    this.distributionDomainName = cloudfront.domainName;
    this.bucketName = s3.bucketName;
    this.bucketArn = s3.bucketArn;

    this.registerOutputs({
      url: this.url,
      distributionId: this.distributionId,
      distributionDomainName: this.distributionDomainName,
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
      certificateArn: this.certificateArn,
    });
  }

  /**
   * Invalidate CloudFront cache
   */
  public invalidateCache(paths: string[] = ["/*"]): pulumi.Output<aws.cloudfront.Invalidation> {
    return this.distributionId.apply(distId => 
      new aws.cloudfront.Invalidation(
        `${distId}-invalidation-${Date.now()}`,
        {
          distributionId: distId,
          paths,
        },
        { parent: this }
      )
    );
  }
}