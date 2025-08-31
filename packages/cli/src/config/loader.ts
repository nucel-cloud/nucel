import * as fs from 'fs';
import * as path from 'path';
import { config as dotenv } from 'dotenv';
import { NucelConfig, NucelConfigSchema, ProjectConfig, Framework } from './types.js';
import { detectFramework } from '../utils/detect-framework.js';
import { getErrorMessage } from '../utils/errors.js';
import { getFrameworkDefaults, isAppEnvVar } from './framework-configs.js';
import { CONSTANTS } from './constants.js';
import chalk from 'chalk';

export async function loadConfig(): Promise<ProjectConfig> {
  const projectRoot = process.cwd();
  
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('No package.json found in current directory');
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const defaultName = packageJson.name || path.basename(projectRoot);
  
  const detectedFramework = await detectFramework();
  if (detectedFramework === 'unknown') {
    throw new Error('Unable to detect framework. Please specify it in nucel.config.ts');
  }
  
  const envVars = await loadEnvironmentVariables(projectRoot, detectedFramework);
  
  let userConfig: NucelConfig = {};
  const configPath = path.join(projectRoot, CONSTANTS.CONFIG_FILES.typescript);
  const configJsPath = path.join(projectRoot, CONSTANTS.CONFIG_FILES.javascript);
  
  if (fs.existsSync(configPath) || fs.existsSync(configJsPath)) {
    try {
      const configModule = await import(fs.existsSync(configPath) ? configPath : configJsPath);
      userConfig = NucelConfigSchema.parse(configModule.default || configModule);
      console.log(chalk.gray('Loaded nucel.config'));
    } catch (error) {
      console.warn(chalk.yellow('Failed to load nucel.config:'), getErrorMessage(error));
    }
  }
  
  const frameworkDefaults = getFrameworkDefaults(userConfig.framework || detectedFramework);
  
  const config: ProjectConfig = {
    name: userConfig.name || defaultName,
    framework: userConfig.framework || detectedFramework,
    buildCommand: userConfig.buildCommand || frameworkDefaults.buildCommand,
    outputDirectory: userConfig.outputDirectory || frameworkDefaults.outputDirectory,
    environment: {
      ...envVars,
      ...userConfig.environment,
    },
    aws: {
      region: userConfig.aws?.region || process.env.AWS_REGION || CONSTANTS.DEFAULT_AWS_REGION,
      profile: userConfig.aws?.profile || process.env.AWS_PROFILE,
    },
    domains: userConfig.domains,
    headers: userConfig.headers,
    rewrites: userConfig.rewrites,
    redirects: userConfig.redirects,
  };
  
  return config;
}

async function loadEnvironmentVariables(projectRoot: string, framework: string): Promise<Record<string, string>> {
  const envVars: Record<string, string> = {};
  
  for (const envFile of CONSTANTS.ENV_FILES) {
    const envPath = path.join(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      const result = dotenv({ path: envPath });
      if (result.parsed) {
        Object.assign(envVars, result.parsed);
        console.log(chalk.gray(`Loaded ${envFile}`));
      }
    }
  }
  
  const appEnvVars = Object.keys(process.env)
    .filter(key => isAppEnvVar(key, framework as Framework))
    .reduce((acc, key) => {
      acc[key] = process.env[key]!;
      return acc;
    }, {} as Record<string, string>);
  
  return { ...envVars, ...appEnvVars };
}