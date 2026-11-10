(() => {
  const classes = new Set();
  for (const el of document.querySelectorAll('*')) {
    const cls = el.getAttribute('class');
    if (!cls) continue;
    for (const name of cls.split(/\s+/)) if (name) classes.add(name);
  }
  return [...classes].sort();
})()
