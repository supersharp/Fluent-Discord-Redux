(() => {
  const root = document.querySelector('.contentWrapper_58b0l2') || document.querySelector('[id^="emoji-picker"]');
  if (!root) return 'no picker';
  const rows = [];
  const walk = (el, depth) => {
    if (depth > 8) return;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const bg = cs.backgroundColor;
    const bgImg = cs.backgroundImage;
    const hasBg = (bg && bg !== 'rgba(0, 0, 0, 0)') || (bgImg && bgImg !== 'none');
    if (hasBg && r.width > 4 && r.height > 4) {
      rows.push({
        depth,
        tag: el.tagName,
        cls: el.getAttribute('class'),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        bg,
        bgImg: bgImg === 'none' ? '' : bgImg.slice(0, 100),
        backdrop: cs.backdropFilter,
      });
    }
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(root, 0);
  return rows;
})()
