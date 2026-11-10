(() => {
  const emoji = document.querySelector('[aria-label="Add Emoji"]');
  if (emoji) emoji.click();
  const guild = document.querySelector('[data-list-item-id="guildsnav___369878353903091712"]');
  if (!guild) return 'no guild';
  guild.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 30, clientY: 200 }));
  return 'contextmenu';
})()
