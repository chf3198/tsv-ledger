// Shoelace-based navigation renderer and deterministic helpers
// This module renders the navigation into #main-navigation and provides
// window.forceSidebarToggle and window.__ensureSidebarState for automation.

(function () {
  // Load Shoelace assets dynamically
  function loadShoelace() {
    if (window.SHOELACE_LOADED) return Promise.resolve();
    return new Promise((resolve, reject) => {
      try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.83/dist/themes/light.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.83/dist/shoelace.js';
        script.onload = () => { window.SHOELACE_LOADED = true; resolve(); };
        script.onerror = () => reject(new Error('Failed to load Shoelace'));;
        document.head.appendChild(script);
      } catch (e) {
        reject(e);
      }
    });
  }

  // Load menu data directly
  async function loadMenuData() {
    try {
      const response = await fetch('/api/menu.json');
      if (!response.ok) throw new Error('Failed to load menu');
      return await response.json();
    } catch (e) {
      console.error('Failed to load menu data:', e);
      // Fallback to default menu
      return [
        { href: '#', text: 'Dashboard', icon: 'fas fa-tachometer-alt', dataSection: 'dashboard' },
        { href: '#', text: 'Analysis & Reports', icon: 'fas fa-chart-bar', dataSection: 'analysis' },
        { href: '#', text: 'Data Import', icon: 'fas fa-upload', dataSection: 'data-import' },
        { href: '#', text: 'Settings', icon: 'fas fa-cog', dataSection: 'settings' }
      ];
    }
  }

  // Implement section navigation
  function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');

      // Update URL hash
      window.location.hash = sectionId;

      // Close mobile drawer if open
      const drawer = document.getElementById('sidebar');
      if (drawer && window.innerWidth < 992) {
        drawer.removeAttribute('open');
      }
    } else {
      console.error('Section not found:', sectionId);
    }
  }

  function renderNavigation(items) {
    const container = document.getElementById('main-navigation');
    if (!container) {
      console.error('Navigation container not found');
      return;
    }
    container.innerHTML = '';

    items.forEach((item) => {
      const a = document.createElement('a');
      a.className = 'nav-link d-flex align-items-center';
      a.href = item.href || '#';
      if (item.dataSection) a.setAttribute('data-section', item.dataSection);
      a.innerHTML = `<i class="${item.icon} me-2"></i><span>${item.text}</span>`;
      a.addEventListener('click', (e) => {
        if (item.dataSection) {
          e.preventDefault();
          showSection(item.dataSection);
        }
      });
      container.appendChild(a);
    });
  }

  // Initialize sidebar state based on screen size and saved preference
  function initializeSidebarState() {
    const drawer = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    if (!drawer || !main) return;

    const isDesktop = window.innerWidth >= 992;

    if (isDesktop) {
      // Desktop: check localStorage for collapsed state
      try {
        const collapsed = localStorage.getItem('tsv.sidebar.collapsed') === '1';
        if (collapsed) {
          drawer.removeAttribute('open');
          main.classList.add('expanded');
        } else {
          drawer.setAttribute('open', '');
          main.classList.remove('expanded');
        }
      } catch (e) {
        // Default to open
        drawer.setAttribute('open', '');
        main.classList.remove('expanded');
      }
    } else {
      // Mobile: always start closed
      drawer.removeAttribute('open');
      main.classList.remove('expanded');
    }
  }

  // Deterministic helpers for testing
  function setupHelpers() {
    try {
      window.forceSidebarToggle = function(force) {
        try {
          const drawer = document.getElementById('sidebar');
          const main = document.querySelector('.main-content');
          if (!drawer || !main) return null;

          const isDesktop = window.innerWidth >= 992;
          if (isDesktop) {
            // Desktop: toggle collapsed state
            const shouldCollapse = (typeof force === 'boolean') ? force : drawer.hasAttribute('open');
            if (shouldCollapse) {
              drawer.removeAttribute('open');
              main.classList.add('expanded');
              try { localStorage.setItem('tsv.sidebar.collapsed', '1'); } catch (e) {}
              return { collapsed: true };
            } else {
              drawer.setAttribute('open', '');
              main.classList.remove('expanded');
              try { localStorage.setItem('tsv.sidebar.collapsed', '0'); } catch (e) {}
              return { collapsed: false };
            }
          } else {
            // Mobile: toggle drawer
            const shouldOpen = (typeof force === 'boolean') ? force : !drawer.hasAttribute('open');
            if (shouldOpen) {
              drawer.setAttribute('open', '');
              return { open: true };
            } else {
              drawer.removeAttribute('open');
              return { open: false };
            }
          }
        } catch (e) { return null; }
      };

      window.__ensureSidebarState = function(collapsed) {
        try {
          const drawer = document.getElementById('sidebar');
          const main = document.querySelector('.main-content');
          if (!drawer || !main) return false;

          const isDesktop = window.innerWidth >= 992;
          if (isDesktop) {
            if (collapsed) {
              drawer.removeAttribute('open');
              main.classList.add('expanded');
              try { localStorage.setItem('tsv.sidebar.collapsed', '1'); } catch (e) {}
            } else {
              drawer.setAttribute('open', '');
              main.classList.remove('expanded');
              try { localStorage.setItem('tsv.sidebar.collapsed', '0'); } catch (e) {}
            }
          } else {
            if (collapsed) {
              drawer.removeAttribute('open');
            } else {
              drawer.setAttribute('open', '');
            }
          }
          return true;
        } catch (e) { return false; }
      };
    } catch (e) {}
  }
  // Expose helpers immediately so automation can call them without racing DOMContentLoaded
  try {
    setupHelpers();
    window.showSection = showSection;
  } catch (e) {}

  // Initialize navigation when DOM is ready
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadShoelace().catch(() => {});
    } catch (e) {
      console.error('Error loading Shoelace:', e);
    }

    // Initialize sidebar state after a short delay to ensure Shoelace has processed the drawer
    setTimeout(initializeSidebarState, 100);

    // Load menu data directly
    let items = await loadMenuData();

    renderNavigation(items);
    setupHelpers();

    // Wire the navbar-toggler to call our deterministic helper
    const toggler = document.querySelector('.navbar-toggler');
    if (toggler) {
      toggler.addEventListener('click', (e) => {
        e.preventDefault();
        window.forceSidebarToggle && window.forceSidebarToggle();
      });

      toggler.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.forceSidebarToggle && window.forceSidebarToggle();
        }
      });
    }

    // Add click-outside logic for desktop sidebar collapse
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('click', (e) => {
        // Only collapse on desktop if sidebar is open
        if (window.innerWidth >= 992) {
          const drawer = document.getElementById('sidebar');
          if (drawer && drawer.hasAttribute('open')) {
            window.forceSidebarToggle && window.forceSidebarToggle(true); // true = force collapse
          }
        }
      });
    }
  });
})();
