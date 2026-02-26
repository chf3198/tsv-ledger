/**
 * Cloud Sync Client - Syncs local data with Cloudflare D1
 * ADR-019: Cloud Sync for Multi-Device Access
 */

const API_URL = 'https://tsv-ledger-api.chf3198.workers.dev';

// Get session token from localStorage
const getToken = () => {
  const auth = JSON.parse(localStorage.getItem('tsv-auth') || '{}');
  return auth.sessionToken;
};

// Fetch with auth header
const authFetch = async (path, options = {}) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

// Sync local expenses to cloud
const syncToCloud = async (expenses, importHistory) => {
  return authFetch('/api/expenses/sync', {
    method: 'POST',
    body: JSON.stringify({ expenses, importHistory })
  });
};

// Fetch expenses from cloud
const fetchFromCloud = async () => {
  return authFetch('/api/expenses/list');
};

// Full sync: merge local and cloud data
const fullSync = async () => {
  const local = {
    expenses: JSON.parse(localStorage.getItem('tsv-expenses') || '[]'),
    importHistory: JSON.parse(localStorage.getItem('tsv-import-history') || '[]')
  };

  // First push local to cloud
  await syncToCloud(local.expenses, local.importHistory);

  // Then fetch merged result
  const cloud = await fetchFromCloud();

  // Update local with cloud data (cloud is source of truth after merge)
  localStorage.setItem('tsv-expenses', JSON.stringify(cloud.expenses));
  localStorage.setItem('tsv-import-history', JSON.stringify(cloud.importHistory));

  return cloud;
};

window.cloudSync = { syncToCloud, fetchFromCloud, fullSync, getToken };
