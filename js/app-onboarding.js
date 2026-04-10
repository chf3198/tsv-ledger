/** Onboarding and storage mode selection (ADR-024, ADR-025, ADR-026) */
const appOnboarding = {
  setTermsAccepted() {
    localStorage.setItem('tsv-terms-accepted', this.termsAccepted ? 'true' : 'false');
  },
  navigateToImport() {
    this.route = 'import';
    if (!this.showNav) {
      this.onboardingStep = 3;
    }
  },
  async selectStorageMode(mode) {
    localStorage.removeItem('tsv-local-data-locked');
    this.localDataLocked = false;
    if (mode === 'cloud') {
      this.storageIntent = 'cloud';
      localStorage.setItem('tsv-storage-mode', 'cloud');
      if (!this.auth.authenticated) {
        this.showAuthModal = true;
      }
    } else if (mode === 'local') {
      this.storageIntent = 'local';
      localStorage.setItem('tsv-storage-mode', 'local');
      this.ensureLocalProfile();
      this.localAliasDraft = this.localProfile?.alias || '';
      this.onboardingStep = 3;
    }
  },
  async completeOnboarding() {
    localStorage.setItem('tsv-onboarding-complete', 'true');
    this.onboardingComplete = true;
    await this.loadData();
    this.route = 'dashboard';
  },
  resetToOnboarding() {
    localStorage.removeItem('tsv-storage-mode');
    localStorage.removeItem('tsv-onboarding-complete');
    this.storageIntent = null;
    this.onboardingComplete = false;
    this.onboardingStep = 1;
    this.route = 'dashboard';
  }
};
