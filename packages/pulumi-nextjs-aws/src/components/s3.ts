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
  bucketRegionalDomainName: pulumi.Output<string>;
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

  // Note: Bucket policy is created in CloudFront component to include OAI access

  return {
    bucket,
    bucketArn: bucket.arn,
    bucketName: bucket.bucket,
    bucketRegionalDomainName: bucket.bucketRegionalDomainName,
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
          // First sync to delete old files (only on first batch)
          const syncCommand = batchIndex === 0 
            ? `aws s3 sync "${assetsPath}" "s3://${bucketName}/_assets" --delete --region "${region.name}" && ` 
            : '';
          
          // Build multiple aws s3 cp commands joined with &&
          const commands = batch.map(task => {
            const source = path.join(assetsPath, task.file);
            const target = `s3://${bucketName}/${task.key}`;
            return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
          });
          
          return syncCommand + commands.join(' && ');
        }),
        update: pulumi.all([bucket.bucket, aws.getRegion()]).apply(([bucketName, region]) => {
          // First sync to delete old files (only on first batch)
          const syncCommand = batchIndex === 0 
            ? `aws s3 sync "${assetsPath}" "s3://${bucketName}/_assets" --delete --region "${region.name}" && ` 
            : '';
          
          // Same for updates
          const commands = batch.map(task => {
            const source = path.join(assetsPath, task.file);
            const target = `s3://${bucketName}/${task.key}`;
            return `aws s3 cp "${source}" "${target}" --content-type "${task.contentType}" --cache-control "${task.cacheControl}" --region "${region.name}"`;
          });
          
          return syncCommand + commands.join(' && ');
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


export function uploadErrorPage(
  name: string,
  bucket: aws.s3.BucketV2,
  tags: Record<string, string> = {},
  opts?: ComponentOptions
): void {
  const errorPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Temporarily Unavailable</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            padding: 40px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: 0 20px;
        }
        h1 {
            color: #333;
            font-size: 48px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        h2 {
            color: #666;
            font-size: 24px;
            margin: 0 0 24px 0;
            font-weight: 400;
        }
        p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 32px 0;
        }
        .status-code {
            color: #999;
            font-size: 14px;
            margin-top: 32px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>503</h1>
        <h2>Service Temporarily Unavailable</h2>
        <p>We're currently performing maintenance on our servers. Please try again in a few moments.</p>
        <p>If this problem persists, please contact our support team.</p>
        <div class="status-code">Error Code: 503</div>
    </div>
</body>
</html>`;

  new aws.s3.BucketObject(`${name}-error-page`, {
    bucket: bucket.id,
    key: "503.html",
    content: errorPageContent,
    contentType: "text/html",
    cacheControl: "no-cache, no-store, must-revalidate",
    tags,
  }, opts);
}