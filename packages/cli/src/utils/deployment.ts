import chalk from 'chalk';
import ora from 'ora';
import { CONSTANTS } from '../config/constants.js';

export async function initializePulumiStack(
  pulumiStack: any,
  region: string
): Promise<void> {
  const pluginSpinner = ora('Installing AWS plugins...').start();
  await pulumiStack.workspace.installPlugin("aws", CONSTANTS.AWS_PULUMI_PLUGIN_VERSION);
  pluginSpinner.succeed('Plugins installed');

  const configSpinner = ora('Configuring AWS...').start();
  await pulumiStack.setConfig("aws:region", { value: region });
  configSpinner.succeed(`AWS region set to ${region}`);
}

export async function refreshStack(pulumiStack: any): Promise<void> {
  const refreshSpinner = ora('Refreshing stack state...').start();
  await pulumiStack.refresh({ 
    onOutput: (msg: string) => {
      if (process.env.DEBUG) console.log(msg);
    }
  });
  refreshSpinner.succeed('Stack refreshed');
}

export function displayPreviewResults(previewRes: any): void {
  console.log(chalk.cyan('\n📋 Preview Results (Dry Run)\n'));
  console.log(chalk.gray('Changes that would be made:'));
  
  const changes = previewRes.changeSummary || {};
  if (changes.create) console.log(chalk.green(`  + ${changes.create} to create`));
  if (changes.update) console.log(chalk.yellow(`  ~ ${changes.update} to update`));
  if (changes.delete) console.log(chalk.red(`  - ${changes.delete} to delete`));
  if (changes.same) console.log(chalk.gray(`  = ${changes.same} unchanged`));
  
  console.log(chalk.cyan('\n💡 Run without --preview to apply these changes\n'));
}

export function displayDeploymentResults(upRes: any): void {
  console.log(chalk.green('\n✅ Deployment successful!\n'));
  
  if (upRes.outputs.url) {
    console.log(chalk.cyan(`🌐 URL: ${upRes.outputs.url.value}`));
  }
  if (upRes.outputs.distributionId) {
    console.log(chalk.gray(`📦 CloudFront: ${upRes.outputs.distributionId.value}`));
  }
  if (upRes.outputs.bucketName) {
    console.log(chalk.gray(`🪣 S3 Bucket: ${upRes.outputs.bucketName.value}`));
  }
  
  console.log();
}
