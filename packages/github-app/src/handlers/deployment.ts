import type { DeploymentEvent, DeploymentStatusEvent } from '@octokit/webhooks-types';
import type { NucelGitHubApp } from '../index.js';
import { runDeployment } from '../utils/deployment.js';

export async function handleDeployment(
  app: NucelGitHubApp,
  payload: DeploymentEvent
) {
  const { deployment, repository, installation } = payload;
  
  if (!installation) {
    console.log('No installation found for deployment event');
    return;
  }

  console.log(`Deployment requested for ${repository.full_name} (${deployment.environment})`);
  
  await app.updateDeploymentStatus({
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    deploymentId: deployment.id,
    state: 'in_progress',
    description: 'Deployment started',
    environment: deployment.environment,
  });

  try {
    const result = await runDeployment({
      repository: {
        owner: repository.owner.login,
        name: repository.name,
        branch: deployment.ref,
        commit: deployment.sha,
      },
      environment: deployment.environment,
      task: deployment.task,
      payload: deployment.payload as any,
    });

    await app.updateDeploymentStatus({
      installationId: installation.id,
      owner: repository.owner.login,
      repo: repository.name,
      deploymentId: deployment.id,
      state: 'success',
      description: 'Deployment completed successfully',
      environment: deployment.environment,
      environmentUrl: result.url,
      logUrl: result.logUrl,
    });

    console.log(`Deployment ${deployment.id} completed successfully`);
  } catch (error) {
    console.error(`Deployment ${deployment.id} failed:`, error);
    
    await app.updateDeploymentStatus({
      installationId: installation.id,
      owner: repository.owner.login,
      repo: repository.name,
      deploymentId: deployment.id,
      state: 'failure',
      description: error instanceof Error ? error.message : 'Deployment failed',
      environment: deployment.environment,
    });
  }
}

export async function handleDeploymentStatus(
  _app: NucelGitHubApp,
  payload: DeploymentStatusEvent
) {
  const { deployment_status, deployment, repository } = payload;
  
  console.log(
    `Deployment status update for ${repository.full_name}: ${deployment_status.state}`
  );
  
  if (deployment_status.state === 'success') {
    console.log(`Deployment ${deployment.id} succeeded`);
    if (deployment_status.environment_url) {
      console.log(`URL: ${deployment_status.environment_url}`);
    }
  } else if (deployment_status.state === 'failure' || deployment_status.state === 'error') {
    console.log(`Deployment ${deployment.id} failed: ${deployment_status.description}`);
  }
}