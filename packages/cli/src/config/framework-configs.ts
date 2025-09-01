import { Framework } from './types.js';
import { CONSTANTS } from './constants.js';

export type { Framework };

export interface FrameworkConfig {
  buildCommand: string;
  outputDirectory: string;
  envPrefixes: string[];
  configFiles: string[];
  dependencies: string[];
}

export const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig> = {
  nextjs: {
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    envPrefixes: ['NEXT_PUBLIC_'],
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    dependencies: ['next'],
  },
  sveltekit: {
    buildCommand: 'npm run build',
    outputDirectory: '.svelte-kit',
    envPrefixes: ['PUBLIC_', 'VITE_'],
    configFiles: ['svelte.config.js', 'vite.config.js', 'vite.config.ts'],
    dependencies: ['@sveltejs/kit'],
  },
  'react-router': {
    buildCommand: 'npm run build',
    outputDirectory: '.react-router-aws',
    envPrefixes: ['VITE_'],
    configFiles: ['react-router.config.ts', 'react-router.config.js'],
    dependencies: ['react-router', '@react-router/dev'],
  },
  unknown: {
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    envPrefixes: [],
    configFiles: [],
    dependencies: [],
  },
};

export function getFrameworkConfig(framework: Framework): FrameworkConfig {
  return FRAMEWORK_CONFIGS[framework];
}

export function getFrameworkDefaults(framework: Framework): { buildCommand: string; outputDirectory: string } {
  const config = getFrameworkConfig(framework);
  return {
    buildCommand: config.buildCommand,
    outputDirectory: config.outputDirectory,
  };
}

export function isAppEnvVar(key: string, framework: Framework): boolean {
  const config = getFrameworkConfig(framework);
  
  if (config.envPrefixes.some(prefix => key.startsWith(prefix))) {
    return true;
  }
  
  if (key.match(/^[A-Z_]+$/) && !isSystemEnvVar(key)) {
    return true;
  }
  
  return false;
}

function isSystemEnvVar(key: string): boolean {
  return CONSTANTS.SYSTEM_ENV_PREFIXES.some(sysVar => key.startsWith(sysVar));
}
