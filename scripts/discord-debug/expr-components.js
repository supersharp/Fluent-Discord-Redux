(() => {
  const info = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.getAttribute('class'),
      role: el.getAttribute('role'),
      label: el.getAttribute('aria-label'),
      listItemId: el.getAttribute('data-list-item-id'),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    };
  };
  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => [...document.querySelectorAll(selector)].slice(0, 5);

  const channel = qa('[data-list-item-id^="channels___"]')[0];
  const guild = qa('[data-list-item-id^="guildsnav___"]')[2];
  const panel = q('[class*="panels_"]') || q('[class*="userPanel"]');
  const input = q('[class*="channelTextArea"]') || q('[class*="scrollableContainer"]');

  return {
    href: location.href,
    channelItem: info(channel),
    channelItems: qa('[data-list-item-id^="channels___"]').map(info),
    guildItem: info(guild),
    guildItems: qa('[data-list-item-id^="guildsnav___"]').map(info),
    panel: info(panel),
    panelChildren: panel ? [...panel.children].map(info) : [],
    chatInput: info(input),
    chatInputChildren: input ? [...input.querySelectorAll('*')].slice(0, 8).map(info) : [],
    titlebar: info(q('[data-window-chrome]')),
    titlebarChildren: q('[data-window-chrome]') ? [...q('[data-window-chrome]').children].map(info) : [],
    memberList: info(q('[class*="members_"]')),
  };
})()
