(() => {
  const info = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.getAttribute('class'),
      label: el.getAttribute('aria-label'),
      placeholder: el.getAttribute('placeholder'),
      role: el.getAttribute('role'),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      border: cs.border,
      display: cs.display,
      opacity: cs.opacity,
    };
  };
  const results = [];
  for (const el of document.querySelectorAll('[class*="search"], [aria-label*="Search"], [placeholder*="Search"], [placeholder*="Find"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const ancestors = [];
    for (let p = el.parentElement, i = 0; p && i < 4; i++, p = p.parentElement) ancestors.push(info(p));
    results.push({ self: info(el), ancestors });
    if (results.length >= 20) break;
  }
  return { href: location.href, count: results.length, results };
})()
