(() => {
  const root = document.querySelector('[class*="container_dvN-MP"]') ||
               document.querySelector('[class*="modalContent"]') ||
               document.querySelector('[role="dialog"]');
  if (!root) return 'no settings root';
  const rows = [];
  const walk = (el, depth) => {
    if (depth > 7) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const cs = getComputedStyle(el);
    rows.push({
      depth,
      tag: el.tagName,
      cls: el.getAttribute('class'),
      role: el.getAttribute('role'),
      label: el.getAttribute('aria-label'),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      display: cs.display,
      bg: cs.backgroundColor,
      border: cs.border,
      radius: cs.borderRadius,
      padding: cs.padding,
    });
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(root, 0);
  return rows;
})()
