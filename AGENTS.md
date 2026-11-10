# Agent Guide: Inspecting the Discord Desktop Client

This document describes how to inspect the **running Discord desktop client**
when maintaining the Fluent Discord Redux theme. It is written for coding
agents and maintainers who need to find current CSS module classes, diagnose a
broken surface, and verify a fix visually.

Discord ships obfuscated CSS-module class names (for example
`search_i16Ad0`, `contentBody_3Rvb29`). The hashes change between client
builds, and some CSS is injected at runtime rather than served as a stable
`.css` asset. Always inspect the client that is actually running on the
machine, not a cached web build.

---

## 1. Safety and scope

- The DevTools Protocol exposes the whole Discord renderer. Treat it as a
  privileged debugging session and keep the port on loopback.
- Inspect **classes, geometry and CSS** only. Do not read message content,
  tokens, cookies, `localStorage`, or account data.
- Close the debugger when finished by quitting Discord or restarting it
  normally. The port is only open for the process started by the launch script.
- Do not commit theme changes until the user has reviewed them (this repository
  currently expects an uncommitted working tree during review).

---

## 2. Prerequisites

- Discord Desktop installed under `%LOCALAPPDATA%\Discord\app-*`.
- Node.js 20+ (the scripts use the built-in `WebSocket`).
- PowerShell 5+.
- The theme installed for Equicord at:
  `%APPDATA%\Equicord\themes\Fluent-Discord-Redux-static.theme.css`
  (adjust if the user uses Vencord or BetterDiscord).
- Build tooling from the repository root:
  `node_modules/.bin/sass` (or `npm run build-static`).

---

## 3. Launch Discord with the DevTools Protocol

Use the bundled launcher:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/discord-debug/launch.ps1
```

The launcher:

1. Closes every Discord process and waits for the updater/launcher to release
   the single-instance lock.
2. Starts `Discord.exe --remote-debugging-port=9222`.
3. Verifies the flag is present on the process command line.
4. Prints the CDP target list once `http://127.0.0.1:9222/json/list` responds.

Manual fallback:

```powershell
Get-Process Discord -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 5
Start-Process "$env:LOCALAPPDATA\Discord\app-1.0.9267\Discord.exe" `
  -ArgumentList "--remote-debugging-port=9222"
```

Discord can silently drop the flag if another instance wins the single-instance
race, so check the main process command line if `/json/list` never responds.

The page target is the renderer:

```json
{
  "type": "page",
  "url": "https://discord.com/channels/@me",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/page/..."
}
```

There are also worker targets; ignore them for theming.

---

## 4. Inspect the live CSS and DOM

### Dump all applied CSS

```bash
node scripts/discord-debug/dump-css.mjs "$TEMP/discord-live.css"
```

This walks `document.styleSheets` (including runtime-injected CSS) and writes
one file. It is the authoritative class list for the running build. The file is
typically 3–4 MB.

> Lazy-loaded chunks only appear after their view has been opened. Visit Shop,
> Settings, the emoji picker, a guild channel and any popout you are changing,
> then dump again. A class that is missing from an early dump is not necessarily
> stale.

### Evaluate JavaScript in the renderer

```bash
node scripts/discord-debug/eval.mjs --expr "document.title"
node scripts/discord-debug/eval.mjs scripts/discord-debug/expr-search.js
node scripts/discord-debug/eval.mjs scripts/discord-debug/expr-dom-classes.js --out "$TEMP/dom-classes.json"
```

`eval.mjs` prints JSON. Long results can be written with `--out`.

Useful starting points:

- `expr-search.js` — current search bar structure and geometry.
- `expr-search-subtree.js` — the input/leading-icon tree.
- `expr-components.js` — channel, guild, panel, chatbox and titlebar landmarks.
- `expr-picker-bgs.js` — every non-transparent background in the emoji picker.
- `expr-folders.js` — guild folder SVG/fill information.
- `expr-dom-classes.js` — every class currently present in the DOM.

### Find an element without guessing classes

Prefer stable attributes over hashes:

```js
document.querySelector('[data-list-item-id^="channels___"]')
document.querySelector('[data-list-item-id="guildsnav___home"]')
document.querySelector('[aria-label="Add Emoji"]')
document.querySelector('[aria-label="User Settings"]')
document.querySelector('a[href="/shop"]')
```

For text-only buttons, filter elements by `textContent` or `aria-label`.
Click through the DOM to reach a view:

```js
document.querySelector('[data-list-item-id="guildsnav___home"]').click();
document.querySelector('a[href="/shop"]').click();
document.querySelector('[aria-label="Add Emoji"]').click();
```

`HTMLElement.click()` works for most Discord controls. Contenteditable search
boxes may need `.focus()`:

```js
document.querySelector('.editor_uNafB1').focus();
```

### Inspect computed styles and geometry

```js
const el = document.querySelector('[class*="searchBar_"]');
const cs = getComputedStyle(el);
const r = el.getBoundingClientRect();
({ cls: el.getAttribute('class'), rect: [r.x, r.y, r.width, r.height],
   bg: cs.backgroundColor, border: cs.border, display: cs.display });
