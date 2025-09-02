import { z } from 'zod';

export const EmailProviderSchema = z.enum(['resend', 'nodemailer', 'aws-ses']);
export type EmailProvider = z.infer<typeof EmailProviderSchema>;

export const ResendConfigSchema = z.object({
  provider: z.literal('resend'),
  apiKey: z.string().startsWith('re_'),
  from: z.string().email(),
});

export const NodemailerConfigSchema = z.object({
  provider: z.literal('nodemailer'),
  host: z.string(),
  port: z.number(),
  secure: z.boolean().optional(),
  auth: z.object({
    user: z.string(),
    pass: z.string(),
  }),
  from: z.string().email(),
});

export const AwsSesConfigSchema = z.object({
  provider: z.literal('aws-ses'),
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  from: z.string().email(),
});

export const EmailConfigSchema = z.discriminatedUnion('provider', [
  ResendConfigSchema,
  NodemailerConfigSchema,
  AwsSesConfigSchema,
]);

export type EmailConfig = z.infer<typeof EmailConfigSchema>;

export function validateConfig(): EmailConfig {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  switch (provider) {
    case 'resend':
      return ResendConfigSchema.parse({
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM,
      });

    case 'nodemailer':
      return NodemailerConfigSchema.parse({
        provider: 'nodemailer',
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
        from: process.env.EMAIL_FROM,
      });

    case 'aws-ses':
      return AwsSesConfigSchema.parse({
        provider: 'aws-ses',
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        from: process.env.EMAIL_FROM,
      });

    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}