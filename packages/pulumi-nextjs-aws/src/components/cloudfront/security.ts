import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions, CloudFrontSecurityConfig } from "../../types/index.js";

/**
 * Creates Origin Access Control (OAC) for CloudFront.
 * OAC is more secure than OAI and supports additional features.
 */
export function createOriginAccessControl(
  name: string,
  bucketArn: pulumi.Output<string>,
  opts?: ComponentOptions
) {
  const oac = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
    name: `${name}-oac`,
    description: `Origin Access Control for ${name}`,
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  }, opts);

  return oac;
}

/**
 * Creates S3 bucket policy for Origin Access Control
 */
export function createOACBucketPolicy(
  name: string,
  bucketId: pulumi.Output<string>,
  bucketArn: pulumi.Output<string>,
  distributionArn: pulumi.Output<string>,
  opts?: ComponentOptions
) {
  return new aws.s3.BucketPolicy(`${name}-oac-policy`, {
    bucket: bucketId,
    policy: pulumi.all([bucketArn, distributionArn]).apply(([bucket, distArn]) => 
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontServicePrincipalReadOnly",
            Effect: "Allow",
            Principal: {
              Service: "cloudfront.amazonaws.com"
            },
            Action: "s3:GetObject",
            Resource: `${bucket}/*`,
            Condition: {
              StringEquals: {
                "AWS:SourceArn": distArn
              }
            }
          },
          {
            Sid: "AllowCloudFrontServicePrincipalListBucket",
            Effect: "Allow",
            Principal: {
              Service: "cloudfront.amazonaws.com"
            },
            Action: "s3:ListBucket",
            Resource: bucket,
            Condition: {
              StringEquals: {
                "AWS:SourceArn": distArn
              }
            }
          }
        ],
      })
    ),
  }, opts);
}

/**
 * Creates CloudWatch alarms for CloudFront distribution monitoring
 */
export function createCloudFrontAlarms(
  name: string,
  distributionId: pulumi.Output<string>,
  alarmEmail?: string,
  opts?: ComponentOptions
) {
  const alarms: aws.cloudwatch.MetricAlarm[] = [];

  // Create SNS topic first if email is provided
  const topicArn = alarmEmail ? new aws.sns.Topic(`${name}-alarms`, {
    displayName: `CloudFront Alarms for ${name}`,
  }, opts).arn : undefined;

  if (alarmEmail && topicArn) {
    new aws.sns.TopicSubscription(`${name}-alarm-email`, {
      topic: topicArn,
      protocol: "email",
      endpoint: alarmEmail,
    }, opts);
  }

  // 4xx error rate alarm
  const error4xxAlarm = new aws.cloudwatch.MetricAlarm(`${name}-4xx-errors`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "4xxErrorRate",
    namespace: "AWS/CloudFront",
    period: 300,
    statistic: "Average",
    threshold: 5, // Alert if >5% 4xx error rate
    alarmDescription: "CloudFront 4xx error rate is too high",
    dimensions: {
      DistributionId: distributionId,
      Region: "Global",
    },
    treatMissingData: "notBreaching",
    alarmActions: topicArn ? [topicArn] : undefined,
    okActions: topicArn ? [topicArn] : undefined,
  }, opts);
  alarms.push(error4xxAlarm);

  // 5xx error rate alarm
  const error5xxAlarm = new aws.cloudwatch.MetricAlarm(`${name}-5xx-errors`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "5xxErrorRate",
    namespace: "AWS/CloudFront",
    period: 60,
    statistic: "Average",
    threshold: 1, // Alert if >1% 5xx error rate
    alarmDescription: "CloudFront 5xx error rate indicates origin issues",
    dimensions: {
      DistributionId: distributionId,
      Region: "Global",
    },
    treatMissingData: "notBreaching",
    alarmActions: topicArn ? [topicArn] : undefined,
    okActions: topicArn ? [topicArn] : undefined,
  }, opts);
  alarms.push(error5xxAlarm);

  // Origin latency alarm (if server function exists)
  const originLatencyAlarm = new aws.cloudwatch.MetricAlarm(`${name}-origin-latency`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "OriginLatency",
    namespace: "AWS/CloudFront",
    period: 300,
    statistic: "Average",
    threshold: 3000, // Alert if origin latency >3 seconds
    alarmDescription: "CloudFront origin latency is too high",
    dimensions: {
      DistributionId: distributionId,
      Region: "Global",
    },
    treatMissingData: "notBreaching",
    alarmActions: topicArn ? [topicArn] : undefined,
    okActions: topicArn ? [topicArn] : undefined,
  }, opts);
  alarms.push(originLatencyAlarm);

  return alarms;
}

/**
 * Builds geo-restriction configuration for CloudFront
 */
export function buildGeoRestriction(restrictLocations?: string[]) {
  if (!restrictLocations || restrictLocations.length === 0) {
    return {
      restrictionType: "none" as const,
    };
  }

  return {
    restrictionType: "blacklist" as const,
    locations: restrictLocations,
  };
}