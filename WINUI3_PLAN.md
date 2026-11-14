# WinUI 3 Dark Emulation Plan — Fluent Discord Redux

Status: active · Target: Discord Desktop 1.0.9267 / Chromium 152 · Theme: 0.0.32

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
| Mica surface | translucent + blur | `$MicaSurface*` / `$MicaDialog*` / `$FrostGlass*` | Shared tokens |
| Accent | Windows accent / WinUI light blue | HSL from user options | OK |
| Radii | 4 controls, 8 flyouts/cards | 4/8 | Mostly OK |
| Type ramp | 12/14/20/28/40 | 12/14/20/28/40 | OK |
| Spacing | 4/8/12/16/24/32 | used across partials | Audited this pass |

**Done:** Mica, dialog and frost values now come from shared tokens in
`src/modules/core/_variables.scss` (`$MicaSurfaceFillColor`, `$MicaDialogFillColor`,
`$FrostGlassFillColor`, `$MicaSurfaceBlur`, `$FrostGlassBlur`,
`$SurfaceRadius`, `$ControlRadius`). Large popouts (inbox, emoji picker,
search, threads, soundboard, pinned, activity cards) use Mica; menus, tooltips,
account/voice previews use Frost glass; modals and settings use the dialog tint.

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

### Phase 1 — Shell and navigation (done)

- [x] Rebuild User Settings modal.
- [x] Rebuild Server Settings full-screen shell.
- [x] Rebuild Channel Settings shell and native radio accent.
- [x] Remove Friends/Shop/Discover double tab underline; use side accent.
- [x] Discover header transparent, separators removed.
- [x] Friends/Shop tabs use a single leading accent bar with label inset.
- [x] Shop wishlist heart centred in its 32px control.
- [x] Audit guild rail, channel sidebar, chat header, member rail against
      WinUI NavigationView spacing.
- [x] Audit titlebar focus/active states.

### Phase 2 — Surfaces and materials (done)

- [x] Inbox popout Mica.
- [x] Emoji/GIF/sticker picker Mica + search.
- [x] Activity rail / Active Now cards to Mica cards.
- [x] Emoji/reaction category rail stops above the preview footer.
- [x] Unicode category shortcut is opaque and no longer overlaps category icons.
- [x] Discover header/nav Mica and separators removed.
- [x] Apps/Commands drawer uses a Mica shell, hairline border and card fills.
- [x] Audit Shop, Quests, Discover cards for card fill/stroke/radius.
- [x] Audit modals and popouts for consistent 8px radius and Mica tint.
- [x] Consolidate Mica values into shared variables.

> Surface audit notes (2026-11-14):
> * Settings dialog and cards are 8px (was 10px/6px); settings nav rows use
>   14/20, 4px radius and a 3×16 leading pill. The nav rules are scoped to
>   `.nav_cR4ic2` so the profile header (also `item_xyJHva`) keeps its native
>   16px header sizing.
> * Inbox tabs had both a leading bar and a 2px bottom underline; only the
>   leading bar remains.
> * Shop product tiles use a 1px 7% hairline (was 2px 16%); quest tiles are 8px
>   (was 10px) with the same hairline. Discover cards already matched tokens.
> * Quick switcher had no fill at all: the settings transparency rule targeted
>   every `.container_dvN-MP`, which is also the quick-switcher root. The rule
>   is now scoped to the settings dialog; quick switcher renders dialog Mica.
> * User profile popout was an opaque `#202020` card; it now uses the dialog
>   Mica tint, 24px blur and an 8px inner pane.
> * Soundboard and role popouts were verified in source only (opening them
>   needs an active voice call / role interaction).

### Phase 3 — Controls (done)

