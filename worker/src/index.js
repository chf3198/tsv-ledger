/**
 * TSV Auth Worker - CloudFlare Worker for authentication & data sync
 * Handles: Passkey registration/login, OAuth callbacks, session management, expenses sync
 * ADR-009: Auth.js Multi-Provider Authentication
 * ADR-019: Cloud Sync for Multi-Device Access
 */
import { handlePasskey } from './passkey.js';
import { handleOAuth } from './oauth.js';
import { handleSession, getSessionUser } from './session.js';
import { handleExpenses } from './expenses.js';

// CORS configured for GitHub Pages frontend
const ALLOWED_ORIGINS = [
  'https://chf3198.github.io',
  'http://localhost:3000',  // Local development
  'http://127.0.0.1:3000'
];

export function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const CORS = getCorsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Public auth routes
      if (path.startsWith('/auth/passkey')) return handlePasskey(request, env);
      if (path.startsWith('/auth/oauth')) return handleOAuth(request, env);
      if (path.startsWith('/auth/session')) return handleSession(request, env);

      // Protected routes - require authentication
      if (path.startsWith('/api/')) {
        const user = await getSessionUser(request, env);
        if (!user) return json({ error: 'Unauthorized' }, 401, request);

        if (path.startsWith('/api/expenses')) return handleExpenses(request, env, user.id);
      }

      return json({ error: 'Not found' }, 404, request);
    } catch (e) {
      return json({ error: e.message }, 500, request);
    }
  }
};

export function json(data, status = 200, request = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(request ? getCorsHeaders(request) : { 'Access-Control-Allow-Origin': '*' })
  };
  return new Response(JSON.stringify(data), { status, headers });
}
