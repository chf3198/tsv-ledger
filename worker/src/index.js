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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export default {
  async fetch(request, env) {
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
        if (!user) return json({ error: 'Unauthorized' }, 401);

        if (path.startsWith('/api/expenses')) return handleExpenses(request, env, user.id);
      }

      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}
