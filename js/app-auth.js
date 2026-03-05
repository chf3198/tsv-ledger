/** Auth-related methods for expenseApp (ADR-009, ADR-019, ADR-026) */
const appAuth = {
  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    try {
      const res = await fetch('/auth/session', {
        headers: { 'Authorization': `Bearer ${code}` }
      });
      if (res.ok) {
        const session = await res.json();
        if (session.token) {
          localStorage.setItem('tsv-auth', JSON.stringify({ token: session.token }));
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) { console.error('OAuth callback failed:', e); }
  },
  authWith(provider) {
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const clientId = provider === 'github' ? '1234567890' : '0987654321';
    const authUrl = provider === 'github'
      ? `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`
      : `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  },
  logout() {
    localStorage.removeItem('tsv-auth');
    localStorage.removeItem('tsv-session');
    this.auth = { user: null, authenticated: false };
    this.showUserMenu = false;
    this.showAuthModal = false;
  }
};
