/**
 * Shared utilities for auth worker
 */
export const toBase64Url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

export const fromBase64Url = (str) => 
  Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

export const generateId = () => toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
export const generateToken = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

export async function createSession(env, userId) {
  const sessionToken = generateToken();
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  await env.DB.prepare('INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?, ?, ?, ?)')
    .bind(generateId(), sessionToken, userId, expires).run();
  return sessionToken;
}

export async function findOrCreateUser(env, email, name, image = null) {
  let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    const userId = generateId();
    await env.DB.prepare('INSERT INTO users (id, email, name, image, emailVerified) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, email, name, image, Date.now()).run();
    user = { id: userId };
  }
  return user;
}
