(() => {
  const items = [...document.querySelectorAll('[data-list-item-id^="guildsnav___"]')];
  const rows = [];
  for (const item of items) {
    const svg = item.querySelector('svg');
    const img = item.querySelector('img');
    const any = svg || img;
    if (!any) continue;
    const r = item.getBoundingClientRect();
    rows.push({
      id: item.getAttribute('data-list-item-id'),
      cls: item.getAttribute('class'),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      svgCls: svg ? svg.getAttribute('class') : null,
      svgHtml: svg ? svg.outerHTML.slice(0, 400) : null,
      imgCls: img ? img.getAttribute('class') : null,
      imgSrc: img ? img.getAttribute('src') : null,
      childCls: [...item.querySelectorAll('*')].slice(0, 5).map(e => e.getAttribute('class')),
    });
  }
  return rows;
})()
