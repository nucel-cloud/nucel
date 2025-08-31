import * as pulumi from "@pulumi/pulumi";
import { ReactRouterAwsDeployment } from "@donswayo/pulumi-react-router-aws";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';

export function createReactRouterProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    const buildPath = path.join(projectRoot, config.outputDirectory || 'build/server');
    
    const deployment = new ReactRouterAwsDeployment(`${projectName}-deployment`, {
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