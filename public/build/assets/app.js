(() => {
  function icon(label, href) {
    if (href.includes('teacher-evidence')) return '📂';
    if (href.includes('teachers')) return '👥';
    if (href.includes('evidence')) return '✅';
    if (href.includes('dashboard')) return '🏠';
    if (label.includes('الرئيسية')) return '🏠';
    if (label.includes('المعلمات')) return '👥';
    if (label.includes('ملفات')) return '📂';
    if (label.includes('معايير')) return '✅';
    return '•';
  }

  function isActive(href) {
    const current = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    const path = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (path === '/dashboard') return current === '/dashboard' || current === '/';
    return current === path || current.startsWith(path + '/');
  }

  function mountBottomTabs() {
    if (document.getElementById('react-bottom-tabs-root')) return;

    const links = Array.from(document.querySelectorAll('.sidebar .nav a')).slice(0, 4);
    if (!links.length) return;

    const style = document.createElement('style');
    style.textContent = `
      .react-bottom-tabs{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;width:min(560px,calc(100% - 24px));min-height:72px;padding:8px;display:grid;grid-template-columns:repeat(var(--tabs-count,4),minmax(0,1fr));gap:6px;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.14);border-radius:26px;box-shadow:0 18px 45px rgba(15,23,42,.24);backdrop-filter:blur(18px);direction:rtl}
      .react-bottom-tab{min-width:0;display:grid;place-items:center;gap:4px;padding:8px 6px;border-radius:20px;color:#cbd5e1;text-decoration:none;font-family:Tahoma,Arial,sans-serif;font-size:11px;line-height:1.2;transition:.18s ease}
      .react-bottom-tab.active,.react-bottom-tab:hover{background:#fff;color:#0f172a;transform:translateY(-2px)}
      .react-bottom-tab-icon{font-size:21px;line-height:1}.react-bottom-tab-label{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-weight:800}
      body{padding-bottom:94px!important}@media(min-width:981px){.react-bottom-tabs{display:none}body{padding-bottom:0!important}}
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'react-bottom-tabs-root';
    root.style.setProperty('--tabs-count', String(links.length));

    const nav = document.createElement('nav');
    nav.className = 'react-bottom-tabs';
    nav.setAttribute('aria-label', 'تبويب التنقل السفلي');

    links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'react-bottom-tab' + (isActive(link.href) ? ' active' : '');
      const label = link.textContent.trim();
      a.innerHTML = `<span class="react-bottom-tab-icon">${icon(label, link.href)}</span><span class="react-bottom-tab-label">${label}</span>`;
      nav.appendChild(a);
    });

    root.appendChild(nav);
    document.body.appendChild(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBottomTabs);
  } else {
    mountBottomTabs();
  }
})();
