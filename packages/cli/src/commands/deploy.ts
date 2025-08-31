import { InlineProgramArgs, LocalWorkspace } from "@pulumi/pulumi/automation/index.js";
import chalk from 'chalk';
import ora from 'ora';
import { buildProject } from '../utils/build.js';
import { createNextJsProgram } from '../programs/nextjs.js';
import { createSvelteKitProgram } from '../programs/sveltekit.js';
import { createReactRouterProgram } from '../programs/react-router.js';
import { loadConfig } from '../config/loader.js';
import { initializePulumiStack, refreshStack, displayPreviewResults, displayDeploymentResults } from '../utils/deployment.js';
import { CONSTANTS } from '../config/constants.js';

export interface DeployOptions {
  stack: string;
  destroy?: boolean;
  preview?: boolean;
}

export async function deploy(options: DeployOptions) {
  const { stack, destroy, preview } = options;
  
  const configSpinner = ora('Loading configuration...').start();
  const config = await loadConfig();
  configSpinner.succeed(`Configuration loaded for ${config.name}`);
  
  console.log(chalk.cyan(`\nDeploying ${config.framework} application to AWS\n`));
  console.log(chalk.gray(`  Project: ${config.name}`));
  console.log(chalk.gray(`  Stack: ${stack}`));
  console.log(chalk.gray(`  Region: ${config.aws.region}`));
  if (config.domains?.length) {
    console.log(chalk.gray(`  Domains: ${config.domains.join(', ')}`));
  }
  console.log();

  if (!destroy) {
    const buildSpinner = ora('Building application...').start();
    try {
      await buildProject(config.buildCommand);
      buildSpinner.succeed('Build completed');
    } catch (error) {
      buildSpinner.fail('Build failed');
      throw error;
    }
  }

  let pulumiProgram;
  switch (config.framework) {
    case 'nextjs':
      pulumiProgram = createNextJsProgram(config);
      break;
    case 'sveltekit':
      pulumiProgram = createSvelteKitProgram(config);
      break;
    case 'react-router':
      pulumiProgram = createReactRouterProgram(config);
      break;
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }

  const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
  const args: InlineProgramArgs = {
    stackName: stack,
    projectName: `nucel-${projectName}`,
    program: pulumiProgram,
  };

  const stackSpinner = ora('Initializing stack...').start();
  
  try {
    process.env.PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE || CONSTANTS.PULUMI_CONFIG_PASSPHRASE;
    
    const pulumiStack = await LocalWorkspace.createOrSelectStack(args);
    stackSpinner.succeed('Stack initialized');

    const region = config.aws.region || process.env.AWS_REGION || CONSTANTS.DEFAULT_AWS_REGION;
    await initializePulumiStack(pulumiStack, region);
    await refreshStack(pulumiStack);

    if (preview) {
      const previewSpinner = ora('Generating preview...').start();
      const previewRes = await pulumiStack.preview({ 
        onOutput: (msg: string) => {
          if (process.env.DEBUG) console.log(msg);
        }
      });
      previewSpinner.succeed('Preview generated');
      
      displayPreviewResults(previewRes);
      
      console.log(chalk.cyan('\n📋 Preview Results (Dry Run)\n'));
    } else if (destroy) {
      const destroySpinner = ora('Destroying infrastructure...').start();
      await pulumiStack.destroy({ 
        onOutput: (msg: string) => {
          if (process.env.DEBUG) console.log(msg);
        }
      });
      destroySpinner.succeed('Infrastructure destroyed');
      console.log(chalk.green('\n✅ Stack destroyed successfully\n'));
    } else {
      const deploySpinner = ora('Deploying to AWS...').start();
      const upRes = await pulumiStack.up({ 
        onOutput: (msg: string) => {
          if (process.env.DEBUG) console.log(msg);
        }
      });
      deploySpinner.succeed('Deployment completed');

      displayDeploymentResults(upRes);

      console.log(chalk.gray('\nResource Summary:'));
      console.log(chalk.gray(`  Created: ${upRes.summary.resourceChanges?.create || 0}`));
      console.log(chalk.gray(`  Updated: ${upRes.summary.resourceChanges?.update || 0}`));
      console.log(chalk.gray(`  Deleted: ${upRes.summary.resourceChanges?.delete || 0}`));
    }
  } catch (error) {
    stackSpinner.fail('Deployment failed');
    throw error;
  }
}