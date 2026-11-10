(() => {
  const bar = document.querySelector('[class*="searchBar_AV6l5m"]') || document.querySelector('[class*="searchBar_"]');
  if (!bar) return 'no search bar';
  const info = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.getAttribute('class'),
      label: el.getAttribute('aria-label'),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      border: cs.border,
      display: cs.display,
      opacity: cs.opacity,
      color: cs.color,
    };
  };
  const rows = [];
  const walk = (el, depth) => {
    if (depth > 3) return;
    rows.push({ depth, ...info(el) });
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(bar, 0);
  return rows;
})()
