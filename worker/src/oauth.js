/**
 * OAuth Handler - Google & GitHub authentication
 */
import { json } from './index.js';
import { generateId, createSession, findOrCreateUser } from './helpers.js';

const PROVIDERS = {
  google: { authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo', scope: 'openid email profile' },
  github: { authUrl: 'https://github.com/login/oauth/authorize', tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user', scope: 'read:user user:email' }
};

export async function handleOAuth(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const provider = parts[parts.length - 2];
  const step = parts[parts.length - 1];

  if (step === 'start') return startOAuth(provider, request, env);
  if (step === 'callback') return handleCallback(provider, request, env);
  return json({ error: 'Invalid OAuth action' }, 400);
}

function startOAuth(provider, request, env) {
  const config = PROVIDERS[provider];
  if (!config) return json({ error: 'Unknown provider' }, 400);

  const url = new URL(request.url);
  const clientId = env[`${provider.toUpperCase()}_CLIENT_ID`];
  if (!clientId) return json({ error: `${provider} not configured` }, 500);

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${url.origin}/auth/oauth/${provider}/callback`);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', generateId());
  authUrl.searchParams.set('response_type', 'code');
  return Response.redirect(authUrl.toString(), 302);
}

async function handleCallback(provider, request, env) {
  const config = PROVIDERS[provider];
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'No authorization code' }, 400);

  const redirectUri = `${url.origin}/auth/oauth/${provider}/callback`;
  const tokens = await exchangeCode(config.tokenUrl, code, env, provider, redirectUri);
  if (!tokens.access_token) return json({ error: 'Token exchange failed' }, 400);

  const profile = await fetchProfile(config.userUrl, tokens.access_token, provider);
  const user = await findOrCreateUser(env, profile.email, profile.name, profile.image);

  await env.DB.prepare(`INSERT OR REPLACE INTO accounts
    (id, userId, type, provider, providerAccountId, access_token, refresh_token, expires_at) VALUES (?,?,'oauth',?,?,?,?,?)`)
    .bind(generateId(), user.id, provider, profile.id, tokens.access_token, tokens.refresh_token,
      tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null).run();

  const sessionToken = await createSession(env, user.id);
  const frontend = env.FRONTEND_URL || 'https://curtisfranks.github.io/tsv-ledger';
  return new Response(null, { status: 302, headers: { Location: `${frontend}/?session=${sessionToken}` }});
}

async function exchangeCode(tokenUrl, code, env, provider, redirectUri) {
  const res = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: env[`${provider.toUpperCase()}_CLIENT_ID`], client_secret: env[`${provider.toUpperCase()}_CLIENT_SECRET`],
      code, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  return res.json();
}

async function fetchProfile(userUrl, token, provider) {
  const res = await fetch(userUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }});
  const p = await res.json();
  const email = p.email || (provider === 'github' ? await getGitHubEmail(token) : null);
  return { id: p.id?.toString() || p.sub, email, name: p.name || p.login, image: p.picture || p.avatar_url };
}

async function getGitHubEmail(token) {
  const res = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }});
  const emails = await res.json();
  return emails.find(e => e.primary)?.email || emails[0]?.email;
}
