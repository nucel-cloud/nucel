import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";

import type { NextArgs } from "./types/index.js";
import { createS3Bucket, uploadAssets, uploadErrorPage } from "./components/s3.js";
import { createISRTable } from "./components/dynamodb.js";
import { createRevalidationQueue } from "./components/sqs.js";
import { 
  createServerRole, 
  createImageRole, 
  createRevalidationRole, 
  createWarmerRole 
} from "./components/iam.js";
import {
  createServerFunction,
  createImageFunction,
  createRevalidationFunction,
  createWarmerFunction,
} from "./components/lambda.js";
import { createCloudFrontDistribution } from "./components/cloudfront/distribution.js";
import { getOpenNextPaths, buildLambdaEnvironment } from "./utils/paths.js";

export class Next extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly serverFunctionUrl?: pulumi.Output<string>;
  public readonly imageFunctionUrl?: pulumi.Output<string>;
  public readonly serverFunctionArn?: pulumi.Output<string>;
  public readonly imageFunctionArn?: pulumi.Output<string>;

  constructor(
    name: string,
    args: NextArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pulumi-nextjs-aws:index:Next", name, {}, opts);

    const defaultOptions = { parent: this };

    const appPath = args.appPath;
    const openNextPath = args.openNextPath ?? ".open-next";
    const streaming = args.streaming ?? true;
    const priceClass = args.priceClass ?? "PriceClass_100";
    const waitForDeployment = args.waitForDeployment ?? true;
    const tags = args.tags ?? {};

    const lambdaConfig = {
      server: {
        memory: args.lambda?.server?.memory ?? 1024,
        timeout: args.lambda?.server?.timeout ?? 30,
        reservedConcurrentExecutions: args.lambda?.server?.reservedConcurrentExecutions,
        provisionedConcurrency: args.lambda?.server?.provisionedConcurrency ?? 0,
      },
      image: {
        memory: args.lambda?.image?.memory ?? 2048,
        timeout: args.lambda?.image?.timeout ?? 30,
      },
      revalidation: {
        memory: args.lambda?.revalidation?.memory ?? 128,
        timeout: args.lambda?.revalidation?.timeout ?? 300,
      },
      warmer: {
        memory: args.lambda?.warmer?.memory ?? 256,
        timeout: args.lambda?.warmer?.timeout ?? 900,
        concurrency: args.lambda?.warmer?.concurrency ?? 10,
        schedule: args.lambda?.warmer?.schedule ?? "rate(3 minutes)",
      },
    };

    const paths = getOpenNextPaths(appPath, openNextPath);

    const region = aws.getRegion({});
    const regionName = pulumi.output(region).apply(r => r.name);

    const s3 = createS3Bucket({ name, tags }, defaultOptions);

    const { assetPathPatterns } = uploadAssets({
      name,
      bucket: s3.bucket,
      assetsPath: paths.assets,
      tags,
    }, defaultOptions);

    uploadErrorPage(name, s3.bucket, tags, defaultOptions);

    const dynamodb = createISRTable({ name, tags }, defaultOptions);

    const sqs = createRevalidationQueue({ name, tags }, defaultOptions);

    const serverRole = createServerRole({
      name,
      bucketArn: s3.bucketArn,
      tableArn: dynamodb.tableArn,
      queueArn: sqs.queueArn,
      regionName: regionName.apply(name => name),
      tags,
    }, defaultOptions);

    const imageRole = createImageRole(name, s3.bucketArn, tags, defaultOptions);
    const revalidationRole = createRevalidationRole(name, sqs.queueArn, tags, defaultOptions);

    // Build environment variables
    const lambdaEnvironment = pulumi.all([
      s3.bucketName,
      dynamodb.tableName,
      sqs.queueUrl,
      regionName,
    ]).apply(([bucket, table, queue, region]) =>
      buildLambdaEnvironment(bucket, table, queue, region, args.environment)
    );

    // Create Lambda functions
    const serverFunctionResult = createServerFunction({
      name,
      functionPath: paths.serverFunction,
      roleArn: serverRole.roleArn,
      config: lambdaConfig.server,
      environment: lambdaEnvironment.apply(env => env),
      streaming,
      tags,
    }, { ...defaultOptions, dependsOn: [serverRole.role] } as pulumi.ComponentResourceOptions);

    const imageFunctionResult = createImageFunction({
      name,
      functionPath: paths.imageFunction,
      roleArn: imageRole.roleArn,
      config: lambdaConfig.image,
      bucketName: s3.bucketName,
      tags,
    }, { ...defaultOptions, dependsOn: [imageRole.role] } as pulumi.ComponentResourceOptions);

    const revalidationFunction = createRevalidationFunction({
      name,
      functionPath: paths.revalidationFunction,
      roleArn: revalidationRole.roleArn,
      config: lambdaConfig.revalidation,
      queueArn: sqs.queueArn,
      tags,
    }, { ...defaultOptions, dependsOn: [revalidationRole.role] } as pulumi.ComponentResourceOptions);

    // Create warmer function if server function exists and warmer is not disabled
    if (serverFunctionResult?.function && args.lambda?.warmer?.enabled !== false) {
      const warmerRole = createWarmerRole(
        name,
        serverFunctionResult.function.arn,
        tags,
        defaultOptions
      );

      createWarmerFunction({
        name,
        functionPath: paths.warmerFunction,
        roleArn: warmerRole.roleArn,
        config: lambdaConfig.warmer,
        serverFunctionName: serverFunctionResult.function.name,
        tags,
      }, { ...defaultOptions, dependsOn: [warmerRole.role] } as pulumi.ComponentResourceOptions);
    }

    // Create CloudFront distribution
    const cloudfront = createCloudFrontDistribution({
      name,
      serverFunctionUrl: serverFunctionResult?.functionUrl?.functionUrl,
      imageFunctionUrl: imageFunctionResult?.functionUrl?.functionUrl,
      bucketRegionalDomainName: s3.bucketRegionalDomainName,
      bucketId: s3.bucketName,
      bucketArn: s3.bucketArn,
      assetPathPatterns,
      domain: args.domain,
      priceClass,
      logging: args.cloudFrontLogging,
      waitForDeployment,
      tags,
    }, defaultOptions);

    this.url = cloudfront.url;
    this.distributionId = cloudfront.distributionId;
    this.bucketName = s3.bucketName;
    
    if (serverFunctionResult?.functionUrl) {
      this.serverFunctionUrl = serverFunctionResult.functionUrl.functionUrl;
      this.serverFunctionArn = serverFunctionResult.function.arn;
    }
    
    if (imageFunctionResult?.functionUrl) {
      this.imageFunctionUrl = imageFunctionResult.functionUrl.functionUrl;
      this.imageFunctionArn = imageFunctionResult.function.arn;
    }

    this.registerOutputs({
      url: this.url,
      distributionId: this.distributionId,
      bucketName: this.bucketName,
      serverFunctionUrl: this.serverFunctionUrl,
      imageFunctionUrl: this.imageFunctionUrl,
      serverFunctionArn: this.serverFunctionArn,
      imageFunctionArn: this.imageFunctionArn,
    });
  }
}