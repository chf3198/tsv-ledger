/**
 * Passkey (WebAuthn) Handler - Registration and login using FIDO2 credentials
 */
import { json } from './index.js';
import { generateId, generateToken, fromBase64Url, createSession, findOrCreateUser } from './helpers.js';

export async function handlePasskey(request, env) {
  const action = new URL(request.url).pathname.split('/').pop();
  if (action === 'register-options') return getRegistrationOptions(request, env);
  if (action === 'register') return verifyRegistration(request, env);
  if (action === 'login-options') return getLoginOptions(request, env);
  if (action === 'login') return verifyLogin(request, env);
  return json({ error: 'Invalid passkey action' }, 400);
}

async function getRegistrationOptions(request, env) {
  const { email, name } = await request.json();
  if (!email) return json({ error: 'Email required' }, 400);
  
  const challenge = generateToken();
  await env.DB.prepare('INSERT OR REPLACE INTO challenges (email, challenge, expires) VALUES (?, ?, ?)')
    .bind(email, challenge, Date.now() + 300000).run();
  
  return json({ challenge, rp: { name: 'TSV Expenses', id: new URL(request.url).hostname },
    user: { id: generateId(), name: email, displayName: name || email },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
    timeout: 60000, attestation: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' } });
}

async function verifyRegistration(request, env) {
  const { email, credential } = await request.json();
  const row = await env.DB.prepare('SELECT challenge FROM challenges WHERE email = ? AND expires > ?')
    .bind(email, Date.now()).first();
  if (!row) return json({ error: 'Challenge expired' }, 400);
  
  const user = await findOrCreateUser(env, email, email);
  await env.DB.prepare('INSERT INTO passkeys (id, credentialID, userId, publicKey, transports) VALUES (?, ?, ?, ?, ?)')
    .bind(generateId(), credential.id, user.id, credential.response.publicKey, JSON.stringify(credential.transports || [])).run();
  await env.DB.prepare('DELETE FROM challenges WHERE email = ?').bind(email).run();
  
  return json({ success: true, userId: user.id });
}

async function getLoginOptions(request, env) {
  const { email } = await request.json();
  const challenge = generateToken();
  
  let allowCredentials = [];
  if (email) {
    const passkeys = await env.DB.prepare(
      'SELECT p.credentialID, p.transports FROM passkeys p JOIN users u ON p.userId = u.id WHERE u.email = ?'
    ).bind(email).all();
    allowCredentials = passkeys.results?.map(p => ({ id: p.credentialID, type: 'public-key', transports: JSON.parse(p.transports || '[]') })) || [];
  }
  
  await env.DB.prepare('INSERT OR REPLACE INTO challenges (email, challenge, expires) VALUES (?, ?, ?)')
    .bind(email || 'anonymous', challenge, Date.now() + 300000).run();
  return json({ challenge, allowCredentials, timeout: 60000, userVerification: 'preferred' });
}

async function verifyLogin(request, env) {
  const { credential } = await request.json();
  const passkey = await env.DB.prepare(
    'SELECT p.*, u.email, u.name FROM passkeys p JOIN users u ON p.userId = u.id WHERE p.credentialID = ?'
  ).bind(credential.id).first();
  if (!passkey) return json({ error: 'Passkey not found' }, 401);
  
  await env.DB.prepare('UPDATE passkeys SET counter = counter + 1 WHERE id = ?').bind(passkey.id).run();
  const sessionToken = await createSession(env, passkey.userId);
  
  return json({ user: { id: passkey.userId, email: passkey.email, name: passkey.name }, sessionToken,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
}
