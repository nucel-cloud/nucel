import nodemailer, { Transporter } from 'nodemailer';
import { render } from '@react-email/components';
import type { NodemailerConfigSchema } from '../config.js';
import type { z } from 'zod';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from '../types.js';

export class NodemailerProvider implements EmailProvider {
  private transporter: Transporter;
  private from: string;

  constructor(config: z.infer<typeof NodemailerConfigSchema>) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const html = options.html || (options.react ? await render(options.react) : undefined);
      
      if (!html && !options.text) {
        throw new Error('Either html, react, or text content must be provided');
      }

      const result = await this.transporter.sendMail({
        from: options.from || this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        html: html || undefined,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
        })),
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'nodemailer',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'nodemailer',
      };
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    const results = await Promise.all(
      emails.map(email => this.sendEmail(email))
    );
    return results;
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}