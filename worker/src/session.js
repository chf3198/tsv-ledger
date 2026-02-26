/**
 * Session Handler - Get/validate/delete sessions
 */
import { json } from './index.js';

export async function handleSession(request, env) {
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  if (action === 'get' && request.method === 'GET') return getSession(request, env);
  if (action === 'delete' && request.method === 'POST') return deleteSession(request, env);

  return json({ error: 'Invalid session action' }, 400);
}

// Exported for use by protected routes
export async function getSessionUser(request, env) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT s.*, u.id as oduserId, u.email, u.name, u.image FROM sessions s JOIN users u ON s.userId = u.id WHERE s.sessionToken = ? AND s.expires > ?'
  ).bind(token, Date.now()).first();

  if (!session) return null;
  return { id: session.userId, email: session.email, name: session.name, image: session.image };
}

async function getSession(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ user: null });
  return json({ user });
}

async function deleteSession(request, env) {
  const token = getTokenFromRequest(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE sessionToken = ?').bind(token).run();
  }
  return json({ success: true });
}

function getTokenFromRequest(request) {
  // Check Authorization header
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  // Check cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) return match[1];
  }

  // Check query param (for OAuth redirect)
  const url = new URL(request.url);
  return url.searchParams.get('session');
}
