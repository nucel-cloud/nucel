import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";

interface S3ComponentArgs {
  name: string;
  environment?: string;
  tags?: Record<string, string>;
}

export function createS3Component(
  args: S3ComponentArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const bucketName = args.environment 
    ? `${args.name}-${args.environment}-static`
    : `${args.name}-static`;

  const bucket = new aws.s3.BucketV2(
    `${bucketName}-bucket`,
    {
      bucket: bucketName,
      tags: args.tags,
    },
    opts
  );

  const bucketVersioning = new aws.s3.BucketVersioningV2(
    `${bucketName}-versioning`,
    {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    },
    opts
  );

  const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `${bucketName}-pab`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    opts
  );

  return {
    bucket,
    bucketName: bucket.id,
    bucketArn: bucket.arn,
    bucketRegionalDomainName: bucket.bucketRegionalDomainName,
    bucketVersioning,
    publicAccessBlock,
  };
}

export function createLogsBucket(
  args: S3ComponentArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const bucketName = args.environment 
    ? `${args.name}-${args.environment}-logs`
    : `${args.name}-logs`;

  const bucket = new aws.s3.BucketV2(
    `${bucketName}-bucket`,
    {
      bucket: bucketName,
      tags: args.tags,
    },
    opts
  );

  const bucketAcl = new aws.s3.BucketAclV2(
    `${bucketName}-acl`,
    {
      bucket: bucket.id,
      acl: "log-delivery-write",
    },
    opts
  );

  const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
    `${bucketName}-lifecycle`,
    {
      bucket: bucket.id,
      rules: [
        {
          id: "delete-old-logs",
          status: "Enabled",
          expiration: {
            days: 90,
          },
        },
      ],
    },
    opts
  );

  return {
    bucket,
    bucketName: bucket.id,
    bucketDomainName: bucket.bucketDomainName,
  };
}

interface UploadAssetsArgs {
  name: string;
  bucket: aws.s3.BucketV2;
  sitePath: string;
  tags?: Record<string, string>;
}

export function uploadAssets(
  args: UploadAssetsArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const objects: aws.s3.BucketObjectv2[] = [];
  
  function crawlDirectory(dir: string, prefix: string = "") {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        crawlDirectory(filePath, path.join(prefix, file));
      } else if (stat.isFile()) {
        const key = path.join(prefix, file).replace(/\\/g, '/');
        const contentType = mime.lookup(filePath) || 'application/octet-stream';
        
        // Determine cache control based on file type
        let cacheControl = "public, max-age=31536000, immutable"; // Default for assets
        
        if (filePath.endsWith('.html')) {
          cacheControl = "public, max-age=0, must-revalidate";
        } else if (filePath.endsWith('.json')) {
          cacheControl = "public, max-age=3600";
        }
        
        const object = new aws.s3.BucketObjectv2(
          `${args.name}-object-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`,
          {
            bucket: args.bucket.id,
            key,
            source: new pulumi.asset.FileAsset(filePath),
            contentType,
            cacheControl,
            metadata: {
              ...args.tags,
            },
          },
          { ...opts, parent: args.bucket }
        );
        
        objects.push(object);
      }
    }
  }
  
  crawlDirectory(args.sitePath);
  
  return { objects };
}

export function createOriginAccessControl(
  name: string,
  opts?: pulumi.ComponentResourceOptions
) {
  return new aws.cloudfront.OriginAccessControl(
    `${name}-oac`,
    {
      name: `${name}-oac`,
      description: `Origin Access Control for ${name}`,
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4",
    },
    opts
  );
}

export function createBucketPolicy(
  name: string,
  bucket: aws.s3.BucketV2,
  distributionArn: pulumi.Output<string>,
  opts?: pulumi.ComponentResourceOptions
) {
  return new aws.s3.BucketPolicy(
    `${name}-bucket-policy`,
    {
      bucket: bucket.id,
      policy: pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontServicePrincipal",
            Effect: "Allow",
            Principal: {
              Service: "cloudfront.amazonaws.com",
            },
            Action: "s3:GetObject",
            Resource: pulumi.interpolate`${bucket.arn}/*`,
            Condition: {
              StringEquals: {
                "AWS:SourceArn": distributionArn,
              },
            },
          },
        ],
      }),
    },
    opts
  );
}