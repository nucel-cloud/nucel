import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions } from "../types/index.js";

export type CreateServerRoleArgs = {
  name: string;
  bucketArn: pulumi.Output<string>;
  tableArn: pulumi.Output<string>;
  queueArn: pulumi.Output<string>;
  regionName: pulumi.Input<string>;
  tags?: Record<string, string>;
};

export type CreateRoleOutputs = {
  role: aws.iam.Role;
  roleArn: pulumi.Output<string>;
};

export function createServerRole(
  args: CreateServerRoleArgs,
  opts?: ComponentOptions
): CreateRoleOutputs {
  const { name, bucketArn, tableArn, queueArn, regionName, tags = {} } = args;

  const role = new aws.iam.Role(`${name}-server-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
    managedPolicyArns: [
      aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
      aws.iam.ManagedPolicies.AWSXRayDaemonWriteAccess,
    ],
    tags,
  }, opts);

  new aws.iam.RolePolicy(`${name}-server-policy`, {
    role: role.name,
    policy: pulumi.all([bucketArn, tableArn, queueArn]).apply(
      ([bucket, table, queue]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject*",
              "s3:GetBucket*",
              "s3:List*",
            ],
            Resource: [bucket, `${bucket}/*`],
          },
          {
            Effect: "Allow",
            Action: [
              "s3:DeleteObject*",
              "s3:PutObject",
              "s3:PutObjectLegalHold",
              "s3:PutObjectRetention",
              "s3:PutObjectTagging",
              "s3:PutObjectVersionTagging",
              "s3:Abort*",
            ],
            Resource: `${bucket}/*`,
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
            ],
            Resource: [table, `${table}/index/*`],
          },
          {
            Effect: "Allow",
            Action: [
              "sqs:SendMessage",
              "sqs:GetQueueAttributes",
              "sqs:GetQueueUrl",
            ],
            Resource: queue,
          },
        ],
      })
    ),
  }, opts);

  return { role, roleArn: role.arn };
}

export function createImageRole(
  name: string,
  bucketArn: pulumi.Output<string>,
  tags: Record<string, string> = {},
  opts?: ComponentOptions
): CreateRoleOutputs {
  const role = new aws.iam.Role(`${name}-image-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
    managedPolicyArns: [
      aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
      aws.iam.ManagedPolicies.AWSXRayDaemonWriteAccess,
    ],
    tags,
  }, opts);

  new aws.iam.RolePolicy(`${name}-image-policy`, {
    role: role.name,
    policy: bucketArn.apply(arn => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Action: ["s3:GetObject"],
        Resource: `${arn}/*`,
      }],
    })),
  }, opts);

  return { role, roleArn: role.arn };
}

export function createRevalidationRole(
  name: string,
  queueArn: pulumi.Output<string>,
  tags: Record<string, string> = {},
  opts?: ComponentOptions
): CreateRoleOutputs {
  const role = new aws.iam.Role(`${name}-revalidation-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
    managedPolicyArns: [
      aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
      aws.iam.ManagedPolicies.AWSXRayDaemonWriteAccess,
    ],
    tags,
  }, opts);

  new aws.iam.RolePolicy(`${name}-revalidation-policy`, {
    role: role.name,
    policy: queueArn.apply(arn => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Action: [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility",
        ],
        Resource: arn,
      }],
    })),
  }, opts);

  return { role, roleArn: role.arn };
}

export function createWarmerRole(
  name: string,
  functionArn: pulumi.Output<string>,
  tags: Record<string, string> = {},
  opts?: ComponentOptions
): CreateRoleOutputs {
  const role = new aws.iam.Role(`${name}-warmer-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
    managedPolicyArns: [
      aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
    ],
    tags,
  }, opts);

  new aws.iam.RolePolicy(`${name}-warmer-policy`, {
    role: role.name,
    policy: functionArn.apply(arn => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Action: ["lambda:InvokeFunction"],
        Resource: arn,
      }],
    })),
  }, opts);

  return { role, roleArn: role.arn };
}