// Shoelace-based navigation renderer and deterministic helpers
// This module renders the navigation into #main-navigation and provides
// window.forceSidebarToggle and window.__ensureSidebarState for automation.

(function () {
  console.log('🔧 Shoelace navigation script starting...');

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    console.log('🔧 DOM ready, initializing navigation...');

    // Shoelace is already loaded in HTML, skip dynamic loading
    function loadShoelace() {
      if (window.SHOELACE_LOADED) return Promise.resolve();
      // Assume Shoelace is already loaded from HTML
      window.SHOELACE_LOADED = true;
      return Promise.resolve();
    }

    // Load menu data directly
    async function loadMenuData() {
      try {
        const response = await fetch("/api/menu.json");
        if (!response.ok) throw new Error("Failed to load menu");
        return await response.json();
      } catch (e) {
        console.error("Failed to load menu data:", e);
        // Fallback to default menu
        return [
          {
            href: "#",
            text: "Dashboard",
            icon: "fas fa-tachometer-alt",
            dataSection: "dashboard",
          },
          {
            href: "#",
            text: "Bank Reconciliation",
            icon: "fas fa-balance-scale",
            dataSection: "bank-reconciliation",
          },
          {
            href: "#",
            text: "Subscription Analysis",
          icon: "fas fa-link",
          dataSection: "subscription-analysis",
        },
        {
          href: "#",
          text: "Benefits Management",
          icon: "fas fa-users",
          dataSection: "benefits-management",
        },
        {
          href: "#",
          text: "Geographic Analysis",
          icon: "fas fa-map-marked-alt",
          dataSection: "geographic-analysis",
        },
        {
          href: "#",
          text: "Analysis & Reports",
          icon: "fas fa-chart-bar",
          dataSection: "analysis",
        },
        {
          href: "#",
          text: "AI Insights",
          icon: "fas fa-brain",
          dataSection: "ai-insights",
        },
        {
          href: "#",
          text: "Data Import",
          icon: "fas fa-upload",
          dataSection: "data-import",
        },
        {
          href: "#",
          text: "Manual Entry",
          icon: "fas fa-edit",
          dataSection: "manual-entry",
        },
        {
          href: "#",
          text: "Premium Features",
          icon: "fas fa-crown",
          dataSection: "premium-features",
        },
        {
          href: "#",
          text: "About",
          icon: "fas fa-info-circle",
          dataSection: "about",
        },
        {
          href: "#",
          text: "Settings",
          icon: "fas fa-cog",
          dataSection: "settings",
        },
      ];
    }

    // Main initialization logic
    try {
      await loadShoelace().catch(() => {});
    } catch (e) {
      console.error("Error loading Shoelace:", e);
    }

    // Wait for sl-drawer to be defined before initializing (with timeout)
    try {
      await Promise.race([
        customElements.whenDefined('sl-drawer'),
        new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
      ]);
      console.log('✅ sl-drawer is ready or timeout reached');
    } catch (e) {
      console.warn("sl-drawer definition check failed or timed out:", e);
    }

    // Initialize sidebar state after Shoelace is ready
    setTimeout(initializeSidebarState, 200);

    // Load menu data directly
    let items = await loadMenuData();

    renderNavigation(items);
    setupHelpers();

    // Wire the navbar-toggler to call our deterministic helper
    const toggler = document.querySelector(".navbar-toggler");
    if (toggler) {
      toggler.addEventListener("click", (e) => {
        e.preventDefault();
        window.forceSidebarToggle && window.forceSidebarToggle();
      });

      toggler.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.forceSidebarToggle && window.forceSidebarToggle();
        }
      });
    }

    // Add click-outside logic for desktop sidebar collapse
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.addEventListener("click", (e) => {
        // Only collapse on desktop if sidebar is open
        if (window.innerWidth >= 992) {
          const drawer = document.getElementById("sidebar");
          if (drawer && drawer.hasAttribute("open")) {
            window.forceSidebarToggle && window.forceSidebarToggle(true); // true = force collapse
          }
        }
      });
    }
  }
    // Hide all sections
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");

      // Update URL hash
      window.location.hash = sectionId;

      // Close mobile drawer if open
      const drawer = document.getElementById("sidebar");
      if (drawer && window.innerWidth < 992 && drawer.open) {
        drawer.hide();
      }
    } else {
      console.error("Section not found:", sectionId);
    }
  }

  function renderNavigation(items) {
    const container = document.getElementById("main-navigation");
    if (!container) {
      console.error("Navigation container not found");
      return;
    }
    container.innerHTML = "";

    items.forEach((item) => {
      const a = document.createElement("a");
      a.className = "nav-link d-flex align-items-center";
      a.href = item.href || "#";
      if (item.dataSection) a.setAttribute("data-section", item.dataSection);
      a.innerHTML = `<i class="${item.icon} me-2"></i><span>${item.text}</span>`;
      a.addEventListener("click", (e) => {
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
    const drawer = document.getElementById("sidebar");
    const main = document.querySelector(".main-content");
    if (!drawer || !main) {
      console.error("Sidebar or main content not found");
      return;
    }

    const isDesktop = window.innerWidth >= 992;

    if (isDesktop) {
      // Desktop: check localStorage for collapsed state
      try {
        const collapsed = localStorage.getItem("tsv.sidebar.collapsed") === "1";
        if (collapsed) {
          drawer.hide();
          main.classList.add("expanded");
        } else {
          drawer.show();
          main.classList.remove("expanded");
        }
      } catch (e) {
        console.warn("localStorage error, defaulting to open:", e);
        // Default to open
        drawer.show();
        main.classList.remove("expanded");
      }
    } else {
      // Mobile: always start closed
      drawer.hide();
      main.classList.remove("expanded");
    }

    console.log("Sidebar initialized:", { isDesktop, open: drawer.open });
  }

  // Deterministic helpers for testing
  function setupHelpers() {
    try {
      window.forceSidebarToggle = function (force) {
        try {
          const drawer = document.getElementById("sidebar");
          const main = document.querySelector(".main-content");
          if (!drawer || !main) return null;

          const isDesktop = window.innerWidth >= 992;
          if (isDesktop) {
            // Desktop: toggle collapsed state
            const shouldCollapse =
              typeof force === "boolean" ? force : drawer.open;
            if (shouldCollapse) {
              drawer.hide();
              main.classList.add("expanded");
              try {
                localStorage.setItem("tsv.sidebar.collapsed", "1");
              } catch (e) {}
              return { collapsed: true };
            } else {
              drawer.show();
              main.classList.remove("expanded");
              try {
                localStorage.setItem("tsv.sidebar.collapsed", "0");
              } catch (e) {}
              return { collapsed: false };
            }
          } else {
            // Mobile: toggle drawer
            const shouldOpen =
              typeof force === "boolean" ? force : !drawer.open;
            if (shouldOpen) {
              drawer.show();
              return { open: true };
            } else {
              drawer.hide();
              return { open: false };
            }
          }
        } catch (e) {
          return null;
        }
      };

      window.__ensureSidebarState = function (collapsed) {
        try {
          const drawer = document.getElementById("sidebar");
          const main = document.querySelector(".main-content");
          if (!drawer || !main) return false;

          const isDesktop = window.innerWidth >= 992;
          if (isDesktop) {
            if (collapsed) {
              drawer.hide();
              main.classList.add("expanded");
              try {
                localStorage.setItem("tsv.sidebar.collapsed", "1");
              } catch (e) {}
            } else {
              drawer.show();
              main.classList.remove("expanded");
              try {
                localStorage.setItem("tsv.sidebar.collapsed", "0");
              } catch (e) {}
            }
          } else {
            if (collapsed) {
              drawer.hide();
            } else {
              drawer.show();
            }
          }
          return true;
        } catch (e) {
          return false;
        }
      };
    } catch (e) {}
  }
  // Expose helpers immediately so automation can call them without racing DOMContentLoaded
  try {
    setupHelpers();
    window.showSection = showSection;
  } catch (e) {}

  // Expose helpers immediately so automation can call them without racing DOMContentLoaded
  try {
    setupHelpers();
    window.showSection = showSection;
  } catch (e) {}
})();
