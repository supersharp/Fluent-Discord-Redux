# WinUI 3 Dark Emulation Plan — Fluent Discord Redux

Status: active · Target: Discord Desktop 1.0.9267 / Chromium 152 · Theme: 0.0.30

This plan is the source of truth for bringing the theme in line with the
**Windows 11 / WinUI 3 Dark** visual language. It covers every major surface in
the Discord desktop client, the design tokens that drive them, and the
verification loop used to validate each change against the running client and
the WinUI Gallery reference app.

The WinUI Gallery app (`Microsoft.WinUI3ControlsGallery`) is installed at
`C:\Program Files\WindowsApps\Microsoft.WinUI3ControlsGallery_3.0.4.0_x64__8wekyb3d8bbwe`
and is used as the visual reference for controls, spacing, and navigation.

---

## 1. Goals

1. Make every Discord surface read as a Windows 11 WinUI 3 dark app:
   Mica/acrylic layers, 1px hairline strokes, 4/8px radii, Segoe UI Variable,
   and the single leading accent indicator used by `NavigationView`.
2. Remove the remaining Discord-native grey/black opaque surfaces and
   inconsistent tab/selection indicators.
3. Keep class selectors resilient: exact current class plus a narrow
   `[class*="…"]` fallback where it will not over-match.
4. Verify every change in the live client with the CDP tooling in
   `scripts/discord-debug/` and a screenshot.
5. Leave the repository uncommitted until the user has reviewed each surface.

## 2. Non-goals

- Light theme (the theme is dark-only by design).
- Reimplementing Discord's layout. Theme the existing DOM; do not move
  controls or invent navigation.
- Changing user profile themes, banners, or avatars. Those are user content.
- Forcing every Discord dialog into a native WinUI window. Discord is a web
  app; "WinUI 3" here means the visual language, not native controls.

---

## 3. WinUI 3 dark reference

### 3.1 Reference screens

Captured from WinUI Gallery 3.0.4:

- Home: `%TEMP%\winui-gallery.png`
- Basic input: `%TEMP%\winui-basic-input.png`
- Navigation: `%TEMP%\winui-navigation.png`

Key observations:

- Window background is Mica-like; content is not a flat grey rectangle.
- Cards use a translucent `CardBackgroundFillColorDefault` fill, a **light**
  1px hairline (white alpha, not black), 8px radius, and 16px padding.
- Navigation uses a transparent pane; the selected item has a rounded
  background and a **single leading accent indicator**.
- Tabs/segmented controls use a side indicator, not a second underline.
- Default dark accent is the light WinUI accent (`#60CDFF` family). The theme
  keeps the user-configurable Windows accent and derives lighter variants from
  it; this is intentional, matching Windows personalisation.
- Body text 14/20, strong 14/20 semibold, captions 12/16, subtitles 20/28,
  titles 28/36. `Segoe UI Variable` is the display/body face.

### 3.2 Token target

| Token | WinUI 3 dark intent | Theme value | Status |
| --- | --- | --- | --- |
| `CardBackgroundFillColorDefault` | 5% white | `rgba(#FFF, 5.12%)` | OK |
| `CardStrokeColorDefault` | ~6% white hairline | `rgba(#FFF, 6.98%)` | Fixed this pass |
| `ControlFillColorDefault` | 6% white | `rgba(#FFF, 6.05%)` | OK |
| `ControlStrokeColorDefault` | 6–7% white | `rgba(#FFF, 6.98%)` | OK |
| `TextFillColorSecondary` | ~77% white | `rgba(#FFF, 78.6%)` | OK |
| `DividerStrokeColorDefault` | ~8% white | `rgba(#FFF, 8.37%)` | OK |
| `LayerFillColorDefault` | 30% `#3A3A3A` | same | OK |
| `LayerOnMicaBaseAltFillColor` | 45% `#3A3A3A` | same | OK |
| Mica surface | translucent + blur | `rgba(32,32,32,0.55)` + 24px blur | Ad-hoc per surface |
| Accent | Windows accent / WinUI light blue | HSL from user options | OK |
| Radii | 4 controls, 8 flyouts/cards | 4/8 | Mostly OK |
| Type ramp | 12/14/20/28/40 | 12/14/20/28/40 | OK |
| Spacing | 4/8/12/16/24/32 | used across partials | Audit per surface |

**Action:** consolidate Mica/acrylic surface values into shared variables so
every popout uses the same tint and blur instead of repeating
`rgba(32,32,32,0.55)`.

---

## 4. Surface audit matrix

Legend: **Done** = rebuilt and visually checked; **Fix** = known issue;
**Audit** = needs a pass; **N/A** = user content.

