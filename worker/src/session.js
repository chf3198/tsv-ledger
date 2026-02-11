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

async function getSession(request, env) {
  const token = getTokenFromRequest(request);
  if (!token) return json({ user: null });
  
  const session = await env.DB.prepare(
    'SELECT s.*, u.email, u.name, u.image FROM sessions s JOIN users u ON s.userId = u.id WHERE s.sessionToken = ? AND s.expires > ?'
  ).bind(token, Date.now()).first();
  
  if (!session) return json({ user: null });
  
  return json({ 
    user: { id: session.userId, email: session.email, name: session.name, image: session.image },
    expires: session.expires
  });
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
