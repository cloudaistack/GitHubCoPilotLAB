/* ============================================
   GitHub Copilot Mastery Course - Application JS
   ============================================ */

(function() {
  'use strict';

  // ---- State ----
  const state = {
    progress: JSON.parse(localStorage.getItem('copilot-course-progress') || '{}'),
    completedTopics: JSON.parse(localStorage.getItem('copilot-course-topics') || '{}'),
    expandedModules: new Set(),
    sidebarOpen: false
  };

  // ---- DOM Ready ----
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupHeader();
    setupSidebar();
    setupModuleCards();
    setupCodeCopy();
    setupCodeTabs();
    setupSearch();
    setupScrollAnimations();
    setupBackToTop();
    setupCheckboxes();
    updateProgressUI();
  }

  // ---- Header ----
  function setupHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 20);
      lastScroll = y;
      updateSidebarActive();
    }, { passive: true });
  }

  // ---- Sidebar ----
  function setupSidebar() {
    const toggle = document.querySelector('.header__menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        state.sidebarOpen = !state.sidebarOpen;
        sidebar.classList.toggle('open', state.sidebarOpen);
        toggle.innerHTML = state.sidebarOpen ? '✕' : '☰';
      });
    }

    // Sidebar nav clicks
    document.querySelectorAll('.sidebar__item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(item.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          if (state.sidebarOpen && sidebar) {
            state.sidebarOpen = false;
            sidebar.classList.remove('open');
            if (toggle) toggle.innerHTML = '☰';
          }
        }
      });
    });
  }

  function updateSidebarActive() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + 150;
    let currentId = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) currentId = sec.id;
    });
    document.querySelectorAll('.sidebar__item[data-section]').forEach(item => {
      item.classList.toggle('active', item.dataset.section === currentId);
    });
  }

  // ---- Module Cards ----
  function setupModuleCards() {
    document.querySelectorAll('.module-card__header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.module-card');
        card.classList.toggle('expanded');
      });
    });
  }

  // ---- Code Copy ----
  function setupCodeCopy() {
    document.querySelectorAll('.code-block__copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const block = btn.closest('.code-block');
        const code = block.querySelector('code') || block.querySelector('pre');
        if (!code) return;
        const text = code.textContent;
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = '✓ Copied';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '⧉ Copy';
          }, 2000);
        });
      });
    });
  }

  // ---- Code Tabs ----
  function setupCodeTabs() {
    document.querySelectorAll('.code-tabs').forEach(tabGroup => {
      const tabs = tabGroup.querySelectorAll('.code-tabs__tab');
      const panels = tabGroup.querySelectorAll('.code-tabs__panel');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const target = tabGroup.querySelector(`.code-tabs__panel[data-lang="${tab.dataset.lang}"]`);
          if (target) target.classList.add('active');
        });
      });
    });
  }

  // ---- Search ----
  function setupSearch() {
    const input = document.querySelector('.header__search-input');
    const results = document.querySelector('.search-results');
    if (!input || !results) return;

    const searchableItems = [];
    document.querySelectorAll('.module-card').forEach((card, i) => {
      const title = card.querySelector('.module-card__title');
      const desc = card.querySelector('.module-card__description');
      if (title) {
        searchableItems.push({
          title: title.textContent.trim(),
          context: `Module ${i + 1}`,
          section: card.closest('section')?.id || '',
          element: card
        });
      }
    });

    document.querySelectorAll('.lab-card').forEach(card => {
      const title = card.querySelector('.lab-card__title');
      if (title) {
        searchableItems.push({
          title: title.textContent.trim(),
          context: 'Lab Exercise',
          section: card.closest('section')?.id || '',
          element: card
        });
      }
    });

    document.querySelectorAll('.topics-list__item').forEach(item => {
      const label = item.querySelector('label');
      if (label) {
        searchableItems.push({
          title: label.textContent.trim(),
          context: 'Topic',
          section: item.closest('section')?.id || '',
          element: item
        });
      }
    });

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => performSearch(input.value, results, searchableItems), 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) results.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header__search')) results.classList.remove('active');
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
      }
      if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      }
    });
  }

  function performSearch(query, container, items) {
    query = query.trim().toLowerCase();
    container.innerHTML = '';
    if (query.length < 2) {
      container.classList.remove('active');
      return;
    }

    const matches = items.filter(item =>
      item.title.toLowerCase().includes(query)
    ).slice(0, 8);

    if (matches.length === 0) {
      container.innerHTML = '<div class="search-result-item"><div class="search-result-item__title" style="color:var(--text-tertiary)">No results found</div></div>';
    } else {
      matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
          <div class="search-result-item__title">${highlight(match.title, query)}</div>
          <div class="search-result-item__context">${match.context}</div>
        `;
        div.addEventListener('click', () => {
          if (match.section) {
            const sec = document.getElementById(match.section);
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
          } else {
            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          container.classList.remove('active');
        });
        container.appendChild(div);
      });
    }
    container.classList.add('active');
  }

  function highlight(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.substring(0, idx) +
      '<span style="color:var(--accent-blue);font-weight:700">' +
      text.substring(idx, idx + query.length) +
      '</span>' + text.substring(idx + query.length);
  }

  // ---- Scroll Animations ----
  function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll, .stagger-children').forEach(el => {
      observer.observe(el);
    });
  }

  // ---- Back to Top ----
  function setupBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Checkboxes / Progress ----
  function setupCheckboxes() {
    document.querySelectorAll('.topics-list__item input[type="checkbox"]').forEach(cb => {
      const id = cb.id;
      if (id && state.completedTopics[id]) cb.checked = true;

      cb.addEventListener('change', () => {
        if (id) {
          state.completedTopics[id] = cb.checked;
          if (!cb.checked) delete state.completedTopics[id];
          localStorage.setItem('copilot-course-topics', JSON.stringify(state.completedTopics));
          updateProgressUI();
        }
      });
    });
  }

  function updateProgressUI() {
    const allCheckboxes = document.querySelectorAll('.topics-list__item input[type="checkbox"]');
    const total = allCheckboxes.length;
    const completed = Object.keys(state.completedTopics).filter(k => state.completedTopics[k]).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const fill = document.querySelector('.sidebar__progress-fill');
    const label = document.querySelector('.sidebar__progress-pct');
    const headerBar = document.querySelector('.header__progress');
    const completedLabel = document.querySelector('.sidebar__progress-completed');

    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
    if (completedLabel) completedLabel.textContent = completed + ' / ' + total;
    if (headerBar) headerBar.style.width = pct + '%';

    // Update sidebar module items
    document.querySelectorAll('.module-card').forEach((card, index) => {
      const checkboxes = card.querySelectorAll('input[type="checkbox"]');
      const checked = Array.from(checkboxes).filter(c => c.checked).length;
      const sidebarItem = document.querySelector(`.sidebar__item[data-section="module-${index + 1}"]`);
      if (sidebarItem && checkboxes.length > 0 && checked === checkboxes.length) {
        sidebarItem.classList.add('completed');
      } else if (sidebarItem) {
        sidebarItem.classList.remove('completed');
      }
    });
  }

  // ---- Toast Notification ----
  window.showToast = function(message, type) {
    type = type || 'info';
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> ${message}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

})();
