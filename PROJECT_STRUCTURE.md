# Fluent Discord Redux — Project Structure & AI Developer Guide

This document is designed for AI coding assistants and developers maintaining **Fluent Discord Redux**. It details the codebase structure, build pipeline, design principles, class naming conventions, and maintenance workflows.

---

## 1. Project Overview

**Fluent Discord Redux** is a custom Discord theme designed to bring Microsoft's Windows 11 **Fluent 2 Design System** (Mica/Acrylic material, rounded geometry, Segoe UI typography, and Segoe Fluent Icons) to Discord clients like Vencord and BetterDiscord.

- **Primary Language**: SCSS (Sass)
- **Output**: Compiled CSS theme bundles in `dist/`
- **Build Tool**: Dart Sass via npm scripts (`sass`)

---

## 2. Directory & File Organization

```
Fluent-Discord-Redux/
├── .docs/                    # Developer docs and release checklists
├── Fonts/                    # Local TTF fonts (Segoe Fluent Icons, Segoe UI)
├── images/                   # Theme backgrounds & motion assets
├── dist/                     # Compiled CSS themes & Discord client HTML dumps
│   ├── Fluent-Discord-Redux.theme.css          # Auto-updating theme file
│   ├── Fluent-Discord-Redux-static.theme.css   # Self-contained static theme file
│   └── Discord_Source_Code/                    # HTML dumps (.txt) from Discord client
├── src/                      # Source SCSS files
│   ├── fluent.scss           # Main static theme entry point
│   ├── fluent-auto.scss      # Auto-updating theme entry point (imports remote or root)
│   ├── fluent-build.scss     # Core theme compiler manifest
│   └── modules/              # Modular SCSS components
│       ├── betterdiscord/    # BetterDiscord specific styling & meta tags
│       ├── common/           # Cross-component utilities & common search styles
│       ├── core/             # Design tokens, variables, typography, reset, options
│       ├── discover/         # Discover tab (Servers, Apps, Quests)
│       ├── home/             # Home views (Shop, Quests, DM activity, conversations)
│       ├── icons/            # Segoe Fluent Icons replacement rules
│       ├── loadscreen/       # App loading screen
│       ├── main/             # Core Discord app shell (Chat, Chatbox, Toolbar, Voice, Members)
│       ├── misc/             # Badges, tooltips, misc styling
│       ├── mixins/           # Sass mixins (animations, typography, selector bundles)
│       ├── modals/           # Modal dialogs (Settings, Activities, User profile modal)
│       ├── popouts/          # Flyouts (Emoji/Sticker/GIF picker, Soundboard, Menus, Popouts)
│       ├── settings/         # Discord user & server settings views
│       ├── third_party/      # Compatibility with common client plugins
│       ├── ui/               # Reusable UI controls (Buttons, Forms, Inputs, Radios, Toggles)
│       └── vencord/          # Vencord-specific styling & overrides
└── package.json              # Build scripts and Sass devDependency
```

---

## 3. Build System & Commands

All build workflows use npm scripts defined in `package.json`:

| Command | Purpose |
|---------|---------|
| `npm run build-static` | Compiles `src/fluent.scss` into `dist/Fluent-Discord-Redux-static.theme.css` |
| `npm run build-auto` | Compiles `src/fluent-auto.scss` into `dist/Fluent-Discord-Redux.theme.css` |
| `npm run dev` | Watches `src/fluent.scss` and writes directly to local Vencord themes folder |

> **Always run `npm run build-static` and `npm run build-auto` after modifying any SCSS files to verify syntax and update build artifacts.**

---

## 4. Architecture & Entry Points

- **`src/fluent.scss`**: Compiles the standalone static theme. Imports core options, design tokens, resets, client metadata, and all modules in `src/modules/`.
- **`src/fluent-build.scss`**: Shared manifest containing all module `@import` directives in dependency order.
- **`src/fluent-auto.scss`**: Imports metadata with auto-update flags and builds the auto-updating bundle.

---

## 5. Design System & Theming Philosophy

The theme follows the **Windows 11 Fluent 2 Design System**:
1. **Mica & Acrylic Materials**:
   - Outer shells and titlebars are kept transparent to allow the acrylic background (`--fluent-acrylic-background`) and blur to shine through.
   - Layers and content surfaces use `$LayerFillColorDefault` or `$MicaBackgroundFillColorBase` with `backdrop-filter: blur(16px)`.
   - Modals and flyouts use `$SurfaceStrokeColorFlyout` with subtle rounded corners (`border-radius: 8px`).
2. **Typography**:
   - Set to Segoe UI typography mixins: `@include TypeBody`, `@include TypeBodyStrong`, `@include TypeCaption`, `@include TypeTitle`.
3. **Icons**:
   - Segoe Fluent Icons (`@include FontIconFluent`) replace Discord SVG icons via `::before` pseudo-elements where appropriate.
4. **Control Strokes & Fills**:
   - Inputs, buttons, and radio controls use `$ControlFillColorDefault`, `$ControlStrokeColorDefault`, and `$AccentBase` highlights.
   - Active/focused states receive `$AccentBase` or `$AccentLight1` borders/rings.

---

## 6. Discord Class Naming Conventions & Maintenance Strategy

Discord uses obfuscated CSS class names with random alphanumeric hashes (e.g. `wrapper_f7ecac`, `container__75098`). These hashes rotate periodically across Discord client updates.

### Best Practices for Selector Resilience
1. **Combine Exact Hashes with Wildcard Fallbacks**:
   Always pair known hashes with `[class*="..."]` wildcard patterns or `:is()` selectors:
   ```scss
   // Good: resilient against hash rotation
   :is(.wrapper_f7ecac, .popover_f84418, [class*="popover_"]) { ... }

   // Good: handles rotated Mana inputs
   :is(.input__0f084, .input__75098, [class*="input_"]) { ... }
   ```
2. **Scope Wildcards Carefully**:
   Never use overly broad wildcards like `[class*="clickable_"]` globally without scoping to their container (e.g., within `.toolbar__9293f`), as multiple Discord components share common word stems.
3. **Avoid Overusing `!important`**:
   Only use `!important` when overriding Discord's inline styles (e.g. `style="background: ..."` or `style="width: ..."`) or high-specificity client declarations. Maintain clean specificity where possible.
4. **Protect Dynamic Content in Replacement Selectors**:
   When replacing icons with Fluent font glyphs via `::before`, always protect dynamic elements:
   ```scss
   // Exclude custom emoji reactions from SVG-hiding rules:
   :is(.button_f7ecac, .hoverBarButton_f84418)[aria-label]:not([aria-label^="Click to react"]):not(:has(.emoji)) {
       &::before { @include FontIconFluent; }
       svg { display: none; }
   }
   ```

---

## 7. Specific Component Policies

- **In-Call Voice Controls**: The bottom in-call toolbar (`videoControls_`, `bottomControls_`, `attachedCaretButtonContainer_`, soundboard, mute, disconnect) is intentionally kept **unthemed**. Discord's native pill layouts, attached dropdown carets, Lottie animations, and disconnect button styling are preserved without custom CSS or font icon overrides to avoid regressions during active calls.
