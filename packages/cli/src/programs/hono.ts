import { HonoNucelAws } from '@nucel.cloud/hono-aws';
import { buildHonoForAws } from '@nucel.cloud/hono-aws/adapter';
import { ProjectConfig } from '../config/types.js';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

export function createHonoProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    
    console.log(chalk.cyan('[Hono] Starting deployment...'));
    console.log(chalk.gray(`  Working directory: ${projectRoot}`));
    console.log(chalk.gray(`  Config output dir: ${config.outputDirectory || 'dist'}`));
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    let buildPath: string | null = null;
    const nucelBuildPath = path.join(projectRoot, '.nucel-build');
    const standardBuildPath = path.join(projectRoot, config.outputDirectory || 'dist');
    
    // Check if .nucel-build exists (already prepared for AWS)
    if (fs.existsSync(path.join(nucelBuildPath, 'server'))) {
      // Already have AWS-ready build
      buildPath = nucelBuildPath;
      console.log(chalk.gray(`Using existing AWS build at: ${path.relative(projectRoot, buildPath)}`));
    } else {
      // Look for the built Hono app
      const entryPoint = path.join(standardBuildPath, 'index.js');
      const srcEntryPoint = path.join(projectRoot, 'src', 'index.ts');
      const appEntryPoint = path.join(projectRoot, 'src', 'app.ts');
      
      // Determine which entry point to use
      let selectedEntryPoint: string;
      if (fs.existsSync(entryPoint)) {
        selectedEntryPoint = entryPoint;
      } else if (fs.existsSync(appEntryPoint)) {
        selectedEntryPoint = appEntryPoint;
      } else if (fs.existsSync(srcEntryPoint)) {
        selectedEntryPoint = srcEntryPoint;
      } else {
        throw new Error('No Hono entry point found. Expected dist/index.js or src/index.ts or src/app.ts');
      }
      
      console.log(chalk.cyan('Preparing Hono app for AWS Lambda...'));
      console.log(chalk.gray(`  Entry point: ${path.relative(projectRoot, selectedEntryPoint)}`));
      
      try {
        const buildResult = await buildHonoForAws(
          {
            entryPoint: selectedEntryPoint,
            out: '.nucel-build',
            environment: config.environment,
            bundle: true,
            minify: true,
            sourcemap: false,
            external: [],
            streaming: true,
          },
          {
            bundle: true,
            minify: true,
            streaming: true,
          }
        );
        
        buildPath = buildResult.outDir;
        console.log(chalk.green('✅ Hono app prepared for AWS Lambda'));
      } catch (error) {
        console.error(chalk.red('[Hono] Build failed:'), error);
        throw error;
      }
    }
    
    if (!buildPath) {
      throw new Error('No valid build found. Please run `npm run build` first.');
    }
    
    // Deploy to AWS using Pulumi
    return new HonoNucelAws(projectName, {
      buildPath,
      environment: config.environment,
      lambda: {
        memorySize: 512,
        timeout: 15,
        architecture: 'arm64',
      },
      tags: {
        Framework: 'Hono',
        ManagedBy: 'Nucel',
        Project: projectName,
        Environment: 'production',
      },
    });
  };
}