import type { PushEvent } from '@octokit/webhooks-types';
import type { NucelGitHubApp } from '../index.js';

export async function handlePush(
  app: NucelGitHubApp,
  payload: PushEvent
) {
  const { repository, ref, after: sha, installation } = payload;
  
  if (!installation) {
    console.log('No installation found for push event');
    return;
  }

  const branch = ref.replace('refs/heads/', '');
  const isDefaultBranch = branch === repository.default_branch;
  
  console.log(`Push to ${repository.full_name}:${branch} (${sha.substring(0, 7)})`);
  
  if (isDefaultBranch) {
    try {
      await app.createDeployment({
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        ref: sha,
        environment: 'production',
        description: `Deploy ${sha.substring(0, 7)} to production`,
        task: 'deploy:production',
        productionEnvironment: true,
      });
      
      console.log(`Created production deployment for ${repository.full_name}`);
    } catch (error) {
      console.error('Failed to create deployment:', error);
    }
  }
}