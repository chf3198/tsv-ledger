/** Local identity and local sign-out methods (ADR-030) */
const LOCAL_PROFILE_KEY = 'tsv-local-profile';
const LOCAL_LOCK_KEY = 'tsv-local-data-locked';
const PENDING_MIGRATION_KEY = 'tsv-pending-cloud-migration';

const appIdentity = {
  ensureLocalProfile() {
    if (this.localProfile?.alias) return;
    this.localProfile = { alias: 'Local User' };
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(this.localProfile));
    this.localAliasDraft = this.localProfile.alias;
  },
  saveLocalAlias() {
    const alias = (this.localAliasDraft || '').trim() || 'Local User';
    this.localProfile = { alias };
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(this.localProfile));
  },
  openLocalSignOut() {
    this.showLocalSignOutModal = true;
  },
  closeLocalSignOut() {
    this.showLocalSignOutModal = false;
  },
  async moveLocalDataToCloud() {
    this.pendingCloudMigration = true;
    localStorage.setItem(PENDING_MIGRATION_KEY, 'true');
    localStorage.removeItem(LOCAL_LOCK_KEY);
    this.localDataLocked = false;
    this.storageIntent = 'cloud';
    localStorage.setItem('tsv-storage-mode', 'cloud');
    this.showLocalSignOutModal = false;
    await this.loadData();
    if (this.sessionState === 'authenticated') {
      await this.completePendingCloudMigration();
      return;
    }
    this.showAuthModal = true;
  },
  lockLocalData() {
    this.localDataLocked = true;
    localStorage.setItem(LOCAL_LOCK_KEY, 'true');
    this.showLocalSignOutModal = false;
    this.loadData();
  },
  resumeLocalAccess() {
    this.localDataLocked = false;
    localStorage.removeItem(LOCAL_LOCK_KEY);
    this.loadData();
  },
  deleteLocalData() {
    ['tsv-expenses', 'tsv-import-history', 'tsv-storage-mode', 'tsv-onboarding-complete', LOCAL_PROFILE_KEY, LOCAL_LOCK_KEY, PENDING_MIGRATION_KEY].forEach(k => localStorage.removeItem(k));
    this.storageIntent = null;
    this.localProfile = null;
    this.localAliasDraft = '';
    this.localDataLocked = false;
    this.pendingCloudMigration = false;
    this.onboardingComplete = false;
    this.onboardingStep = 1;
    this.expenses = [];
    this.importHistory = [];
    this.showLocalSignOutModal = false;
    this.route = 'dashboard';
    this.refresh();
  },
  async completePendingCloudMigration() {
    if (!this.pendingCloudMigration) return;
    await this.syncToCloud();
    this.pendingCloudMigration = false;
    localStorage.removeItem(PENDING_MIGRATION_KEY);
  }
};
