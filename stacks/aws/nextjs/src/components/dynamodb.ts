import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComponentOptions } from "../types/index.js";

export type DynamoDBComponentArgs = {
  name: string;
  tags?: Record<string, string>;
};

export type DynamoDBComponentOutputs = {
  table: aws.dynamodb.Table;
  tableName: pulumi.Output<string>;
  tableArn: pulumi.Output<string>;
};

export function createISRTable(
  args: DynamoDBComponentArgs,
  opts?: ComponentOptions
): DynamoDBComponentOutputs {
  const { name, tags = {} } = args;

  const table = new aws.dynamodb.Table(`${name}-isr-table`, {
    name: `${name}-isr-table`,
    attributes: [
      { name: "tag", type: "S" },
      { name: "path", type: "S" },
      { name: "revalidatedAt", type: "N" },
    ],
    hashKey: "tag",
    rangeKey: "path",
    billingMode: "PAY_PER_REQUEST",
    pointInTimeRecovery: {
      enabled: true,
    },
    globalSecondaryIndexes: [{
      name: "revalidate",
      hashKey: "path",
      rangeKey: "revalidatedAt",
      projectionType: "ALL",
    }],
    tags,
  }, opts);

  return {
    table,
    tableName: table.name,
    tableArn: table.arn,
  };
}