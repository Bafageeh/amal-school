document.addEventListener('click', function(event) {
  const link = event.target.closest('[data-school-back]');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
  try {
    const previous = new URL(document.referrer);
    const current = new URL(window.location.href);
    const path = previous.pathname;
    if (previous.origin !== current.origin || path === current.pathname) return;
    if (path === '/login' || path === '/logout' || path === '/set-password' || path.startsWith('/api/')) return;
    event.preventDefault();
    window.location.assign(previous.href);
  } catch (e) {
    // No suitable previous page; follow the safe fallback link.
  }
});
