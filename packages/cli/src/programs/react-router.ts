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
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    // First check if Nucel adapter output exists
    let buildPath: string | null = null;
    const nucelBuildPath = path.join(projectRoot, '.nucel-build');
    
    if (fs.existsSync(path.join(nucelBuildPath, 'server')) && 
        fs.existsSync(path.join(nucelBuildPath, 'client'))) {
      buildPath = nucelBuildPath;
      console.log(chalk.gray(`Using React Router AWS build at: ${path.relative(projectRoot, buildPath)}`));
    } else {
      // Check if standard React Router build exists
      const standardBuildPath = path.join(projectRoot, config.outputDirectory || 'build');
      const serverPath = path.join(standardBuildPath, 'server');
      const clientPath = path.join(standardBuildPath, 'client');
      
      if (fs.existsSync(serverPath) && fs.existsSync(clientPath)) {
        console.log(chalk.cyan('Standard React Router build detected, preparing for AWS Lambda...'));
        
        // Run the adapter to create .nucel-build
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
        } catch (error) {
          throw new Error(
            `Failed to prepare React Router build for AWS Lambda: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else {
        throw new Error(
          `React Router build not found. Expected to find:\n` +
          `  - ${path.relative(projectRoot, nucelBuildPath)} (with server/ and client/ directories)\n` +
          `  - OR ${path.relative(projectRoot, standardBuildPath)} (with server/ and client/ directories)\n\n` +
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