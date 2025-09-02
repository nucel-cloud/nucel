export { EmailClient, getEmailClient, sendEmail } from './email-client.js';

export type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  EmailAttachment,
} from './types.js';

export {
  EmailProviderSchema,
  ResendConfigSchema,
  NodemailerConfigSchema,
  AwsSesConfigSchema,
  EmailConfigSchema,
  validateConfig,
  type EmailConfig,
  type EmailProvider as EmailProviderType,
} from './config.js';

export { ResendProvider } from './providers/resend.js';
export { NodemailerProvider } from './providers/nodemailer.js';
export { AwsSesProvider } from './providers/aws-ses.js';