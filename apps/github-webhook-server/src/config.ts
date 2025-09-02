import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  github: z.object({
    appId: z.string().min(1, 'GITHUB_APP_ID is required'),
    privateKey: z.string().min(1, 'GITHUB_APP_PRIVATE_KEY is required'),
    webhookSecret: z.string().min(1, 'GITHUB_WEBHOOK_SECRET is required'),
    oauth: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }).optional(),
  }),
  
  nucelDomain: z.string().default('nucel.cloud'),
  awsRegion: z.string().default('us-east-1'),
  
  isDevelopment: z.boolean(),
  isProduction: z.boolean(),
  allowedOrigins: z.array(z.string()),
});

const env = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  
  github: {
    appId: process.env.GITHUB_APP_ID || '',
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    oauth: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
  },
  
  nucelDomain: process.env.NUCEL_DOMAIN,
  awsRegion: process.env.AWS_REGION,
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
};

export const config = configSchema.parse(env);

export type Config = z.infer<typeof configSchema>;