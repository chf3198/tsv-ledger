/**
 * TSV Auth Worker - CloudFlare Worker for authentication
 * Handles: Passkey registration/login, OAuth callbacks, session management
 * ADR-009: Auth.js Multi-Provider Authentication
 */
import { handlePasskey } from './passkey.js';
import { handleOAuth } from './oauth.js';
import { handleSession } from './session.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route to handlers
      if (path.startsWith('/auth/passkey')) return handlePasskey(request, env);
      if (path.startsWith('/auth/oauth')) return handleOAuth(request, env);
      if (path.startsWith('/auth/session')) return handleSession(request, env);
      
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
