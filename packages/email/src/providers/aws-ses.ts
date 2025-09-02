import { SES, SESClientConfig, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { render } from '@react-email/components';
import type { AwsSesConfigSchema } from '../config.js';
import type { z } from 'zod';
import type { EmailProvider, SendEmailOptions, SendEmailResult } from '../types.js';

export class AwsSesProvider implements EmailProvider {
  private client: SES;
  private from: string;

  constructor(config: z.infer<typeof AwsSesConfigSchema>) {
    // AWS SDK will automatically use IAM role credentials when running inside AWS
    const sesConfig: SESClientConfig = {
      region: config.region,
    };

    // Only add explicit credentials if provided
    if (config.accessKeyId && config.secretAccessKey) {
      sesConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new SES(sesConfig);
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const html = options.html || (options.react ? await render(options.react) : undefined);
      
      if (!html && !options.text) {
        throw new Error('Either html, react, or text content must be provided');
      }

      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined;
      const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined;

      const params: SendEmailCommandInput = {
        Source: options.from || this.from,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Subject: {
            Charset: 'UTF-8',
            Data: options.subject,
          },
          Body: {},
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      };

      if (html && params.Message?.Body) {
        params.Message.Body.Html = {
          Charset: 'UTF-8',
          Data: html,
        };
      }

      if (options.text && params.Message?.Body) {
        params.Message.Body.Text = {
          Charset: 'UTF-8',
          Data: options.text,
        };
      }

      const command = new SendEmailCommand(params);
      const result = await this.client.send(command);

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-ses',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'aws-ses',
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