import * as pulumi from "@pulumi/pulumi";
import { Next } from "@donswayo/pulumi-nextjs-aws";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';

export function createNextJsProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    const site = new Next(`${projectName}-site`, {
      appPath: projectRoot,
      openNextPath: path.join(projectRoot, '.open-next'),
      environment: config.environment,
      domain: config.domains?.[0] ? {
        name: config.domains[0],
      } : undefined,
      tags: {
        [`${CONSTANTS.PROJECT_TAG_PREFIX}project`]: projectName,
        [`${CONSTANTS.PROJECT_TAG_PREFIX}framework`]: 'nextjs',
      },
    });

    return {
      url: site.url,
      distributionId: site.distributionId,
      projectName: projectName,
    };
  };
}