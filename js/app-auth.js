/** Auth-related methods for expenseApp (ADR-009, ADR-019, ADR-026) */
const appAuth = {
  async handleOAuthCallback() {
    const api = window.AUTH_API || 'https://tsv-ledger-api.chf3198.workers.dev/auth';
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
      localStorage.setItem('tsv-session', session);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = localStorage.getItem('tsv-session');
    if (!token) {
      this.sessionState = 'unauthenticated';
      return;
    }

    this.sessionState = 'auth-pending';
    try {
      const res = await fetch(`${api}/session/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user) {
        this.auth = { user: data.user, authenticated: true };
        localStorage.setItem('tsv-auth', JSON.stringify(this.auth));
        this.storageIntent = 'cloud';
        localStorage.setItem('tsv-storage-mode', 'cloud');
        this.sessionState = 'authenticated';
        this.showAuthModal = false;
        if (this.pendingCloudMigration) await this.completePendingCloudMigration();
        if (!this.showNav) this.onboardingStep = 3;
        return;
      }

      localStorage.removeItem('tsv-session');
      localStorage.removeItem('tsv-auth');
      this.auth = { user: null, authenticated: false };
      this.sessionState = 'unauthenticated';
    } catch (e) {
      console.error('Session check failed:', e);
      localStorage.removeItem('tsv-session');
      localStorage.removeItem('tsv-auth');
      this.auth = { user: null, authenticated: false };
      this.sessionState = 'unauthenticated';
    }
  },
  authWith(provider) {
    const api = window.AUTH_API || 'https://tsv-ledger-api.chf3198.workers.dev/auth';
    window.location.href = `${api}/oauth/${provider}/start`;
  },
  logout() {
    this.auth = { user: null, authenticated: false };
    localStorage.removeItem('tsv-auth');
    localStorage.removeItem('tsv-session');
    this.sessionState = 'unauthenticated';
    ['tsv-expenses', 'tsv-import-history', 'tsv-storage-mode', 'tsv-onboarding-complete', 'tsv-local-profile', 'tsv-local-data-locked', 'tsv-pending-cloud-migration'].forEach(k => localStorage.removeItem(k));
    this.storageIntent = null;
    this.localProfile = null;
    this.localAliasDraft = '';
    this.localDataLocked = false;
    this.pendingCloudMigration = false;
    this.onboardingStep = 1;
    this.onboardingComplete = false;
    this.expenses = [];
    this.importHistory = [];
    this.showUserMenu = false;
    this.showAuthModal = false;
  }
};
