/**
 * Auth Service - Frontend authentication client
 * Handles passkey WebAuthn and OAuth flows
 */
const API = window.AUTH_API || '/auth';

// Base64URL encoding/decoding for WebAuthn
const toBase64Url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const fromBase64Url = (str) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

const authService = {
  // Check if passkeys are supported
  supportsPasskeys: () => !!window.PublicKeyCredential,

  // Register new passkey
  async registerPasskey(email, name) {
    // Get registration options from server
    const optRes = await fetch(`${API}/passkey/register-options`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const options = await optRes.json();
    if (options.error) throw new Error(options.error);

    // Create credential via WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: fromBase64Url(options.challenge),
        user: { ...options.user, id: fromBase64Url(options.user.id) }
      }
    });

    // Send credential to server
    const verifyRes = await fetch(`${API}/passkey/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        credential: {
          id: credential.id,
          type: credential.type,
          response: { publicKey: toBase64Url(credential.response.getPublicKey()) },
          transports: credential.response.getTransports?.() || []
        }
      })
    });
    return verifyRes.json();
  },

  // Login with passkey
  async loginPasskey(email) {
    const optRes = await fetch(`${API}/passkey/login-options`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const options = await optRes.json();
    if (options.error) throw new Error(options.error);

    const credential = await navigator.credentials.get({
      publicKey: {
        ...options,
        challenge: fromBase64Url(options.challenge),
        allowCredentials: options.allowCredentials?.map(c => ({ ...c, id: fromBase64Url(c.id) }))
      }
    });

    const verifyRes = await fetch(`${API}/passkey/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: { id: credential.id, type: credential.type } })
    });
    return verifyRes.json();
  },

  // Start OAuth flow
  startOAuth(provider) {
    window.location.href = `${API}/oauth/${provider}/start`;
  },

  // Get current session
  async getSession() {
    const res = await fetch(`${API}/session/get`, { credentials: 'include' });
    return res.json();
  },

  // Logout
  async logout() {
    await fetch(`${API}/session/delete`, { method: 'POST', credentials: 'include' });
  }
};

window.authService = authService;
