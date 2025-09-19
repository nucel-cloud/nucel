import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface CreateAliasRecordArgs {
  domainName: string;
  distribution: aws.cloudfront.Distribution;
  hostedZoneId?: pulumi.Input<string>;
}

export function createAliasRecord(
  args: CreateAliasRecordArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const domainParts = getDomainAndSubdomain(args.domainName);
  
  const hostedZoneId = args.hostedZoneId || pulumi.output(
    aws.route53.getZone(
      { name: domainParts.parentDomain },
      { async: true }
    )
  ).apply(zone => zone.zoneId);

  return new aws.route53.Record(
    `${args.domainName}-alias`,
    {
      name: domainParts.subdomain || args.domainName,
      zoneId: hostedZoneId,
      type: "A",
      aliases: [
        {
          name: args.distribution.domainName,
          zoneId: args.distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    },
    opts
  );
}

export function createWWWAliasRecord(
  domainName: string,
  distribution: aws.cloudfront.Distribution,
  hostedZoneId?: pulumi.Input<string>,
  opts?: pulumi.ComponentResourceOptions
) {
  const hostedZone = hostedZoneId || pulumi.output(
    aws.route53.getZone(
      { name: getParentDomain(domainName) },
      { async: true }
    )
  ).apply(zone => zone.zoneId);

  return new aws.route53.Record(
    `${domainName}-www-alias`,
    {
      name: `www.${domainName}`,
      zoneId: hostedZone,
      type: "A",
      aliases: [
        {
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    },
    opts
  );
}

function getDomainAndSubdomain(domain: string): { 
  subdomain: string; 
  parentDomain: string;
} {
  const parts = domain.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid domain: ${domain}`);
  }
  
  // No subdomain (e.g., example.com)
  if (parts.length === 2) {
    return { subdomain: "", parentDomain: domain };
  }
  
  // Has subdomain (e.g., app.example.com)
  const subdomain = parts[0];
  parts.shift();
  return {
    subdomain,
    parentDomain: parts.join(".") + ".",
  };
}

function getParentDomain(domain: string): string {
  const parts = domain.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid domain: ${domain}`);
  }
  if (parts.length === 2) {
    return domain;
  }
  return parts.slice(1).join(".") + ".";
}