```

Use this to verify:

- A panel is actually using a translucent background plus `backdrop-filter`.
- A search input fills its wrapper instead of sitting inset inside the border.
- An icon SVG is present but hidden (`display: none`).
- A folder icon still uses `currentColor` and which colour that resolves to.

### Capture a screenshot

```powershell
powershell -ExecutionPolicy Bypass -File scripts/discord-debug/capture.ps1
```

The script brings the Discord window to the front, captures it with
`CopyFromScreen`, then returns it to normal. This is more reliable than
`PrintWindow`, which can produce white/torn rectangles for Electron GPU
surfaces.

If the OS window is hidden (for example after an accidental title-bar close),
capture the renderer directly:

```bash
node scripts/discord-debug/screenshot.mjs "$TEMP/discord-page.png"
```

Do not use a generic `document.querySelector('[aria-label="Close"]')` to close
a settings modal: it can match the window's title-bar close button and hide the
app. Scope it to the modal or press Escape through the renderer.

Read the resulting PNG with the image tool and compare against the requested
design. Re-capture after each build/reload.

---

## 5. Edit, build, install, reload

From the repository root:

```bash
./node_modules/.bin/sass src/fluent.scss:dist/Fluent-Discord-Redux-static.theme.css \
  --no-charset --no-source-map
cp dist/Fluent-Discord-Redux-static.theme.css \
  "$APPDATA/Equicord/themes/Fluent-Discord-Redux-static.theme.css"
```

Reload the renderer so the theme is re-injected:

```js
location.reload();
```

Wait ~8 seconds, then open the view again and capture. Equicord may or may not
hot-reload a theme file; a renderer reload is the reliable path.

Useful build checks:

```bash
./node_modules/.bin/sass src/fluent.scss:/dev/null --no-charset --no-source-map
```

---

## 6. Updating classes

Discord class names are `base_hash` (current) or `base__hash` (older builds).
The base name is the stable semantic part; the hash is build-specific.

1. Dump live CSS and the DOM classes for the views you are touching.
2. For every old class in the SCSS, find the current class with the same base
   name. Prefer the class in the same module (the classes that share a suffix
   and appear together in one rule/component).
3. Update the exact hash. Add a partial-match fallback when the selector is a
   long-lived, stable surface, for example:
   `:is(.searchBar_uNafB1, [class*="searchBar_"])`.
4. Do not invent a class or copy a hash from a downloaded `discord.com` asset
   without checking it exists in the live renderer. The desktop build and the
   public web build can differ.
5. Rebuild and verify visually. A hash can exist in CSS but belong to another
   component; geometry and a screenshot catch those mistakes.

### Removing stale classes

`scripts/discord-debug/remove-stale.py` removes selector parts that contain a
class not present in `discord-live.css` or the dumped DOM class list. Review the
result carefully:

- Run the dry run first (no `--apply`) and inspect the per-file counts.
- Prefer running one file at a time with `--only src/.../file.scss` for large
  settings or modal files.
- A rule can be dead because its top-level class is stale, but still contain
  useful nested rules for a current class. In that case, remap the top-level
  selector instead of deleting the whole block.
- The DOM class list must include the view you are removing rules from.
  Otherwise a live class can be misclassified as stale.

After the cleanup, `remove-stale.py` should report `stale tokens 0`.

---

## 7. Patterns that repeatedly break

### Search inputs

Discord's current text-input component is:

```
container_VhFsFg
└─ wrapper_UcGqzv container_0PLWhS hasLeading_0PLWhS
   ├─ icon_0PLWhS              (leading magnifier)
   └─ input_0PLWhS
