import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface CertificateArgs {
  domainName: string;
  includeWWW?: boolean;
  hostedZoneId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export function createCertificate(
  args: CertificateArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  // ACM certificates for CloudFront must be in us-east-1
  const eastProvider = new aws.Provider(
    "us-east-1-provider",
    {
      region: "us-east-1",
    },
    opts
  );

  const subjectAlternativeNames = args.includeWWW !== false
    ? [`www.${args.domainName}`]
    : [];

  const certificate = new aws.acm.Certificate(
    `${args.domainName}-cert`,
    {
      domainName: args.domainName,
      subjectAlternativeNames,
      validationMethod: "DNS",
      tags: args.tags,
    },
    { ...opts, provider: eastProvider }
  );

  // Get the hosted zone ID if not provided
  const hostedZoneId = args.hostedZoneId || pulumi.output(
    aws.route53.getZone(
      { name: getParentDomain(args.domainName) },
      { async: true }
    )
  ).apply(zone => zone.zoneId);

  // Create validation records
  const validationRecord = new aws.route53.Record(
    `${args.domainName}-validation`,
    {
      name: certificate.domainValidationOptions[0].resourceRecordName,
      zoneId: hostedZoneId,
      type: certificate.domainValidationOptions[0].resourceRecordType,
      records: [certificate.domainValidationOptions[0].resourceRecordValue],
      ttl: 60,
    },
    opts
  );

  const validationRecords = [validationRecord.fqdn];

  // Add WWW validation if needed
  if (args.includeWWW !== false) {
    const wwwValidationRecord = new aws.route53.Record(
      `${args.domainName}-www-validation`,
      {
        name: certificate.domainValidationOptions[1].resourceRecordName,
        zoneId: hostedZoneId,
        type: certificate.domainValidationOptions[1].resourceRecordType,
        records: [certificate.domainValidationOptions[1].resourceRecordValue],
        ttl: 60,
      },
      opts
    );
    validationRecords.push(wwwValidationRecord.fqdn);
  }

  // Wait for validation
  const certificateValidation = new aws.acm.CertificateValidation(
    `${args.domainName}-cert-validation`,
    {
      certificateArn: certificate.arn,
      validationRecordFqdns: validationRecords,
    },
    { ...opts, provider: eastProvider }
  );

  return {
    certificate,
    certificateArn: certificateValidation.certificateArn,
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