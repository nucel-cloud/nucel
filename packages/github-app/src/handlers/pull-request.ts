import type { PullRequestEvent } from '@octokit/webhooks-types';
import type { NucelGitHubApp } from '../index.js';

export async function handlePullRequest(
  app: NucelGitHubApp,
  payload: PullRequestEvent
) {
  const { action, pull_request, repository, installation } = payload;
  
  if (!installation) {
    console.log('No installation found for pull request event');
    return;
  }

  if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
    const checkRun = await app.createCheckRun({
      installationId: installation.id,
      owner: repository.owner.login,
      repo: repository.name,
      name: 'Nucel Preview',
      headSha: pull_request.head.sha,
      status: 'in_progress',
      output: {
        title: 'Building preview deployment',
        summary: 'Your preview deployment is being built...',
      },
    });

    try {
      const deployment = await app.createDeployment({
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        ref: pull_request.head.ref,
        environment: `preview-pr-${pull_request.number}`,
        description: `Preview for PR #${pull_request.number}`,
        task: 'deploy:preview',
        transientEnvironment: true,
        productionEnvironment: false,
        payload: {
          pull_request: {
            number: pull_request.number,
            head_ref: pull_request.head.ref,
            base_ref: pull_request.base.ref,
          },
        },
      });

      console.log(`Created preview deployment for PR #${pull_request.number}`);
      
      if ('id' in deployment.data) {
        await app.updateCheckRun({
          installationId: installation.id,
          owner: repository.owner.login,
          repo: repository.name,
          checkRunId: checkRun.data.id,
          status: 'completed',
          conclusion: 'success',
          output: {
            title: 'Preview deployment ready',
            summary: `Preview deployment created for PR #${pull_request.number}`,
            text: `Deployment ID: ${deployment.data.id}`,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create preview deployment:', error);
      
      await app.updateCheckRun({
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        checkRunId: checkRun.data.id,
        status: 'completed',
        conclusion: 'failure',
        output: {
          title: 'Preview deployment failed',
          summary: 'Failed to create preview deployment',
          text: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  if (action === 'closed' && pull_request.merged) {
    console.log(`PR #${pull_request.number} merged, cleaning up preview environment`);
  }
}