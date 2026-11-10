(() => {
  const root = document.querySelector('[class*="container_dvN-MP"]') ||
               document.querySelector('[class*="modalContent"]') ||
               document.querySelector('[role="dialog"]');
  if (!root) return 'no settings root';
  const info = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: el.getAttribute('class'),
      type: el.getAttribute('type'),
      role: el.getAttribute('role'),
      label: el.getAttribute('aria-label'),
      text: (el.textContent || '').trim().slice(0, 40),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      border: cs.border,
    };
  };
  const panel = root.querySelector('[class*="panel_nNq2Vb"]') || root;
  const rows = [];
  const walk = (el, depth) => {
    if (depth > 6) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    rows.push({ depth, ...info(el) });
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(panel, 0);

  const controls = [...root.querySelectorAll('input,button,select,textarea,[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="button"]')]
    .slice(0, 80)
    .map(info);

  return { panel: rows.slice(0, 120), controls };
})()