```

Theme the **wrapper** with the border/background, force the input to
`width/height: 100%`, add `padding-left` for the icon, and force
`.icon_0PLWhS svg { display: block }`. Styling only the input makes the text
field smaller than the visible box and hides the icon.

For the channel-header search, Discord uses `search_i16Ad0` /
`searchBar_i16Ad0` / `editor_uNafB1`. The collapsed state must be detected on
the search wrapper itself:

```scss
&[class*="focused_"],
&[class*="open_"],
&:has([class*="focused_"]),
&:has([class*="open_"]),
&:has([class*="popoutOpen_"]) { width: 232px !important; }
```

The `::before` magnifier belongs on the wrapper when it is neither open nor
focused. Do not use `:not([class*="search_"])` on the same wrapper; it excludes
the element itself.

### Emoji / GIF / sticker picker

The picker shell is `contentWrapper_58b0l2` (and
`#emoji-picker-tab-panel`). Discord paints a near-opaque `#202020` gradient
there. Set a translucent Mica layer plus blur:

```scss
background: rgba(32, 32, 32, 0.55) !important;
background-image: none !important;
backdrop-filter: blur(24px) saturate(140%);
```

Then remove the extra dark surfaces inside it:

- `categoryList_-sZhZn` — sidebar.
- `inspector_-sZhZn` / `inspector_1bDrGE` — footer preview.
- The search wrapper should inherit the common search styling rather than its
  own opaque fill.

### Guild folders

Folder SVGs use `fill="currentColor"` and inherit Discord blurple. Set the
accent on the folder button (not only the old `folderIcon_` class):

```scss
.folderButton_RTMSuZ,
.folderIcon_RTMSuZ {
    color: $AccentFillColorDefault !important;
    svg path { fill: currentColor !important; }
}
```

### Settings (2026 redesign)

User Settings is a modal and uses:

```
modalContentInner__F9ieB
├─ sidebar_cR4ic2          (nav: item_8qMUr2, active_8qMUr2)
└─ content_3Rvb29
   ├─ contentHeader_3Rvb29
   └─ contentBody_3Rvb29
      └─ panel_nNq2Vb     (container_Gl6U0S cards, baseControlItem_FiiQ6I rows)
```

Server and channel settings still use the full-screen legacy shell:
`standardSidebarView_jnk11m`, `sidebarRegion_jnk11m`,
`contentRegion_jnk11m`, `contentColumnScrollable_jnk11m`, and
`item_6zZYhF` nav items. Style both shells separately; the user-settings
modal classes will not match server settings.

### Profile / account panel

Discord renders a profile-theme banner as
`container_AFi54G fitInAccount_AFi54G` inside `panels_pog62O`. Hide
`[class*="fitInAccount_"]` so the coloured gradient does not paint over the
acrylic account panel.

---

## 8. Cleanup

Before finishing:

```powershell
Get-Process Discord -ErrorAction SilentlyContinue | Stop-Process -Force
```

Remove any temporary profile or capture files. Do not leave the debug port open
longer than necessary.

Temporary artifacts used by the scripts:

- `%TEMP%\discord-live.css`
- `%TEMP%\discord-dom-classes*.json`
- `%TEMP%\discord-capture.png`

---

## 9. Tool inventory

| Path | Purpose |
| --- | --- |
| `scripts/discord-debug/launch.ps1` | Restart Discord with CDP on `:9222`. |
| `scripts/discord-debug/eval.mjs` | Evaluate a JS expression and print JSON. |
| `scripts/discord-debug/dump-css.mjs` | Save every applied CSS rule. |
| `scripts/discord-debug/capture.ps1` | Capture the Discord window. |
| `scripts/discord-debug/screenshot.mjs` | Capture the page through CDP when the window is hidden. |
| `scripts/discord-debug/stale-report.py` | Report selectors using dead classes. |
| `scripts/discord-debug/remove-stale.py` | Remove dead selector parts (`--apply`). |
| `scripts/discord-debug/expr-*.js` | Example DOM/CSS queries. |
