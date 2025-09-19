import * as pulumi from "@pulumi/pulumi";
import { StaticSite } from "@nucel.cloud/static-aws";
import { ProjectConfig } from '../config/types.js';
import { CONSTANTS } from '../config/constants.js';
import * as path from 'path';
import * as fs from 'fs';

export function createStaticProgram(config: ProjectConfig) {
  return async () => {
    const projectRoot = process.cwd();
    
    // Use the outputDirectory from config (which comes from framework-configs.ts)
    const sitePath = path.join(projectRoot, config.outputDirectory);
    
    if (!fs.existsSync(sitePath)) {
      throw new Error(`Build output directory not found: ${sitePath}. Please build your project first with: ${config.buildCommand}`);
    }
    
    const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
    
    const site = new StaticSite(`${projectName}-site`, {
      sitePath,
      domain: config.domains?.[0] ? {
        name: config.domains[0],
        includeWWW: true,
      } : undefined,
      tags: {
        [`${CONSTANTS.PROJECT_TAG_PREFIX}project`]: projectName,
        [`${CONSTANTS.PROJECT_TAG_PREFIX}framework`]: 'static',
      },
      // SPA defaults - most static sites are SPAs
      customErrorResponses: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 0,
        },
      ],
      enableCompression: true,
    });

    return {
      url: site.url,
      distributionId: site.distributionId,
      bucketName: site.bucketName,
      projectName: projectName,
    };
  };
}