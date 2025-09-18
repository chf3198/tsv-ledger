// Renders the canonical menu into the page. Looks for an element with id 'app-menu' or '.sidebar'
(function(){
  function renderMenu(container) {
    const menu = (window.getTsvMenu && window.getTsvMenu()) || [];
    if (!menu || !menu.length) return;
    // Normalize container for legacy pages: ensure it has id 'sidebar'.
    // If the placeholder used a different id (eg 'app-menu'), preserve that value
    // on a data attribute so it's still discoverable by tools/readers.
    try {
      var originalId = container.id || '';
      if (originalId && originalId !== 'sidebar') {
        container.setAttribute('data-app-menu-id', originalId);
      }
      // assign legacy id so existing page scripts that call getElementById('sidebar') work
      container.id = 'sidebar';
      if (!container.classList.contains('sidebar')) container.classList.add('sidebar');
    } catch (e) {
      // defensive: fail silently if container is not an Element
    }

    // Collect page-specific nav items BEFORE we clear/replace the container.
    // We look for nav links that are not inside a navbar or the sidebar itself.
    function collectPageNavAnchors() {
      try {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.filter(a => {
          // Must look like a nav-link (class or inside a nav)
          const looksLikeNav = a.classList.contains('nav-link') || a.closest('nav') || a.closest('.nav');
          if (!looksLikeNav) return false;
          // Ignore anchors that are already in the sidebar
          if (a.closest('.sidebar')) return false;
          // Ignore header/top navbar links
          if (a.closest('.navbar') || a.closest('[role="navigation"]')) return false;
          // Ignore anchors that are script placeholders or javascript: links
          const href = a.getAttribute('href') || '';
          if (!href || href.startsWith('javascript:') || href.startsWith('#') && !a.dataset.section) return false;
          return true;
        });
      } catch (e) {
        return [];
      }
    }

    const pageAnchors = collectPageNavAnchors();
    // create header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = `<h4><i class="fas fa-chart-line me-2"></i>TSV Ledger</h4><small class="text-muted">Financial Intelligence Platform</small>`;

    const ul = document.createElement('ul');
    ul.className = 'sidebar-nav nav flex-column p-3';

    menu.forEach(item => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      const a = document.createElement('a');
      a.className = 'nav-link';
      if (item.dataSection) a.setAttribute('data-section', item.dataSection);
      a.href = item.href;
      a.innerHTML = `<i class="${item.icon} me-2"></i>${item.text}`;
      li.appendChild(a);
      ul.appendChild(li);
    });

    // clear container and append
    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(ul);

    // If the page defines additional nav links, append them under a secondary section
    if (pageAnchors && pageAnchors.length) {
      try {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'sidebar-section-header p-2 mt-2';
        sectionHeader.innerHTML = '<strong>Page Tools</strong>';

        const pageList = document.createElement('ul');
        pageList.className = 'sidebar-nav nav flex-column p-2 small page-tools';

        pageAnchors.forEach(a => {
          try {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const link = document.createElement('a');
            link.className = 'nav-link';
            const ds = a.getAttribute('data-section');
            if (ds) link.setAttribute('data-section', ds);
            link.href = a.href;
            // Use original anchor text (trimmed)
            link.innerHTML = a.innerHTML || a.textContent.trim();
            if (a.classList.contains('active') || a.classList.contains('current')) link.classList.add('active');
            li.appendChild(link);
            pageList.appendChild(li);
          } catch (e) {
            // ignore individual anchor failures
          }
        });

        container.appendChild(sectionHeader);
        container.appendChild(pageList);
      } catch (e) {
        // noop
      }
    }

    container.setAttribute('data-menu-rendered','true');
  }

  function findContainer() {
    const appMenu = document.getElementById('app-menu');
    if (appMenu) return appMenu;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) return sidebar;
    return null;
  }

  document.addEventListener('DOMContentLoaded', function(){
    const c = findContainer();
    if (c && !c.getAttribute('data-menu-rendered')) {
      renderMenu(c);
    }
  });
})();
