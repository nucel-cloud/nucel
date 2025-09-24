import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { LambdaConfig } from '../types.js';
import { validateEnvironmentVariables } from '../utils.js';

export interface CreateLambdaArgs {
  name: string;
  serverPath: string;
  environment?: Record<string, string>;
  lambda?: LambdaConfig;
  tags?: Record<string, string>;
  parent: pulumi.ComponentResource;
}

export interface LambdaResult {
  function: aws.lambda.Function;
  functionUrl: aws.lambda.FunctionUrl;
  role: aws.iam.Role;
}

export function createLambda(args: CreateLambdaArgs): LambdaResult {
  const { name, serverPath, environment = {}, lambda = {}, tags = {}, parent } = args;
  
  // Create IAM role for Lambda
  const lambdaRole = new aws.iam.Role(`${name}-lambda-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      }],
    }),
    tags,
  }, { parent });
  
  // Attach basic execution policy
  new aws.iam.RolePolicyAttachment(`${name}-lambda-policy`, {
    role: lambdaRole.name,
    policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }, { parent });
  
  // Prepare Lambda code
  const lambdaCode = new pulumi.asset.FileArchive(serverPath);
  
  // Validate environment variables
  const validEnvVars = validateEnvironmentVariables(environment);
  
  // Create Lambda function with performance optimizations
  const lambdaFunction = new aws.lambda.Function(`${name}-function`, {
    runtime: 'nodejs22.x',
    handler: 'lambda.handler',
    code: lambdaCode,
    role: lambdaRole.arn,
    memorySize: lambda.memory || 1024, // Default 1GB for better performance
    timeout: lambda.timeout || 30,
    architectures: [lambda.architecture || 'arm64'],
    environment: {
      variables: validEnvVars,
    },
    reservedConcurrentExecutions: lambda.reservedConcurrency, // Optional: user-controlled
    tags,
  }, { parent });
  
  // Create Lambda Function URL with optional streaming support
  const functionUrl = new aws.lambda.FunctionUrl(`${name}-function-url`, {
    functionName: lambdaFunction.name,
    authorizationType: 'NONE',
    invokeMode: lambda.streaming ? 'RESPONSE_STREAM' : 'BUFFERED', // Enable streaming if configured
    cors: {
      allowOrigins: ['*'],
      allowMethods: ['*'],
      allowHeaders: ['*'],
      maxAge: 86400,
    },
  }, { parent });
  
  // Grant public access to Lambda Function URL
  new aws.lambda.Permission(`${name}-lambda-url-permission`, {
    action: 'lambda:InvokeFunctionUrl',
    function: lambdaFunction.name,
    principal: '*',
    functionUrlAuthType: 'NONE',
  }, { parent });
  
  return {
    function: lambdaFunction,
    functionUrl,
    role: lambdaRole,
  };
}