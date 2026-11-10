(() => {
  const svg = document.querySelector('[class*="searchBar_AV6l5m"] [class*="icon_0PLWhS"] svg');
  if (!svg) return 'no svg';
  const matched = [];
  const walk = (rules, context) => {
    for (const rule of rules) {
      if (rule.cssRules) {
        walk(rule.cssRules, context + (rule.conditionText ? ` @${rule.conditionText}` : ''));
        continue;
      }
      if (!rule.selectorText) continue;
      let hit = false;
      try { hit = svg.matches(rule.selectorText); } catch {}
      if (!hit) continue;
      const display = rule.style.getPropertyValue('display');
      const visibility = rule.style.getPropertyValue('visibility');
      const opacity = rule.style.getPropertyValue('opacity');
      if (display || visibility || opacity) {
        matched.push({ context, selector: rule.selectorText, display, visibility, opacity, css: rule.cssText.slice(0, 240) });
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, ''); } catch {}
  }
  return { display: getComputedStyle(svg).display, matched: matched.slice(-30) };
})()
