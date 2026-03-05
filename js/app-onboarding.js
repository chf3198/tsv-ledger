/** Onboarding and storage mode selection (ADR-024, ADR-025, ADR-026) */
const appOnboarding = {
  navigateToImport() {
    this.route = 'import';
    if (!this.showNav) {
      this.onboardingStep = 3;
    }
  },
  async selectStorageMode(mode) {
    if (mode === 'cloud') {
      this.storageMode = 'cloud';
      localStorage.setItem('tsv-storage-mode', 'cloud');
      if (!this.auth.authenticated) {
        this.showAuthModal = true;
      }
    } else if (mode === 'local') {
      this.storageMode = 'local';
      localStorage.setItem('tsv-storage-mode', 'local');
      this.onboardingStep = 3;
    }
  },
  async completeOnboarding() {
    localStorage.setItem('tsv-onboarding-complete', 'true');
    this.onboardingComplete = true;
    await this.loadData();
    this.route = 'dashboard';
  }
};
