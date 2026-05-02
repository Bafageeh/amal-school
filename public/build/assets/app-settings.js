(() => {
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  function active(href) {
    const current = (location.pathname || '/').replace(/\/$/, '') || '/';
    const path = new URL(href, location.origin).pathname.replace(/\/$/, '') || '/';
    if (path === '/dashboard') return current === '/' || current === '/dashboard';
    return current === path || current.startsWith(path + '/');
  }

  function tabIcon(label, href) {
    if (href.includes('/settings') || label.includes('الإعدادات')) return '⚙️';
    if (href.includes('/evidence') || label.includes('معايير')) return '✅';
    if (href.includes('/dashboard') || label.includes('الرئيسية')) return '🏠';
    return '•';
  }

  function normalizeSidebar() {
    const nav = document.querySelector('.sidebar .nav');
    if (!nav) return [];

    const allLinks = Array.from(nav.querySelectorAll('a'));
    const teacherLinks = allLinks.filter((link) => {
      const href = link.getAttribute('href') || '';
      const label = link.textContent.trim();
      return href.includes('/teachers') || href.includes('/teacher-evidence') || label.includes('المعلمات') || label.includes('متابعة الملفات');
    });

    if (teacherLinks.length) {
      const hasSettings = allLinks.some((link) => (link.getAttribute('href') || '').includes('/settings') || link.textContent.includes('الإعدادات'));
      if (!hasSettings) {
        const settings = document.createElement('a');
        settings.href = '/settings';
        settings.textContent = 'الإعدادات';
        teacherLinks[0].before(settings);
      }
      teacherLinks.forEach((link) => link.remove());
    }

    return Array.from(nav.querySelectorAll('a')).filter((link) => {
      const href = link.getAttribute('href') || '';
      return href && !href.includes('/teachers') && !href.includes('/teacher-evidence');
    }).slice(0, 4);
  }

  function mountTabs() {
    const old = document.getElementById('react-bottom-tabs-root');
    if (old) old.remove();

    const links = normalizeSidebar();
    if (!links.length) return;

    if (!document.getElementById('react-bottom-tabs-style')) {
      const style = document.createElement('style');
      style.id = 'react-bottom-tabs-style';
      style.textContent = `.react-bottom-tabs{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;width:min(560px,calc(100% - 24px));min-height:72px;padding:8px;display:grid;grid-template-columns:repeat(var(--tabs-count,3),minmax(0,1fr));gap:6px;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.14);border-radius:26px;box-shadow:0 18px 45px rgba(15,23,42,.24);backdrop-filter:blur(18px);direction:rtl}.react-bottom-tab{min-width:0;display:grid;place-items:center;gap:4px;padding:8px 6px;border-radius:20px;color:#cbd5e1;text-decoration:none;font-family:Tahoma,Arial,sans-serif;font-size:11px;line-height:1.2}.react-bottom-tab.active,.react-bottom-tab:hover{background:#fff;color:#0f172a}.react-bottom-tab-icon{font-size:21px;line-height:1}.react-bottom-tab-label{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-weight:800}body{padding-bottom:94px!important}@media(min-width:981px){.react-bottom-tabs{display:none}body{padding-bottom:0!important}}`;
      document.head.appendChild(style);
    }

    const root = document.createElement('div');
    root.id = 'react-bottom-tabs-root';
    root.style.setProperty('--tabs-count', String(links.length));

    const bottom = document.createElement('nav');
    bottom.className = 'react-bottom-tabs';

    links.forEach((link) => {
      const label = link.textContent.trim();
      const item = document.createElement('a');
      item.href = link.href;
      item.className = 'react-bottom-tab' + (active(link.href) ? ' active' : '');
      item.innerHTML = `<span class="react-bottom-tab-icon">${tabIcon(label, link.href)}</span><span class="react-bottom-tab-label">${label}</span>`;
      bottom.appendChild(item);
    });

    root.appendChild(bottom);
    document.body.appendChild(root);
  }

  ready(mountTabs);
})();
