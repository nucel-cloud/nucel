import type { IssueCommentEvent } from '@octokit/webhooks-types';
import type { NucelGitHubApp } from '../index.js';

const DEPLOY_COMMANDS = ['/deploy', '/nucel deploy', '/preview'];
const DESTROY_COMMANDS = ['/destroy', '/nucel destroy', '/teardown'];

export async function handleIssueComment(
  app: NucelGitHubApp,
  payload: IssueCommentEvent
) {
  const { action, issue, comment, repository, installation } = payload;
  
  if (!installation || action !== 'created') {
    return;
  }

  const isPullRequest = 'pull_request' in issue;
  if (!isPullRequest) {
    return;
  }

  const body = comment.body.toLowerCase().trim();
  
  if (DEPLOY_COMMANDS.some(cmd => body.startsWith(cmd))) {
    const octokit = await app.getInstallationOctokit(installation.id);
    
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: issue.number,
    });

    await octokit.rest.reactions.createForIssueComment({
      owner: repository.owner.login,
      repo: repository.name,
      comment_id: comment.id,
      content: 'rocket',
    });

    const environment = body.includes('production') ? 'production' : `preview-pr-${issue.number}`;
    
    try {
      const deployment = await app.createDeployment({
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        ref: pullRequest.head.ref,
        environment,
        description: `Manual deployment triggered by @${comment.user.login}`,
        task: 'deploy:manual',
        transientEnvironment: environment !== 'production',
        productionEnvironment: environment === 'production',
        payload: {
          triggered_by: comment.user.login,
          comment_id: comment.id,
          pull_request: {
            number: pullRequest.number,
            head_ref: pullRequest.head.ref,
            base_ref: pullRequest.base.ref,
          },
        },
      });

      if ('id' in deployment.data) {
        await octokit.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `🚀 Deployment to **${environment}** started!\n\nDeployment ID: ${deployment.data.id}`,
        });
      } else {
        await octokit.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `🚀 Deployment to **${environment}** started!`,
        });
      }
    } catch (error) {
      await octokit.rest.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `❌ Failed to create deployment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
  
  if (DESTROY_COMMANDS.some(cmd => body.startsWith(cmd))) {
    const octokit = await app.getInstallationOctokit(installation.id);
    
    await octokit.rest.reactions.createForIssueComment({
      owner: repository.owner.login,
      repo: repository.name,
      comment_id: comment.id,
      content: 'eyes',
    });

    await octokit.rest.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: `🗑️ Destroying preview environment for PR #${issue.number}...`,
    });
  }
}