| Surface | Current state | WinUI target | Next action |
| --- | --- | --- | --- |
| App shell / titlebar | Transparent, Segoe UI, custom caption buttons | Mica shell, 32px titlebar, caption controls | Audit focus/active states |
| Guild rail | Icon pills, accent selection, folder icons accent blue | `NavigationView` rail, rounded selection | Audit unread pills and folder hover |
| Channel sidebar | Transparent, category rows, side unread bars | Navigation list, subtle hover, side selection | Audit category chevrons and voice rows |
| Chat header | Transparent, 49px | Mica header, breadcrumb/typography | Audit search expanded state |
| Message list | Transparent, hover toolbar | List surface, card-less, subtle hover | Audit embeds, code blocks, reactions |
| Composer | Filled control, focus underline | WinUI TextBox, 4px radius, accent focus | Audit attachments/buttons |
| Member / activity rail | Mica cards after fix | Mica cards, light hairline | Done |
| User panel | Mica blur, profile banner hidden | Mica panel, 4px controls | Audit voice status |
| Inbox | Mica popout after rebuild | Mica, side tabs | Recheck tab selection |
| Context menus | Mica menu, Fluent icons | `MenuFlyout`, 8px, icons | Main channel/DM icons fixed; audit submenus |
| Tooltips | Compact Fluent tooltip | `ToolTip` | Audit delay/arrow |
| User Settings | Rebuilt modal: Mica, nav rail, cards | `ContentDialog` + NavigationView + cards | Audit every settings tab |
| Server Settings | Rebuilt full-screen legacy shell | Mica page + NavigationView | Audit every section |
| Channel Settings | Rebuilt via legacy shell | Mica page, cards, radios | Audit permissions/overwrites |
| Server Boost page | Existing custom cards | Mica + WinUI cards | Audit |
| Discover | Mica shell, transparent header, side tabs | Mica page, NavigationView + cards | Header/nav done; audit cards |
| Shop | Mica shell, themed search | Mica page, cards | Audit tab bar and cards |
| Quests | Existing custom cards | Mica page, cards | Audit progress rings |
| Emoji / GIF / Stickers | Mica popout, full-width search | Mica flyout, 8px | Audit category rail |
| Soundboard | Existing custom surface | Mica flyout | Audit |
| Voice / RTC | Native call layout preserved | WinUI controls where safe | Audit only |
| Modals (dialog) | Mica + 8px radius | ContentDialog | Audit buttons/close |
| Popouts (user/channel/role) | Mica surfaces | Flyout | Audit |
| Notifications / toasts | Existing Discord surface | InfoBar/toast | Audit |
| Loading / splash | Custom | WinUI progress | Audit |
| Scrollbars | Thin custom | WinUI scrollbar | Audit |
| BetterDiscord / Vencord UI | Custom | WinUI controls | Audit |

---

## 5. Component mapping

| Discord surface | WinUI 3 pattern | Implementation notes |
| --- | --- | --- |
| Guild/channel rails | `NavigationView` pane | Transparent pane, 4px item radius, 3×16 accent bar at leading edge, no bottom underline |
| Friends/Shop/Discover tabs | `NavigationView` / `Pivot` | Side accent only; remove `inset 0 -3px` shadows and full-width `::before` bars |
| Settings modal | `ContentDialog` + `NavigationView` | `modalContentInner__F9ieB` shell, `sidebar_cR4ic2`, cards `container_Gl6U0S` |
| Server/channel settings | `NavigationView` full page | `standardSidebarView_jnk11m`, `contentColumnScrollable_jnk11m` |
| Cards | `Card` / `SettingsCard` | `$CardBackgroundFillColorDefault`, `$CardStrokeColorDefault`, 8px |
| Inputs | `TextBox` / `PasswordBox` | Wrapper draws border; input fills it; 4px radius; focus bottom accent |
| Buttons | `Button` / `HyperlinkButton` | 4px, control fill, hairline, 32px |
| Toggles | `ToggleSwitch` | Accent track, 20×40, 4px radius |
| Radio/checkbox | `RadioButton` / `CheckBox` | Native accent-color; 20px |
| Menus | `MenuFlyout` | Mica, 8px, 16px Fluent icon per item |
| Tooltip | `ToolTip` | 4px, dark fill |
| Inbox | `InfoBar`/list | Mica shell, cards for message groups |
| Discover cards | `GridView` card | Mica card + light stroke |
| Activity rail | `ItemsRepeater` card | Mica cards, light stroke |

---

## 6. Phases and checklist

### Phase 0 — Tooling and reference (done)

- [x] CDP inspection scripts (`launch.ps1`, `eval.mjs`, `dump-css.mjs`,
      `capture.ps1`, `screenshot.mjs`).
