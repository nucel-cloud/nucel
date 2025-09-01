import * as pulumi from "@pulumi/pulumi";
import { ReactRouterNucelAws } from "@donswayo/pulumi-react-router-aws";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

export function createReactRouterProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    // Check for React Router adapter output first, then fallback to standard build
    const possiblePaths = [
      path.join(projectRoot, '.nucel-build'),        // Nucel adapter output
      path.join(projectRoot, '.react-router-aws'),   // Legacy adapter output
      path.join(projectRoot, config.outputDirectory || 'build'), // Standard build
    ];
    
    let buildPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      const serverPath = path.join(possiblePath, 'server');
      const clientPath = path.join(possiblePath, 'client');
      
      if (fs.existsSync(serverPath) && fs.existsSync(clientPath)) {
        buildPath = possiblePath;
        console.log(chalk.gray(`Using React Router build at: ${path.relative(projectRoot, buildPath)}`));
        
        // Check if handler.js exists (required for Lambda)
        const handlerPath = path.join(serverPath, 'handler.js');
        if (!fs.existsSync(handlerPath)) {
          console.warn(chalk.yellow('⚠️  Warning: handler.js not found in server directory'));
          console.warn(chalk.yellow('   Make sure the React Router AWS adapter is properly configured'));
        }
        break;
      }
    }
    
    if (!buildPath) {
      throw new Error(
        `React Router build not found. Checked:\n` +
        possiblePaths.map(p => `  - ${path.relative(projectRoot, p)}`).join('\n') +
        `\n\nMake sure to build your app with the React Router AWS adapter or run 'npm run build' first.`
      );
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