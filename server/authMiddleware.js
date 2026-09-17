import { registerUser, loginUser, validateSession, deleteSession } from './db.js';

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

    if (!url.startsWith('/api/auth/')) {
      return next();
    }

    try {
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
