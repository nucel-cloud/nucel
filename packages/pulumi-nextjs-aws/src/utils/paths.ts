import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import type { OpenNextPaths } from "../types/index.js";

export function getOpenNextPaths(appPath: string, openNextPath: string): OpenNextPaths {
  return {
    serverFunction: path.join(appPath, openNextPath, "server-functions/default"),
    imageFunction: path.join(appPath, openNextPath, "image-optimization-function"),
    revalidationFunction: path.join(appPath, openNextPath, "revalidation-function"),
    warmerFunction: path.join(appPath, openNextPath, "warmer-function"),
    assets: path.join(appPath, openNextPath, "assets"),
  };
}

export function buildLambdaEnvironment(
  bucketName: string,
  tableName: string,
  queueUrl: string,
  regionName: string,
  customEnv?: Record<string, string | pulumi.Input<string>>
): Record<string, string | pulumi.Input<string>> {
  return {
    // Core OpenNext environment variables
    CACHE_BUCKET_NAME: bucketName,
    CACHE_BUCKET_KEY_PREFIX: "_cache",
    CACHE_BUCKET_REGION: regionName,
    REVALIDATION_QUEUE_URL: queueUrl,
    REVALIDATION_QUEUE_REGION: regionName,
    
    // DynamoDB table names
    CACHE_DYNAMO_TABLE: tableName,
    TAG_CACHE_TABLE_NAME: tableName,
    
    // Performance optimizations
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    AWS_LWA_ENABLE_COMPRESSION: "true",
    
    // Node.js 22 optimizations
    NODE_OPTIONS: "--enable-source-maps --max-old-space-size=896 --max-semi-space-size=128",
    UV_THREADPOOL_SIZE: "64",
    
    // Next.js optimizations
    NEXT_SHARP_PATH: "/opt/nodejs/node_modules/sharp",
    NEXT_TELEMETRY_DISABLED: "1",
    
    // Custom environment variables
    ...customEnv,
  };
}