- [x] Search inputs: wrapper fill, full-height input, visible icon.
- [x] Native radio/checkbox accent.
- [x] Audit all buttons/inputs/selects/toggles for WinUI 16/32/40px sizing.
- [x] Fix missing channel/DM context-menu icons.
- [x] Restore the composer attach-menu Schedule Message icon.
- [x] Audit all context-menu submenus.
- [x] Audit guild-view font families (Segoe UI Variable Text/Display; no gg sans).
- [x] Audit tooltips, progress rings, scrollbars.

> Audit notes (2026-11-14):
> * Settings buttons/inputs/search are 32px; toggles are 40×20; icon buttons
>   are 32px. Chat composer keeps its 48px multi-line height by design.
> * Channel rows keep Discord's compact 29px density (WinUI's 36px would
>   halve the number of visible channels); their resting radius is now pinned
>   to 4px, matching hover/selected, with the 3×16 leading indicator.
> * Guild rail stays 60px wide to fit 44px guild icons; the 3×16 selection
>   pill and 4px stack gap match the NavigationView compact pane.
> * Submenus that are value choices (mute duration, notification level, roles,
>   move-to category) intentionally have no glyph; action menus all have one.
> * Tooltip and scrollbar styling verified live. Quest progress rings are a
>   4px stroke, 24% white track with the success-green arc for completed
>   quests; the colour carries state, so it stays green rather than accent.

### Phase 4 — Content surfaces (done)

- [x] Message list, embeds, code blocks, reactions.
- [x] Composer/attachments.
- [x] Voice panel and in-call controls (respect existing no-theme policy).
- [x] Notifications/toasts/loading.

> Content audit notes (2026-11-14):
> * Image/video attachments and their wrappers are 8px (was 3px/6px).
> * Embeds are 8px with an inset 7% hairline; Discord's 4px colour bar is
>   preserved. Inline code is a 4px control fill; fenced code is an 8px card.
> * The message hover toolbar was a 70% black pill with a 6px radius; it is now
>   an acrylic flyout (96% tint, 20px blur, 8px radius, hairline).
> * Reaction pills already used the 4px control fill/stroke; verified with a
>   rendered sandbox.
> * Composer keeps its 48px multi-line height, 4px radius and accent focus
>   underline; the attach button radius is now 4px (was 2px).
> * Voice: the connected panel and empty call view keep Discord's native
>   control tray (reverted radius per policy); call tiles already match WinUI
>   cards. No layout changes were made.
> * Notifications/toasts keep Discord's native floating surface — adding blind
>   overrides risks breaking its positioning and animation. The loading
>   "Connecting" splash renders before the theme CSS is injected, so it is not
>   themeable; the DOM loading spinner is already themed.

### Phase 5 — Verification and release (in progress)

- [x] Screenshot every surface at 100% and 125% scaling.
- [x] Check light/dark class leaks (theme is dark-only).
- [x] Run `remove-stale.py` (must report 0).
- [x] Build static + auto, install, reload.
- [x] User review; commit only after approval.

> Verification notes (2026-11-14):
> * `stale-report.py` reports **0 stale tokens**. Removed the last two
>   (`card_nFRzXP` comment, BD `frame_lzDcNJ` selector → `[class*="frame_"]`).
> * Dark-only selectors audited: the remaining `.theme-light` entries only
>   clear scrims/media shells; no light palette leaks.
> * Static build is warning-free; installed hash matches `dist`
>   (`5B0F695F…`). The auto file only imports the remote static theme.
> * Captured at 125%: guild shell, Friends, Shop, Quests, Discover, Inbox,
>   emoji picker, context menu, user popout, User Settings, Server Settings and
>   Channel Settings; corresponding 100% captures exist from this pass. No
>   clipping, overflow or duplicate indicators. Soundboard/role popouts remain
>   source-verified only (they need a live call/role interaction).

