import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { join } from 'path';
import type { LambdaConfig } from '../types.js';

export interface CreateLambdaArgs {
  name: string;
  serverPath: string;
  environment?: Record<string, pulumi.Input<string>>;
  lambda?: LambdaConfig;
  tags?: Record<string, string>;
  parent?: pulumi.ComponentResource;
  streaming?: boolean;
}

export interface LambdaResult {
  function: aws.lambda.Function;
  functionUrl: aws.lambda.FunctionUrl;
}

export function createLambda(args: CreateLambdaArgs): LambdaResult {
  const {
    name,
    serverPath,
    environment = {},
    lambda = {},
    tags = {},
    parent,
    streaming = true,
  } = args;

  const {
    memorySize = 1024,
    timeout = 30,
    runtime = 'nodejs22.x',
    reservedConcurrentExecutions,
    architecture = 'arm64',
  } = lambda;

  // Create IAM role for Lambda
  const lambdaRole = new aws.iam.Role(
    `${name}-lambda-role`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags,
    },
    { parent }
  );

  // Attach basic execution policy
  new aws.iam.RolePolicyAttachment(
    `${name}-lambda-policy`,
    {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    },
    { parent }
  );

  // Create archive from server directory
  const archivePath = join(serverPath, '..', 'lambda.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = createWriteStream(archivePath);

  const archivePromise = new Promise<string>((resolve, reject) => {
    output.on('close', () => resolve(archivePath));
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(serverPath, false);
    archive.finalize();
  });

  // Create Lambda function
  const lambdaFunction = new aws.lambda.Function(
    `${name}-function`,
    {
      code: new pulumi.asset.FileArchive(archivePath),
      handler: 'handler.handler',
      runtime,
      role: lambdaRole.arn,
      memorySize,
      timeout,
      architectures: [architecture],
      environment: {
        variables: {
          NODE_ENV: 'production',
          ...environment,
          ...(streaming ? { HONO_STREAMING: 'true' } : {}),
        },
      },
      reservedConcurrentExecutions,
      tags,
    },
    { parent }
  );

  // Create Lambda Function URL with optional streaming
  const functionUrl = new aws.lambda.FunctionUrl(
    `${name}-function-url`,
    {
      functionName: lambdaFunction.name,
      authorizationType: 'NONE',
      cors: {
        allowCredentials: true,
        allowHeaders: ['*'],
        allowMethods: ['*'],
        allowOrigins: ['*'],
        exposeHeaders: ['*'],
        maxAge: 86400,
      },
      ...(streaming ? { invokeMode: 'RESPONSE_STREAM' } : {}),
    },
    { parent }
  );

  // Add permissions for Function URL
  new aws.lambda.Permission(
    `${name}-function-url-permission`,
    {
      action: 'lambda:InvokeFunctionUrl',
      function: lambdaFunction.name,
      principal: '*',
      functionUrlAuthType: 'NONE',
    },
    { parent }
  );

  return {
    function: lambdaFunction,
    functionUrl,
  };
}