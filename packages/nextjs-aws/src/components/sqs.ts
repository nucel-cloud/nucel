import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions } from "../types/index.js";

export type SQSComponentArgs = {
  name: string;
  tags?: Record<string, string>;
};

export type SQSComponentOutputs = {
  queue: aws.sqs.Queue;
  deadLetterQueue: aws.sqs.Queue;
  queueUrl: pulumi.Output<string>;
  queueArn: pulumi.Output<string>;
};

export function createRevalidationQueue(
  args: SQSComponentArgs,
  opts?: ComponentOptions
): SQSComponentOutputs {
  const { name, tags = {} } = args;

  const deadLetterQueue = new aws.sqs.Queue(`${name}-revalidation-dlq`, {
    messageRetentionSeconds: 1209600, // 14 days
    tags,
  }, opts);

  const queue = new aws.sqs.Queue(`${name}-revalidation-queue`, {
    visibilityTimeoutSeconds: 300,
    messageRetentionSeconds: 86400, // 1 day
    redrivePolicy: pulumi.interpolate`{
      "deadLetterTargetArn": "${deadLetterQueue.arn}",
      "maxReceiveCount": 3
    }`,
    tags,
  }, opts);

  return {
    queue,
    deadLetterQueue,
    queueUrl: queue.url,
    queueArn: queue.arn,
  };
}