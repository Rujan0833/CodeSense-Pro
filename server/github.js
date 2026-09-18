import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

function getClientId() {
  return process.env.GITHUB_CLIENT_ID;
}

function getClientSecret() {
  return process.env.GITHUB_CLIENT_SECRET;
}

function getCallbackUrl() {
  return process.env.GITHUB_CALLBACK_URL || 'http://localhost:5173/api/github/callback';
}

function getEncryptionSecret() {
  return process.env.GITHUB_ENCRYPTION_KEY;
}

function key() {
  const encryptionSecret = getEncryptionSecret();
  if (!encryptionSecret) throw new Error('GITHUB_ENCRYPTION_KEY is not configured.');
  return createHmac('sha256', encryptionSecret).update('codesense-github-token').digest();
}

export class GitHubAuthenticationError extends Error {
  constructor() {
    super('GitHub authorization is invalid or expired. Reconnect your GitHub account.');
    this.name = 'GitHubAuthenticationError';
    this.code = 'GITHUB_AUTH_INVALID';
  }
}

export function isGitHubConfigured() {
  return Boolean(getClientId() && getClientSecret() && getEncryptionSecret());
}

export function createOAuthState(userId) {
  const payload = `${userId}.${Date.now()}`;
  const signature = createHmac('sha256', getEncryptionSecret() || 'not-configured').update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

export function readOAuthState(state) {
  const decoded = Buffer.from(state, 'base64url').toString('utf8');
  const [userId, timestamp, signature] = decoded.split('.');
  const payload = `${userId}.${timestamp}`;
  const expected = createHmac('sha256', getEncryptionSecret() || 'not-configured').update(payload).digest('hex');
  if (!userId || !timestamp || !signature || signature !== expected || Date.now() - Number(timestamp) > 10 * 60 * 1000) {
    throw new Error('GitHub authorization state is invalid or expired.');
  }
  return userId;
}

export function getGitHubAuthorizationUrl(userId) {
  if (!isGitHubConfigured()) throw new Error('GitHub OAuth is not configured.');
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getCallbackUrl(),
    scope: 'read:user repo',
    state: createOAuthState(userId),
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: getClientId(), client_secret: getClientSecret(), code }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data.error_description || 'GitHub token exchange failed.');
  return data;
}

export async function getGitHubUser(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CodeSense' },
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) throw new GitHubAuthenticationError();
    throw new Error(data.message || 'Could not read the GitHub account.');
  }
  return data;
}

export async function getGitHubRepositories(accessToken) {
  const repositories = [];
  let page = 1;

  while (page <= 3) {
    const response = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CodeSense' },
    });
    if (!response.ok) {
      if (response.status === 401) throw new GitHubAuthenticationError();
      let message = '';
      try {
        const data = await response.json();
        message = data.message ? ` (${data.message})` : '';
      } catch {
        // Keep the generic error when GitHub does not return JSON.
      }
      throw new Error(`Could not load GitHub repositories.${message}`);
    }

    const batch = await response.json();
    repositories.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    private: repository.private,
    description: repository.description,
    defaultBranch: repository.default_branch,
    updatedAt: repository.updated_at,
    htmlUrl: repository.html_url,
  }));
}

export function encryptAccessToken(accessToken) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(accessToken, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptAccessToken(value) {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

export async function getGitHubPullRequests(accessToken, repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls?state=open&sort=updated&direction=desc&per_page=50`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CodeSense' },
  });
  if (!response.ok) throw new Error('Could not load pull requests for this repository.');

  const pullRequests = await response.json();
  return pullRequests.map((pullRequest) => ({
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    state: pullRequest.state,
    draft: pullRequest.draft,
    author: pullRequest.user?.login || 'Unknown',
    sourceBranch: pullRequest.head?.ref || '',
    targetBranch: pullRequest.base?.ref || '',
    createdAt: pullRequest.created_at,
    updatedAt: pullRequest.updated_at,
    htmlUrl: pullRequest.html_url,
  }));
}

export async function getGitHubPullRequestFiles(accessToken, repository, pullNumber) {
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls/${pullNumber}/files?per_page=100`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CodeSense' },
  });
  if (!response.ok) throw new Error('Could not load changed files for this pull request.');

  const files = await response.json();
  return files.map((file) => ({
    sha: file.sha,
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch || null,
    blobUrl: file.blob_url,
  }));
}

export async function createGitHubPullRequestComment(accessToken, repository, pullNumber, body) {
  const response = await fetch(`https://api.github.com/repos/${repository}/issues/${pullNumber}/comments`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'CodeSense',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not post the review comment to GitHub.');
  }

  return { id: data.id, htmlUrl: data.html_url };
}