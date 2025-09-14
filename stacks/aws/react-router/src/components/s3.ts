import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { join } from 'path';
import { globbySync } from 'globby';
import * as mime from 'mime-types';

export interface CreateS3BucketArgs {
  name: string;
  clientPath: string;
  tags?: Record<string, string>;
  parent: pulumi.ComponentResource;
}

export interface S3Result {
  bucket: aws.s3.Bucket;
  objects: aws.s3.BucketObject[];
  oai: aws.cloudfront.OriginAccessIdentity;
}

export function createS3Bucket(args: CreateS3BucketArgs): S3Result {
  const { name, clientPath, tags = {}, parent } = args;
  
  const assetsBucket = new aws.s3.Bucket(`${name}-assets`, {
    forceDestroy: true,
    tags,
  }, { parent });
  
  new aws.s3.BucketPublicAccessBlock(`${name}-assets-pab`, {
    bucket: assetsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }, { parent });
  
  const clientFiles = globbySync('**/*', {
    cwd: clientPath,
    dot: true,
  });
  
  const s3Objects: aws.s3.BucketObject[] = [];
  
  for (const file of clientFiles) {
    const filePath = join(clientPath, file);
    const contentType = mime.lookup(file) || 'application/octet-stream';
    
    let cacheControl = 'public, max-age=31536000, immutable'; // Default: 1 year for hashed assets
    
    if (file.endsWith('.html')) {
      cacheControl = 'public, max-age=3600'; // 1 hour for HTML
    }
    
    if (file.endsWith('.json') && !file.includes('manifest')) {
      cacheControl = 'public, max-age=86400'; // 1 day for data files
    }
    
    const s3Object = new aws.s3.BucketObject(
      `${name}-asset-${file.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        bucket: assetsBucket.id,
        key: file,
        source: new pulumi.asset.FileAsset(filePath),
        contentType,
        cacheControl,
        metadata: {
          'x-amz-meta-source': 'react-router-build',
        },
      },
      { parent }
    );
    
    s3Objects.push(s3Object);
  }
  
  const oai = new aws.cloudfront.OriginAccessIdentity(`${name}-oai`, {
    comment: `OAI for ${name} React Router app`,
  }, { parent });
  
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
  }, { parent });
  
  return {
    bucket: assetsBucket,
    objects: s3Objects,
    oai,
  };
}