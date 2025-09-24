import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as command from '@pulumi/command';
import { join } from 'path';
import { globbySync } from 'globby';
import * as mime from 'mime-types';
import * as crypto from 'crypto';

export interface CreateS3BucketArgs {
  name: string;
  clientPath: string;
  tags?: Record<string, string>;
  parent: pulumi.ComponentResource;
}

export interface S3Result {
  bucket: aws.s3.Bucket;
  uploadCommands: command.local.Command[];
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

  const uploadCommands: command.local.Command[] = [];
  const uploadTasks: {
    file: string;
    key: string;
    cacheControl: string;
    contentType: string;
    hex: string;
  }[] = [];

  // Prepare upload tasks
  for (const file of clientFiles) {
    const hex = crypto.createHash('sha256').update(file).digest('hex').substring(0, 8);
    const key = file; // React Router uses flat structure, not _assets prefix

    // Determine cache control
    let cacheControl = 'public, max-age=31536000, immutable'; // Default: 1 year for hashed assets

    if (file.endsWith('.html')) {
      cacheControl = 'public, max-age=3600'; // 1 hour for HTML
    } else if (file.endsWith('.json') && !file.includes('manifest')) {
      cacheControl = 'public, max-age=86400'; // 1 day for data files
    } else if (file.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|otf)$/i)) {
      cacheControl = 'public, max-age=2592000, s-maxage=31536000';
    } else if (file.match(/\.(css|js)$/i) && !file.match(/\.[0-9a-f]{8,}\./)) {
      cacheControl = 'public, max-age=86400, s-maxage=2592000, must-revalidate';
    }

    // Get content type
    const contentType = mime.lookup(file) || 'application/octet-stream';

    uploadTasks.push({ file, key, cacheControl, contentType, hex });
  }

  const totalFiles = uploadTasks.length;
  console.log(`Creating ${totalFiles} S3 upload commands for React Router assets...`);

  // Use Command provider to upload files with proper content-type
  // Similar to Terraform's approach but batched for efficiency
  const BATCH_SIZE = 10;

  for (let i = 0; i < uploadTasks.length; i += BATCH_SIZE) {
    const batch = uploadTasks.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE);

    // Create a command that uploads multiple files
    const uploadCommand = new command.local.Command(`${name}-assets-batch-${batchIndex}`, {
      create: pulumi.all([assetsBucket.bucket, aws.getRegion()]).apply(([bucketName, region]) => {
        // First sync to delete old files (only on first batch)
        const syncCommand = batchIndex === 0
          ? `aws s3 sync "${clientPath}" "s3://${bucketName}" --delete --region "${region.name}" && `
          : '';

        // Build multiple aws s3 cp commands joined with &&
        const commands = batch.map(task => {
          const source = join(clientPath, task.file);
          const target = `s3://${bucketName}/${task.key}`;
          return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
        });

        return syncCommand + commands.join(' && ');
      }),
      update: pulumi.all([assetsBucket.bucket, aws.getRegion()]).apply(([bucketName, region]) => {
        // First sync to delete old files (only on first batch)
        const syncCommand = batchIndex === 0
          ? `aws s3 sync "${clientPath}" "s3://${bucketName}" --delete --region "${region.name}" && `
          : '';

        // Same for updates
        const commands = batch.map(task => {
          const source = join(clientPath, task.file);
          const target = `s3://${bucketName}/${task.key}`;
          return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
        });

        return syncCommand + commands.join(' && ');
      }),
      environment: {
        AWS_PAGER: '', // Disable pager
      },
    }, { ...{ parent }, dependsOn: [assetsBucket] });

    uploadCommands.push(uploadCommand);
  }

  console.log(`Created ${Math.ceil(totalFiles / BATCH_SIZE)} batch upload commands.`)
  
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
    uploadCommands,
    oai,
  };
}