import {
  registerUser,
  loginUser,
  validateSession,
  deleteSession,
  createAnalysisHistory,
  getAnalysisHistory,
  deleteAnalysisHistory,
  createGitHubReviewHistory,
  getGitHubReviewHistory,
  deleteGitHubReviewHistory,
  getGitHubConnection,
  saveGitHubConnection,
  deleteGitHubConnection
} from './db.js';
import {
  decryptAccessToken,
  encryptAccessToken,
  exchangeCode,
  getGitHubAuthorizationUrl,
  getGitHubRepositories,
  getGitHubPullRequests,
  getGitHubPullRequestFiles,
  getGitHubUser,
  isGitHubConfigured,
  readOAuthState
} from './github.js';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Malformed JSON request body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function createAuthMiddleware() {
  return async (req, res, next) => {
    const url = req.url ? req.url.split('?')[0] : '';

    if (!url.startsWith('/api/auth/') && !url.startsWith('/api/history') && !url.startsWith('/api/github')) {
      return next();
    }

    try {
      if (url === '/api/github/callback') {
        const params = new URL(`http://localhost${req.url}`).searchParams;
        const code = params.get('code');
        const state = params.get('state');
        if (!code || !state) return sendJson(res, 400, { error: 'GitHub authorization was incomplete.' });

        const userId = readOAuthState(state);
        const token = await exchangeCode(code);
        const githubUser = await getGitHubUser(token.access_token);
        saveGitHubConnection(userId, {
          githubUserId: String(githubUser.id),
          githubUsername: githubUser.login,
          encryptedAccessToken: encryptAccessToken(token.access_token),
          scopes: token.scope || 'read:user repo'
        });
        res.statusCode = 302;
        res.setHeader('Location', '/github?connected=1');
        return res.end();
      }

      if (url.startsWith('/api/github/')) {
        const authHeader = req.headers['authorization'];
        const sessionToken = authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : null;
        const user = validateSession(sessionToken);

        if (!user) return sendJson(res, 401, { error: 'Unauthorized or session expired.' });

        if (req.method === 'GET' && url === '/api/github/status') {
          const connection = getGitHubConnection(user.id);
          return sendJson(res, 200, {
            configured: isGitHubConfigured(),
            connected: Boolean(connection),
            account: connection ? {
              id: connection.github_user_id,
              username: connection.github_username,
              scopes: connection.scopes,
              connectedAt: connection.created_at
            } : null
          });
        }

        if (req.method === 'GET' && url === '/api/github/repositories') {
          const connection = getGitHubConnection(user.id);
          if (!connection) return sendJson(res, 409, { error: 'Connect a GitHub account first.' });

          const accessToken = decryptAccessToken(connection.encrypted_access_token);
          const repositories = await getGitHubRepositories(accessToken);
          return sendJson(res, 200, { repositories });
        }

        if (req.method === 'GET' && url === '/api/github/pull-requests') {
          const connection = getGitHubConnection(user.id);
          if (!connection) return sendJson(res, 409, { error: 'Connect a GitHub account first.' });

          const params = new URL(`http://localhost${req.url}`).searchParams;
          const repository = params.get('repository');
          if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
            return sendJson(res, 400, { error: 'A valid repository is required.' });
          }

          const accessToken = decryptAccessToken(connection.encrypted_access_token);
          const pullRequests = await getGitHubPullRequests(accessToken, repository);
          return sendJson(res, 200, { pullRequests });
        }

        if (req.method === 'GET' && url === '/api/github/pull-request-files') {
          const connection = getGitHubConnection(user.id);
          if (!connection) return sendJson(res, 409, { error: 'Connect a GitHub account first.' });

          const params = new URL(`http://localhost${req.url}`).searchParams;
          const repository = params.get('repository');
          const pullNumber = Number(params.get('pullNumber'));
          if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !Number.isInteger(pullNumber) || pullNumber < 1) {
            return sendJson(res, 400, { error: 'A valid repository and pull request are required.' });
          }

          const accessToken = decryptAccessToken(connection.encrypted_access_token);
          const files = await getGitHubPullRequestFiles(accessToken, repository, pullNumber);
          return sendJson(res, 200, { files });
        }

        if (req.method === 'GET' && url === '/api/github/review-history') {
          return sendJson(res, 200, { history: getGitHubReviewHistory(user.id) });
        }

        if (req.method === 'POST' && url === '/api/github/review-history') {
          const body = await parseBody(req);
          const { repository, pullNumber, filename, code, analysis } = body;
          if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !Number.isInteger(pullNumber) || pullNumber < 1 || !filename || !code || !analysis || typeof analysis.score !== 'number') {
            return sendJson(res, 400, { error: 'Repository, pull request, filename, code, and analysis are required.' });
          }
          const entry = createGitHubReviewHistory(user.id, { repository, pullNumber, filename, code, analysis });
          return sendJson(res, 201, { entry });
        }

        if (req.method === 'DELETE' && url.startsWith('/api/github/review-history/')) {
          const reviewId = url.substring('/api/github/review-history/'.length);
          deleteGitHubReviewHistory(user.id, reviewId);
          return sendJson(res, 200, { success: true });
        }

        if (req.method === 'GET' && url === '/api/github/connect') {
          if (!isGitHubConfigured()) return sendJson(res, 503, { error: 'GitHub OAuth is not configured.' });
          return sendJson(res, 200, { authorizationUrl: getGitHubAuthorizationUrl(user.id) });
        }

        if (req.method === 'DELETE' && url === '/api/github/connection') {
          const connection = getGitHubConnection(user.id);
          if (connection) {
            try {
              const accessToken = decryptAccessToken(connection.encrypted_access_token);
              await fetch('https://api.github.com/applications/grants/revoke', {
                method: 'DELETE',
                headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CodeSense' }
              });
            } catch {
              // Remove the local connection even if the remote revoke is unavailable.
            }
          }
          deleteGitHubConnection(user.id);
          return sendJson(res, 200, { success: true });
        }

        return sendJson(res, 404, { error: 'GitHub endpoint not found.' });
      }

      if (url.startsWith('/api/history')) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : null;
        const user = validateSession(token);

        if (!user) {
          return sendJson(res, 401, { error: 'Unauthorized or session expired.' });
        }

        if (req.method === 'GET' && url === '/api/history') {
          return sendJson(res, 200, { history: getAnalysisHistory(user.id) });
        }

        if (req.method === 'POST' && url === '/api/history') {
          const body = await parseBody(req);
          const { code, language, analysis } = body;

          if (!code || !language || !analysis) {
            return sendJson(res, 400, { error: 'Code, language, and analysis are required.' });
          }

          const historyEntry = createAnalysisHistory(user.id, code, language, analysis);
          return sendJson(res, historyEntry.duplicate ? 200 : 201, { entry: historyEntry });
        }

        if (req.method === 'DELETE' && url.startsWith('/api/history/')) {
          const historyId = url.substring('/api/history/'.length);
          deleteAnalysisHistory(user.id, historyId);
          return sendJson(res, 200, { success: true });
        }

        return sendJson(res, 404, { error: 'History endpoint not found.' });
      }

      if (req.method === 'POST' && url === '/api/auth/register') {
        const body = await parseBody(req);
        const { name, email, password } = body;

        if (!name || !name.trim()) {
          return sendJson(res, 400, { error: 'Please enter your full name.' });
        }
        if (!email || !email.includes('@')) {
          return sendJson(res, 400, { error: 'Please provide a valid email address.' });
        }
        if (!password || password.length < 6) {
          return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
        }

        const session = registerUser(name, email, password);
        return sendJson(res, 201, { user: session.user, token: session.token });
      }

      if (req.method === 'POST' && url === '/api/auth/login') {
        const body = await parseBody(req);
        const { email, password } = body;

        if (!email || !password) {
          return sendJson(res, 400, { error: 'Please provide both email and password.' });
        }

        const session = loginUser(email, password);
        return sendJson(res, 200, { user: session.user, token: session.token });
      }

      if (req.method === 'POST' && url === '/api/auth/demo') {
        const session = loginUser('demo@codesense.pro', 'demo1234');
        return sendJson(res, 200, { user: session.user, token: session.token });
      }

      if (req.method === 'GET' && url === '/api/auth/me') {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : null;

        const user = validateSession(token);
        if (!user) {
          return sendJson(res, 401, { error: 'Unauthorized or session expired.' });
        }
        return sendJson(res, 200, { user });
      }

      if (req.method === 'POST' && url === '/api/auth/logout') {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : null;

        if (token) {
          deleteSession(token);
        }
        return sendJson(res, 200, { success: true });
      }

      return next();
    } catch (err) {
      console.error('Auth endpoint error:', err);
      return sendJson(res, 400, { error: err.message || 'Authentication request failed.' });
    }
  };
}
