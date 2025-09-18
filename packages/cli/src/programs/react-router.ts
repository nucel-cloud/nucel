import { ReactRouterNucelAws } from "@nucel.cloud/react-router-aws";
import { buildReactRouterForAws } from "@nucel.cloud/react-router-aws/adapter";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';
import * as fs from 'fs';

export function createReactRouterProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    let buildPath: string | null = null;
    const nucelBuildPath = path.join(projectRoot, '.nucel-build');
    const standardBuildPath = path.join(projectRoot, config.outputDirectory || 'build');
    
    // Check if .nucel-build exists (already prepared for AWS)
    if (fs.existsSync(path.join(nucelBuildPath, 'server')) && 
        fs.existsSync(path.join(nucelBuildPath, 'client'))) {
      // Already have AWS-ready build, use it
      buildPath = nucelBuildPath;
    } else {
      // No .nucel-build, check if standard build exists
      const serverPath = path.join(standardBuildPath, 'server');
      const clientPath = path.join(standardBuildPath, 'client');
      
      if (fs.existsSync(serverPath) && fs.existsSync(clientPath)) {
        // Standard build exists, need to run adapter
        
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