(() => {
  const candidates = [...document.querySelectorAll('a,div,button')].filter((el) => {
    const text = (el.textContent || '').trim();
    return text === 'Shop' || el.getAttribute('aria-label') === 'Shop';
  });
  return candidates.slice(0, 8).map((el) => ({
    tag: el.tagName,
    cls: el.getAttribute('class'),
    href: el.getAttribute('href'),
    label: el.getAttribute('aria-label'),
    text: el.textContent.trim().slice(0, 30),
  }));
})()