- [x] Stale-class reporting/removal tooling.
- [x] WinUI Gallery reference screenshots (Home, Basic input, Navigation).
- [x] Agent guide `AGENTS.md`.

### Phase 1 — Shell and navigation (in progress)

- [x] Rebuild User Settings modal.
- [x] Rebuild Server Settings full-screen shell.
- [x] Rebuild Channel Settings shell and native radio accent.
- [x] Remove Friends/Shop/Discover double tab underline; use side accent.
- [x] Discover header transparent, separators removed.
- [x] Friends/Shop tabs use a single leading accent bar with label inset.
- [x] Shop wishlist heart centred in its 32px control.
- [ ] Audit guild rail, channel sidebar, chat header, member rail against
      WinUI NavigationView spacing.
- [ ] Audit titlebar focus/active states.

### Phase 2 — Surfaces and materials

- [x] Inbox popout Mica.
- [x] Emoji/GIF/sticker picker Mica + search.
- [x] Activity rail / Active Now cards to Mica cards.
- [x] Emoji/reaction category rail stops above the preview footer.
- [x] Unicode category shortcut is opaque and no longer overlaps category icons.
- [x] Discover header/nav Mica and separators removed.
- [x] Apps/Commands drawer uses a Mica shell, hairline border and card fills.
- [ ] Audit Shop, Quests, Discover cards for card fill/stroke/radius.
- [ ] Audit modals and popouts for consistent 8px radius and Mica tint.
- [ ] Consolidate Mica values into shared variables.

### Phase 3 — Controls

- [x] Search inputs: wrapper fill, full-height input, visible icon.
- [x] Native radio/checkbox accent.
- [ ] Audit all buttons/inputs/selects/toggles for WinUI 16/32/40px sizing.
- [x] Fix missing channel/DM context-menu icons.
- [x] Restore the composer attach-menu Schedule Message icon.
- [ ] Audit all context-menu submenus.
- [x] Audit guild-view font families (Segoe UI Variable Text/Display; no gg sans).
- [ ] Audit tooltips, progress rings, scrollbars.

### Phase 4 — Content surfaces

- [ ] Message list, embeds, code blocks, reactions.
- [ ] Composer/attachments.
- [ ] Voice panel and in-call controls (respect existing no-theme policy).
- [ ] Notifications/toasts/loading.

### Phase 5 — Verification and release

- [ ] Screenshot every surface at 100% and 125% scaling.
- [ ] Check light/dark class leaks (theme is dark-only).
- [ ] Run `remove-stale.py` (must report 0).
- [ ] Build static + auto, install, reload.
- [ ] User review; commit only after approval.

---

## 7. Verification workflow

1. Launch the client with CDP:
   `powershell -ExecutionPolicy Bypass -File scripts/discord-debug/launch.ps1`
2. Open the surface and dump live CSS/DOM for that view.
3. Inspect class names and computed backgrounds with `eval.mjs`.
4. Compare the screenshot to the WinUI Gallery reference:
   - Mica layer visible through cards?
   - One hairline, not a black border?
   - 8px card radius / 4px control radius?
   - Single leading accent bar on selected navigation items?
   - 14/20 body, 12/16 captions?
5. Build and install:
   `./node_modules/.bin/sass src/fluent.scss:dist/... && cp ...`
6. Reload, capture, repeat.
7. Re-dump CSS/DOM before stale removal.

### Context-menu icon audit procedure

For each menu:

```js
[...document.querySelectorAll('[role=menuitem]')].map(e => {
  const p = getComputedStyle(e, '::before');
  return { id: e.id, text: e.textContent.trim(), content: p.content, width: p.width };
});
```

Any item with `content: none` and no background image needs a Fluent glyph.
Cover: channel, DM/group DM, guild, folder, member, message, settings, roles,
apps, notification settings, and all submenus.

---

## 8. Acceptance criteria

- Every selected navigation/tab item has exactly **one** accent indicator,
  on the leading edge.
- Every popout/dialog uses a translucent Mica surface with a light hairline.
- No flat opaque `#202020` / `#252525` rectangles remain in themed surfaces.
- Context menus show an icon for every actionable entry (quick reactions
  excepted).
- Settings pages match WinUI cards, controls, and typography.
- `remove-stale.py` reports 0 stale tokens.
- Static theme builds without Sass errors and survives a renderer reload.

## 9. Risks

- Discord class hashes rotate between builds; re-dump before edits.
- Too many `backdrop-filter` layers can cost GPU time; keep blur to large
  surfaces and avoid stacking filters on every list row.
- User profile themes intentionally supply their own colours; do not override
  user content.
- Removing a stale parent block can remove live nested rules; prefer remapping
  the parent when the nested selectors still matter.
- The public `discord.com` web build and the desktop client can differ; always
  verify in the desktop renderer.
