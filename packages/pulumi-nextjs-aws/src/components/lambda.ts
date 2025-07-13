import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";
import type { ComponentOptions, LambdaConfig, WarmerLambdaConfig } from "../types/index.js";

export type CreateServerFunctionArgs = {
  name: string;
  functionPath: string;
  roleArn: pulumi.Output<string>;
  config: LambdaConfig;
  environment: pulumi.Input<Record<string, pulumi.Input<string>>>;
  streaming: boolean;
  tags?: Record<string, string>;
};

export type FunctionOutputs = {
  function: aws.lambda.Function;
  functionUrl?: aws.lambda.FunctionUrl;
  alias?: aws.lambda.Alias;
};

export function createServerFunction(
  args: CreateServerFunctionArgs,
  opts?: ComponentOptions
): FunctionOutputs | undefined {
  const { name, functionPath, roleArn, config, environment, streaming, tags = {} } = args;

  if (!fs.existsSync(functionPath)) {
    return undefined;
  }

  const fn = new aws.lambda.Function(`${name}-server`, {
    code: new pulumi.asset.FileArchive(functionPath),
    role: roleArn,
    handler: "index.handler",
    runtime: "nodejs22.x",
    architectures: ["arm64"],
    memorySize: config.memory ?? 1024,
    timeout: config.timeout ?? 30,
    reservedConcurrentExecutions: config.reservedConcurrentExecutions,
    tracingConfig: { mode: "Active" },
    ephemeralStorage: { size: 2048 },
    environment: { variables: environment },
    tags,
    publish: true,
  }, opts);

  const alias = new aws.lambda.Alias(`${name}-server-alias`, {
    name: "live",
    functionName: fn.name,
    functionVersion: fn.version,
  }, opts);

  const functionUrl = new aws.lambda.FunctionUrl(`${name}-server-url`, {
    functionName: alias.arn,
    authorizationType: "NONE",
    invokeMode: streaming ? "RESPONSE_STREAM" : "BUFFERED",
    cors: {
      allowCredentials: true,
      allowHeaders: ["*"],
      allowMethods: ["*"],
      allowOrigins: ["*"],
      maxAge: 0,
    },
  }, opts);

  if (config.provisionedConcurrency && config.provisionedConcurrency > 0) {
    new aws.lambda.ProvisionedConcurrencyConfig(`${name}-server-provisioned`, {
      functionName: fn.name,
      provisionedConcurrentExecutions: config.provisionedConcurrency,
      qualifier: alias.name,
    }, opts);
  }

  return { function: fn, functionUrl, alias };
}

export type CreateImageFunctionArgs = {
  name: string;
  functionPath: string;
  roleArn: pulumi.Output<string>;
  config: { memory?: number; timeout?: number };
  bucketName: pulumi.Output<string>;
  tags?: Record<string, string>;
};

export function createImageFunction(
  args: CreateImageFunctionArgs,
  opts?: ComponentOptions
): FunctionOutputs | undefined {
  const { name, functionPath, roleArn, config, bucketName, tags = {} } = args;

  if (!fs.existsSync(functionPath)) {
    return undefined;
  }

  const fn = new aws.lambda.Function(`${name}-image`, {
    code: new pulumi.asset.FileArchive(functionPath),
    role: roleArn,
    handler: "index.handler",
    runtime: "nodejs22.x",
    architectures: ["arm64"],
    memorySize: config.memory ?? 2048,
    timeout: config.timeout ?? 30,
    tracingConfig: { mode: "Active" },
    ephemeralStorage: { size: 3072 },
    environment: {
      variables: {
        BUCKET_NAME: bucketName,
        BUCKET_KEY_PREFIX: "_assets",
        OPENNEXT_STATIC_ETAG: "true",
      },
    },
    tags,
  }, opts);

  const functionUrl = new aws.lambda.FunctionUrl(`${name}-image-url`, {
    functionName: fn.arn,
    authorizationType: "NONE",
    cors: {
      allowCredentials: true,
      allowHeaders: ["*"],
      allowMethods: ["*"],
      allowOrigins: ["*"],
      maxAge: 0,
    },
  }, opts);

  return { function: fn, functionUrl };
}

export type CreateRevalidationFunctionArgs = {
  name: string;
  functionPath: string;
  roleArn: pulumi.Output<string>;
  config: { memory?: number; timeout?: number };
  queueArn: pulumi.Output<string>;
  tags?: Record<string, string>;
};

export function createRevalidationFunction(
  args: CreateRevalidationFunctionArgs,
  opts?: ComponentOptions
): aws.lambda.Function | undefined {
  const { name, functionPath, roleArn, config, queueArn, tags = {} } = args;

  if (!fs.existsSync(functionPath)) {
    return undefined;
  }

  const fn = new aws.lambda.Function(`${name}-revalidation`, {
    code: new pulumi.asset.FileArchive(functionPath),
    role: roleArn,
    handler: "index.handler",
    runtime: "nodejs22.x",
    architectures: ["arm64"],
    memorySize: config.memory ?? 128,
    timeout: config.timeout ?? 300,
    tracingConfig: { mode: "Active" },
    environment: { variables: {} },
    tags,
  }, opts);

  new aws.lambda.EventSourceMapping(`${name}-revalidation-esm`, {
    eventSourceArn: queueArn,
    functionName: fn.arn,
    batchSize: 10,
    maximumBatchingWindowInSeconds: 0,
  }, opts);

  return fn;
}

export type CreateWarmerFunctionArgs = {
  name: string;
  functionPath: string;
  roleArn: pulumi.Output<string>;
  config: WarmerLambdaConfig;
  serverFunctionName: pulumi.Output<string>;
  tags?: Record<string, string>;
};

export function createWarmerFunction(
  args: CreateWarmerFunctionArgs,
  opts?: ComponentOptions
): aws.lambda.Function | undefined {
  const { name, functionPath, roleArn, config, serverFunctionName, tags = {} } = args;

  if (!fs.existsSync(functionPath)) {
    return undefined;
  }

  const fn = new aws.lambda.Function(`${name}-warmer`, {
    code: new pulumi.asset.FileArchive(functionPath),
    role: roleArn,
    handler: "index.handler",
    runtime: "nodejs22.x",
    architectures: ["arm64"],
    memorySize: config.memory ?? 256,
    timeout: config.timeout ?? 900,
    environment: {
      variables: serverFunctionName.apply(serverName => ({
        WARMER_FUNCTION: JSON.stringify({
          functions: [{
            name: `${serverName}:live`,
            concurrency: config.concurrency ?? 10,
          }],
        }),
        WARMER_CONCURRENCY: (config.concurrency ?? 10).toString(),
      })),
    },
    tags,
  }, opts);

  const rule = new aws.cloudwatch.EventRule(`${name}-warmer-rule`, {
    scheduleExpression: config.schedule ?? "rate(3 minutes)",
    tags,
  }, opts);

  new aws.cloudwatch.EventTarget(`${name}-warmer-target`, {
    rule: rule.name,
    arn: fn.arn,
  }, opts);

  new aws.lambda.Permission(`${name}-warmer-permission`, {
    action: "lambda:InvokeFunction",
    function: fn.arn,
    principal: "events.amazonaws.com",
    sourceArn: rule.arn,
  }, opts);

  return fn;
}