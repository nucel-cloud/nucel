import { Resend } from 'resend';
import { render } from '@react-email/components';
import type { ResendConfigSchema } from '../config.js';
import type { z } from 'zod';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from '../types.js';

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(config: z.infer<typeof ResendConfigSchema>) {
    this.client = new Resend(config.apiKey);
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const html = options.html || (options.react ? await render(options.react) : undefined);
      
      if (!html && !options.text) {
        throw new Error('Either html, react, or text content must be provided');
      }

      const result = await this.client.emails.send({
        from: options.from || this.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        subject: options.subject,
        html,
        text: options.text,
        react: options.react,
        attachments: options.attachments,
      });

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'resend',
      };
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    const results = await Promise.all(
      emails.map(email => this.sendEmail(email))
    );
    return results;
  }
}