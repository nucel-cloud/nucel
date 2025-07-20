import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as crypto from "crypto";
import * as fs from "fs";
import { globSync } from "glob";
import mime from "mime";
import * as path from "path";
import type { ComponentOptions } from "../types/index.js";

export type S3ComponentArgs = {
  name: string;
  tags?: Record<string, string>;
  forceDestroy?: boolean;
};

export type S3ComponentOutputs = {
  bucket: aws.s3.BucketV2;
  bucketArn: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  bucketRegionalDomainName: pulumi.Output<string>;
};

export function createS3Bucket(
  args: S3ComponentArgs,
  opts?: ComponentOptions
): S3ComponentOutputs {
  const { name, tags = {}, forceDestroy = true } = args;

  // S3 Bucket for assets
  const bucket = new aws.s3.BucketV2(`${name}-assets`, {
    forceDestroy,
    tags,
  }, opts);

  // Bucket versioning
  new aws.s3.BucketVersioningV2(`${name}-assets-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: "Enabled",
    },
  }, opts);

  // Block public access
  new aws.s3.BucketPublicAccessBlock(`${name}-assets-pab`, {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }, opts);

  // Server-side encryption
  new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-assets-encryption`, {
    bucket: bucket.id,
    rules: [{
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "AES256",
      },
      bucketKeyEnabled: true,
    }],
  }, opts);

  return {
    bucket,
    bucketArn: bucket.arn,
    bucketName: bucket.bucket,
    bucketRegionalDomainName: bucket.bucketRegionalDomainName,
  };
}

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

export function uploadAssets(
  args: UploadAssetsArgs,
  opts?: ComponentOptions
): UploadAssetsOutputs {
  const { name, bucket, assetsPath, tags = {} } = args;
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

      uploadTasks.push({ file, key, cacheControl, hex });
    }

    const totalFiles = uploadTasks.length;
    console.log(`Creating ${totalFiles} S3 object resources for parallel upload...`);

    uploadTasks.forEach((task) => {
      const bucketObject = new aws.s3.BucketObject(`${name}-asset-${task.hex}`, {
        bucket: bucket.id,
        key: task.key,
        source: new pulumi.asset.FileAsset(path.join(assetsPath, task.file)),
        cacheControl: task.cacheControl,
        contentType: mime.getType(task.file) || undefined,
        tags,
      }, opts);

      uploadedFiles.push(bucketObject.key);
    });

    console.log(`All ${totalFiles} S3 objects created. Pulumi will upload them in parallel.`);

    assetPathPatterns.push(...Array.from(uniquePaths).sort());
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
        .error-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 1rem;
        }
        h1 {
            color: #333;
            font-size: 2.5rem;
            margin: 0 0 1rem 0;
        }
        p {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
            margin: 0 0 1.5rem 0;
        }
        .error-code {
            color: #999;
            font-size: 0.9rem;
            margin-top: 2rem;
        }
        .retry-button {
            background-color: #0070f3;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .retry-button:hover {
            background-color: #0051cc;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Service Temporarily Unavailable</h1>
        <p>We're experiencing high traffic or a temporary issue. Please try again in a moment.</p>
        <button class="retry-button" onclick="window.location.reload()">Retry</button>
        <div class="error-code">Error 504</div>
    </div>
</body>
</html>`;

  new aws.s3.BucketObject(`${name}-error-page`, {
    bucket: bucket.id,
    key: "error.html",
    content: errorPageContent,
    contentType: "text/html",
    cacheControl: "public,max-age=60,s-maxage=60",
    tags,
  }, opts);
}