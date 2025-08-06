import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import * as crypto from "crypto";
import * as fs from "fs";
import { globSync } from "glob";
import mime from "mime";
import * as path from "path";
import type { ComponentOptions } from "../types/index.js";

export type S3ComponentArgs = {
  name: string;
  forceDestroy?: boolean;
  tags?: Record<string, string>;
};

export type S3ComponentOutputs = {
  bucket: aws.s3.BucketV2;
  bucketArn: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  deploymentId: pulumi.Output<string>;
};

export type UploadAssetsArgs = {
  name: string;
  bucket: aws.s3.BucketV2;
  assetsPath: string;
  tags?: Record<string, string>;
};

export type UploadAssetsOutputs = {
  assetPathPatterns: string[];
  uploadedFiles: pulumi.Output<string>[];
};

export function createS3Component(args: S3ComponentArgs, opts?: ComponentOptions): S3ComponentOutputs {
  const { name, forceDestroy, tags } = args;

  const bucket = new aws.s3.BucketV2(`${name}-assets`, {
    forceDestroy,
    tags,
  }, opts);

  // Public access configuration
  new aws.s3.BucketPublicAccessBlock(`${name}-assets-pab`, {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }, opts);

  // Bucket policy for public read access
  new aws.s3.BucketPolicy(`${name}-assets-policy`, {
    bucket: bucket.id,
    policy: bucket.arn.apply((arn) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `${arn}/*`,
      }],
    })),
  }, opts);

  return {
    bucket,
    bucketArn: bucket.arn,
    bucketName: bucket.bucket,
    deploymentId: bucket.id,
  };
}

export function uploadAssets(
  args: UploadAssetsArgs,
  opts?: ComponentOptions
): UploadAssetsOutputs {
  const { name, bucket, assetsPath } = args;
  const assetPathPatterns: string[] = [];
  const uploadedFiles: pulumi.Output<string>[] = [];

  if (fs.existsSync(assetsPath)) {
    const files = globSync("**", {
      cwd: assetsPath,
      dot: true,
      nodir: true,
      follow: true,
    });

    const uniquePaths = new Set<string>();
    const uploadTasks: {
      file: string;
      key: string;
      cacheControl: string;
      contentType: string;
      hex: string;
    }[] = [];

    for (const file of files) {
      const hex = crypto.createHash("sha256").update(file).digest("hex").substring(0, 8);
      const key = path.join("_assets", file);

      // Collect path patterns
      const pathParts = file.split('/');
      if (!file.startsWith('_next/') && file !== 'BUILD_ID' && pathParts[0] !== '_next') {
        if (pathParts.length === 1) {
          uniquePaths.add(`/${file}`);
        } else if (pathParts[0]) {
          uniquePaths.add(`/${pathParts[0]}/*`);
        }
      }

      // Determine cache control
      let cacheControl = "public,max-age=3600,s-maxage=31536000,must-revalidate";
      
      if (file.match(/\.[0-9a-f]{8,}\./)) {
        cacheControl = "public,max-age=31536000,immutable";
      } else if (file.startsWith("_next/static/")) {
        cacheControl = "public,max-age=31536000,immutable";
      } else if (file.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|otf)$/i)) {
        cacheControl = "public,max-age=2592000,s-maxage=31536000";
      } else if (file.match(/\.(css|js)$/i) && !file.match(/\.[0-9a-f]{8,}\./)) {
        cacheControl = "public,max-age=86400,s-maxage=2592000,must-revalidate";
      }

      // Get content type
      const contentType = mime.getType(file) || "binary/octet-stream";

      uploadTasks.push({ file, key, cacheControl, contentType, hex });
    }

    assetPathPatterns.push(...Array.from(uniquePaths).sort());

    const totalFiles = uploadTasks.length;
    console.log(`Creating ${totalFiles} S3 upload commands...`);

    // Use Command provider to upload files with proper content-type
    // Similar to Terraform's approach but batched for efficiency
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < uploadTasks.length; i += BATCH_SIZE) {
      const batch = uploadTasks.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);
      
      // Create a command that uploads multiple files
      const uploadCommand = new command.local.Command(`${name}-assets-batch-${batchIndex}`, {
        create: pulumi.all([bucket.bucket, aws.getRegion()]).apply(([bucketName, region]) => {
          // Build multiple aws s3 cp commands joined with &&
          const commands = batch.map(task => {
            const source = path.join(assetsPath, task.file);
            const target = `s3://${bucketName}/${task.key}`;
            return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
          });
          
          return commands.join(' && ');
        }),
        update: pulumi.all([bucket.bucket, aws.getRegion()]).apply(([bucketName, region]) => {
          // Same for updates
          const commands = batch.map(task => {
            const source = path.join(assetsPath, task.file);
            const target = `s3://${bucketName}/${task.key}`;
            return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
          });
          
          return commands.join(' && ');
        }),
        environment: {
          AWS_PAGER: "", // Disable pager
        },
      }, { ...opts, dependsOn: [bucket] } as pulumi.ComponentResourceOptions);
      
      uploadedFiles.push(uploadCommand.stdout.apply(() => `batch-${batchIndex}`));
    }

    console.log(`Created ${Math.ceil(totalFiles / BATCH_SIZE)} batch upload commands.`);
  }

  return { assetPathPatterns, uploadedFiles };
}