// Shared canonical menu used by both server and client
module.exports = [
  { href: '/', text: 'Dashboard', icon: 'fas fa-tachometer-alt', dataSection: 'dashboard' },
  { href: '/reconciliation.html', text: 'Bank Reconciliation', icon: 'fas fa-balance-scale' },
  { href: '/subscription-analysis.html', text: 'Subscription Analysis', icon: 'fas fa-link' },
  { href: '/employee-benefits.html', text: 'Employee Benefits', icon: 'fas fa-users' },
  { href: '/geographic-analysis.html', text: 'Geographic Analysis', icon: 'fas fa-map-marked-alt' },
  { href: '#', text: 'Analysis & Reports', icon: 'fas fa-chart-bar', dataSection: 'analysis' },
  { href: '#', text: 'AI Insights', icon: 'fas fa-brain', dataSection: 'ai-insights' },
  { href: '#', text: 'Data Import', icon: 'fas fa-upload', dataSection: 'data-import' },
  { href: '#', text: 'Manual Entry', icon: 'fas fa-edit', dataSection: 'manual-entry' },
  { href: '#', text: 'Premium Features', icon: 'fas fa-crown', dataSection: 'premium-features' },
  { href: '#', text: 'Settings', icon: 'fas fa-cog', dataSection: 'settings' }
];
