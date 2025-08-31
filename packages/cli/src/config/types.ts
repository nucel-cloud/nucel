import { z } from 'zod';

export type Framework = 'nextjs' | 'sveltekit' | 'react-router' | 'unknown';

export const NucelConfigSchema = z.object({
  name: z.string().optional(),
  framework: z.enum(['nextjs', 'sveltekit', 'react-router']).optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
  aws: z.object({
    region: z.string().default('us-east-1'),
    profile: z.string().optional(),
  }).optional(),
  domains: z.array(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  rewrites: z.array(z.object({
    source: z.string(),
    destination: z.string(),
  })).optional(),
  redirects: z.array(z.object({
    source: z.string(),
    destination: z.string(),
    permanent: z.boolean().optional(),
  })).optional(),
});

export type NucelConfig = z.infer<typeof NucelConfigSchema>;

export interface ProjectConfig {
  name: string;
  framework: Framework;
  buildCommand: string;
  outputDirectory: string;
  environment: Record<string, string>;
  aws: {
    region: string;
    profile?: string;
  };
  domains?: string[];
  headers?: Record<string, string>;
  rewrites?: Array<{ source: string; destination: string }>;
  redirects?: Array<{ source: string; destination: string; permanent?: boolean }>;
}