> Review adjustments (2026-11-14, after first user review):
> * Settings search had a second 40px/6% wrapper behind the 30px input; the
>   wrapper is now transparent and 32px, so only the input surface remains.
>   Hover/focus border and accent underline moved onto the input itself.
> * Settings section rows no longer paint their own 20% selection pill when a
>   child page is selected; rows without a selected child keep one 6% fill and
>   the 3×16 accent bar. Only one level is highlighted at a time.
> * Voice Details tabs use a Pivot-style bottom indicator instead of the
>   leading bar, which read as a stray mark beside “Connection”.
> * Voice call root `root_rTsZa_` painted opaque black over the acrylic at
>   smaller window sizes; it is now transparent, so Mica stays visible.
> * Voice side chat now uses a blue frosted-glass panel (accent gradient over
>   a 0.72 dark base) with a hairline and no top seam, so welcome/messages no
>   longer float over the call video when the chat is expanded.

> Second review adjustments (2026-11-14):
> * Settings subnav had a white scroll thumb beside the blue selection pill.
>   The track/thumb are now invisible but still occupy their 2px grid column,
>   which keeps every page row in the 186px column (removing them from layout
>   made alternate rows stack in the 2px column).
> * Nested settings cards (Microphone/Speaker, volume, mic test) no longer
>   paint their own fill/hairline; only the top-level page card remains.
> * Sliders use the current `slider_OnqacX` classes: the fill and grabber are
>   accent blue instead of Discord blurple.
> * The selected guild/Home pill is now accent blue; the old height-based
>   colour loop no longer matched because Discord stopped writing the height
>   inline.
> * Voice side chat is a blue accent-frost panel and its 1px top seam is
>   removed.

> Third review adjustments (2026-11-14):
> * Settings select dropdowns were transparent because Discord's higher-
>   specificity rule won with `background-color: var(--background-surface-higher)`.
>   The popout now uses the acrylic token with `!important`, so options are
>   readable and no longer show the page behind.
> * Settings subnav rows were 48px because the hidden scroll track occupied a
>   spanning grid row. The track/thumb are removed and page rows are explicitly
>   placed in the 186px column, restoring 32px spacing.
> * Account Info “Reveal” buttons use the accent text colour instead of
>   Discord blurple.
> * Voice side chat is now a true frosted-glass veil: 10% white tint, 32px
>   blur with brightness/saturation, no painted blue fill.
> * The 1px `callContainer` top border is removed, so no separator line
>   remains above the voice view.

> Fourth review adjustments (2026-11-14):
> * Settings subnav had a 16px grid `row-gap` in addition to the 1px item
>   margins; setting `row-gap: 0` brings the pitch from 48px to 34px.
> * Added shared `$FrostGlass*` tokens and moved all popup menus/flyouts
>   (context menus, select popouts, tooltips, account/channel previews, chat
>   hover toolbar and text-formatting toolbar) to one frosted-glass material
>   instead of the matte acrylic fill.

> Fifth review adjustments (2026-11-14):
> * Emoji/GIF/sticker picker tabs now use the same vertical 3×16 leading
>   indicator as the rest of the theme instead of a horizontal underline.
> * Registered Games “Add a game” flyout and the DM-permissions server
>   combobox dropdown are on the frost-glass surface with an 8px radius.
> * Verified flower-star badges use the accent blue instead of Discord
>   blurple.
> * Inbox selected tabs get the settings-style 6% pill; Content Filters and
>   Inbox accent bars are 20px long to suit their taller rows.

> Sixth review adjustments (2026-11-14):
> * Emoji picker nav rows gained 8px leading padding, so the vertical accent
>   bar no longer touches the label.
> * Inbox tabs keep their 36px height with zero bottom padding, centring the
>   label on the 20px accent bar.
> * Content Filters vertical tabs keep a 20px centred indicator.
> * Focus rings on text inputs, select fields and search wrappers now use the
>   theme accent instead of Discord blurple.

> 0.0.34 patch (2026-11-14):
> * Questify's injected server-list tile shows its accent selection pill only
>   while the Quests view is active.
> * The Questify quest-count badge uses the same dark-on-pink colours as the
>   Discord Suggestions badge.

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
