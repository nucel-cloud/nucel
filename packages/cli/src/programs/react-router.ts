import * as pulumi from "@pulumi/pulumi";
import { ReactRouterNucelAws } from "@nucel.cloud/react-router-aws";
import { buildReactRouterForAws } from "@nucel.cloud/react-router-aws/adapter";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

export function createReactRouterProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();

    console.log(config)
    
    console.log(chalk.cyan('[React Router] Starting deployment...'));
    console.log(chalk.gray(`  Working directory: ${projectRoot}`));
    console.log(chalk.gray(`  Config output dir: ${config.outputDirectory || 'build'}`));
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    let buildPath: string | null = null;
    const nucelBuildPath = path.join(projectRoot, '.nucel-build');
    const standardBuildPath = path.join(projectRoot, config.outputDirectory || 'build');
    
    // Log what directories exist
    console.log(chalk.gray(`  Checking for builds...`));
    console.log(chalk.gray(`    - ${nucelBuildPath}: ${fs.existsSync(nucelBuildPath) ? 'exists' : 'not found'}`));
    console.log(chalk.gray(`    - ${standardBuildPath}: ${fs.existsSync(standardBuildPath) ? 'exists' : 'not found'}`));
    
    // Check if .nucel-build exists (already prepared for AWS)
    if (fs.existsSync(path.join(nucelBuildPath, 'server')) && 
        fs.existsSync(path.join(nucelBuildPath, 'client'))) {
      // Already have AWS-ready build, use it
      buildPath = nucelBuildPath;
      console.log(chalk.gray(`Using existing AWS build at: ${path.relative(projectRoot, buildPath)}`));
    } else {
      // No .nucel-build, check if standard build exists
      const serverPath = path.join(standardBuildPath, 'server');
      const clientPath = path.join(standardBuildPath, 'client');
      
      console.log(chalk.gray(`  Checking standard build paths:`));
      console.log(chalk.gray(`    - Server: ${serverPath} (${fs.existsSync(serverPath) ? 'exists' : 'not found'})`));
      console.log(chalk.gray(`    - Client: ${clientPath} (${fs.existsSync(clientPath) ? 'exists' : 'not found'})`));
      
      if (fs.existsSync(serverPath) && fs.existsSync(clientPath)) {
        // Standard build exists, need to run adapter
        console.log(chalk.cyan('Standard React Router build detected, preparing for AWS Lambda...'));
        
        try {
          await buildReactRouterForAws(
            {
              serverBuildFile: path.join(serverPath, 'index.js'),
              buildDirectory: clientPath,
            },
            {
              out: '.nucel-build',
              polyfill: true,
              precompress: false,
            }
          );
          buildPath = nucelBuildPath;
          console.log(chalk.green('✓ React Router build prepared for AWS Lambda'));
        } catch (error) {
          throw new Error(
            `Failed to prepare React Router build for AWS Lambda: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else {
        // No build at all
        throw new Error(
          `React Router build not found. Expected to find:\n` +
          `  - ${path.relative(projectRoot, standardBuildPath)} (with server/ and client/ directories)\n\n` +
          `Please run 'npm run build' first.`
        );
      }
    }
    
    const deployment = new ReactRouterNucelAws(`${projectName}-deployment`, {
      buildPath,
      environment: config.environment,
      domain: config.domains?.[0] ? {
        name: config.domains[0],
      } : undefined,
      tags: {
        [`${CONSTANTS.PROJECT_TAG_PREFIX}project`]: projectName,
        [`${CONSTANTS.PROJECT_TAG_PREFIX}framework`]: 'react-router',
      },
    });

    return {
      url: deployment.url,
      distributionId: deployment.distributionId,
      bucketName: deployment.bucketName,
      functionArn: deployment.functionArn,
      projectName: projectName,
    };
  };
}