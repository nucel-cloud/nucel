import { createAppAuth } from '@octokit/auth-app';
import type { GitHubAppConfig } from '../index.js';

export function createAppAuthStrategy(config: GitHubAppConfig): ReturnType<typeof createAppAuth> {
  const privateKey = config.privateKey.replace(/\\n/g, '\n');
  
  return createAppAuth({
    appId: config.appId,
    privateKey: privateKey,
  });
}

export async function getInstallationToken(
  config: GitHubAppConfig,
  installationId: number
): Promise<string> {
  const auth = createAppAuthStrategy(config);
  
  const installationAuthentication = await auth({
    type: 'installation',
    installationId,
  });
  
  return installationAuthentication.token;
}

export function validatePrivateKey(privateKey: string): boolean {
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  return (
    formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----') &&
    formattedKey.includes('-----END RSA PRIVATE KEY-----')
  );
}

export function parseWebhookHeaders(headers: Record<string, string | string[] | undefined>) {
  const eventHeader = headers['x-github-event'];
  const signatureHeader = headers['x-hub-signature-256'];
  const deliveryHeader = headers['x-github-delivery'];
  
  if (!eventHeader || !signatureHeader || !deliveryHeader) {
    throw new Error('Missing required GitHub webhook headers');
  }
  
  return {
    event: Array.isArray(eventHeader) ? eventHeader[0] : eventHeader,
    signature: Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader,
    id: Array.isArray(deliveryHeader) ? deliveryHeader[0] : deliveryHeader,
  };
}