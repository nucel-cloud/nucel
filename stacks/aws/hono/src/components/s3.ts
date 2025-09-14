import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';

export interface CreateS3BucketArgs {
  name: string;
  staticPath: string;
  tags?: Record<string, string>;
  parent?: pulumi.ComponentResource;
}

export interface S3Result {
  bucket: aws.s3.Bucket;
  oai: aws.cloudfront.OriginAccessIdentity;
  objects: aws.s3.BucketObject[];
}

export function createS3Bucket(args: CreateS3BucketArgs): S3Result {
  const { name, staticPath, tags = {}, parent } = args;

  const bucket = new aws.s3.Bucket(
    `${name}-static-assets`,
    {
      acl: 'private',
      versioning: {
        enabled: false,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [
        {
          enabled: true,
          expiration: {
            days: 90,
          },
          noncurrentVersionExpiration: {
            days: 30,
          },
        },
      ],
      tags,
    },
    { parent }
  );

  // Block public access
  new aws.s3.BucketPublicAccessBlock(
    `${name}-bucket-pab`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { parent }
  );

  // Create Origin Access Identity for CloudFront
  const oai = new aws.cloudfront.OriginAccessIdentity(
    `${name}-oai`,
    {
      comment: `OAI for ${name} Hono app`,
    },
    { parent }
  );

  // Create bucket policy to allow CloudFront access
  new aws.s3.BucketPolicy(
    `${name}-bucket-policy`,
    {
      bucket: bucket.id,
      policy: pulumi.all([bucket.id, oai.iamArn]).apply(([bucketId, oaiArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: oaiArn,
              },
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucketId}/*`,
            },
          ],
        })
      ),
    },
    { parent }
  );

  // Upload static files to S3
  const objects: aws.s3.BucketObject[] = [];
  
  // Check if static directory exists and has files
  let hasStaticFiles = false;
  try {
    const stats = statSync(staticPath);
    if (stats.isDirectory()) {
      const files = readdirSync(staticPath);
      hasStaticFiles = files.length > 0;
    }
  } catch (error) {
    // Static directory doesn't exist, which is fine for API-only apps
    console.log('No static assets directory found - skipping static file upload');
  }

  if (hasStaticFiles) {
    const uploadFiles = (dir: string, prefix = ''): void => {
      const files = readdirSync(dir);
      
      for (const file of files) {
        const filePath = join(dir, file);
        const stats = statSync(filePath);
        
        if (stats.isDirectory()) {
          uploadFiles(filePath, join(prefix, file));
        } else {
          const key = prefix ? join(prefix, file) : file;
          const contentType = lookup(filePath) || 'application/octet-stream';
          
          const obj = new aws.s3.BucketObject(
            `${name}-static-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`,
            {
              bucket: bucket.id,
              key,
              source: new pulumi.asset.FileAsset(filePath),
              contentType,
              // Set cache control based on file type
              cacheControl: getCacheControl(file),
              tags,
            },
            { parent }
          );
          
          objects.push(obj);
        }
      }
    };
    
    uploadFiles(staticPath);
  }

  return {
    bucket,
    oai,
    objects,
  };
}

/**
 * Get appropriate cache control header based on file type
 */
function getCacheControl(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  // Immutable assets (with hash in filename)
  if (filename.includes('.') && /\.[a-f0-9]{8,}\./.test(filename)) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Images and fonts
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext || '')) {
    return 'public, max-age=2592000'; // 30 days
  }
  
  // CSS and JS (without hash)
  if (['css', 'js', 'mjs'].includes(ext || '')) {
    return 'public, max-age=86400'; // 1 day
  }
  
  // HTML and other files
  return 'public, max-age=3600'; // 1 hour
}