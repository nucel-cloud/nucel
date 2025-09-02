import { validateConfig, type EmailConfig } from './config.js';
import { ResendProvider } from './providers/resend.js';
import { NodemailerProvider } from './providers/nodemailer.js';
import { AwsSesProvider } from './providers/aws-ses.js';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types.js';

export class EmailClient {
  private provider: EmailProvider;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    this.config = config || validateConfig();
    this.provider = this.createProvider(this.config);
  }

  private createProvider(config: EmailConfig): EmailProvider {
    switch (config.provider) {
      case 'resend':
        return new ResendProvider(config);
      case 'nodemailer':
        return new NodemailerProvider(config);
      case 'aws-ses':
        return new AwsSesProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${(config as any).provider}`);
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    return this.provider.sendEmail(options);
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    if (this.provider.sendBatch) {
      return this.provider.sendBatch(emails);
    }
    
    return Promise.all(emails.map(email => this.send(email)));
  }

  getProvider(): string {
    return this.config.provider;
  }
}

let defaultClient: EmailClient | null = null;

export function getEmailClient(config?: EmailConfig): EmailClient {
  if (!defaultClient || config) {
    defaultClient = new EmailClient(config);
  }
  return defaultClient;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getEmailClient();
  return client.send(options);
}