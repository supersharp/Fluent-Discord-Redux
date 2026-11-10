(() => {
  const svg = document.querySelector('[class*="searchBar_AV6l5m"] [class*="icon_0PLWhS"] svg');
  if (!svg) return 'no svg';
  const matched = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      if (!rule.selectorText) continue;
      try {
        if (svg.matches(rule.selectorText)) {
          const display = rule.style.getPropertyValue('display');
          if (display || rule.style.length < 4) matched.push({ selector: rule.selectorText, display, css: rule.cssText.slice(0, 240) });
        }
      } catch {}
    }
  }
  return { cls: svg.getAttribute('class'), display: getComputedStyle(svg).display, matched: matched.slice(-20) };
})()
