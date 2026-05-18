# FLUENT DISCORD REDUX - COMPREHENSIVE IMPROVEMENT PLAN

## Date: 2026-05-17 | Version Reviewed: 0.0.14

---

## EXECUTIVE SUMMARY

Your theme has excellent architecture with well-organized modules and consistent Windows 11 Fluent Design tokens. The primary vulnerability is **heavy reliance on Discord's hash-based class names** (e.g., `.chat_f75fb0`, `.guilds__5e434`) which break when Discord updates their CSS module bundling.

This plan addresses selector resilience, code quality issues, and provides a migration path to make the theme survive Discord updates with minimal maintenance.

---

## CURRENT STATE ANALYSIS

### Project Structure
```
src/
├── fluent.scss                    # Main entry (imports 90+ modules)
├── fluent-auto.scss               # Auto-update version (fetches from GitHub releases)
├── fluent-build.scss              # Build system
└── modules/
    ├── core/                      # Variables, reset, metadata, options
    ├── mixins/                    # Type ramp, fonts, elevation
    ├── main/                      # Guilds, channels, chat, members, toolbar, voice
    ├── modals/                    # 15 modal types
    ├── popouts/                   # 14 popout types
    ├── settings/                  # User/server/channel settings
    ├── home/                      # Friends, activity, shop
    ├── discover/                  # Server discovery
    ├── common/                    # Shared components (mentions, search, bot tags)
    ├── ui/                        # Buttons, scrollbars, titlebar, tooltips
    ├── icons/                     # Icon replacements via Fluent icon font
    ├── betterdiscord/             # BD plugin compatibility (14 plugins)
    └── vencord/                   # Vencord plugin compatibility
```

### Architecture Strengths
- Excellent variable system using Windows 11 Fluent Design tokens (240+ color variables)
- Well-organized modular structure with clear separation of concerns
- Consistent mixin usage for typography (`TypeBody`, `TypeCaption`) and elevation
- Good use of CSS custom properties for user customization

### Critical Vulnerabilities Found

**1. Hash Class Dependency (SEVERITY: CRITICAL)**
Every module uses Discord's hash-based classes extensively:
```scss
// _chat.scss - 47+ hash class references
.chat_f75fb0 { background: transparent; }
.content_f75fb0 { background-color: $LayerFillColorAlt; }

// _guilds.scss - 38+ hash class references
.guilds__5e434 { width: 60px; }
.listItem__650eb { width: 44px; }

// _channels.scss - 52+ hash class references
.sidebar__5e434 { background-color: transparent !important; }
```

**Total count across all SCSS files:**
- ~996 single-underscore hash classes (format: `.className_hash`)
- ~636 double-underscore hash classes (format: `.className__hash`)
- **~1,632 total fragile selectors** that break on Discord updates

**2. !important Overuse (SEVERITY: HIGH)**
Found 637 instances of `!important` across 51 files. Worst offenders:
```scss
// _channels.scss lines 1-69 - Nearly every rule uses !important
.sidebar__5e434 {
    background-color: transparent !important;
    background: transparent !important;      // DUPLICATE RULE
    border-right: 0 !important;
    box-shadow: none !important;
}

// _settings.scss lines 98-179 - Heavy !important for settings redesign
.container__8a031, .modal_e44912 {
    background: transparent !important;
    background-color: transparent !important;
}
```

**3. Duplicate Property Declarations (SEVERITY: MEDIUM)**
Multiple files set both `background` AND `background-color`:
```scss
// _channels.scss line 2-3
background-color: transparent !important;
background: transparent !important;

// _settings.scss lines 109-110
background: transparent !important;
background-color: transparent !important;
```

**4. Existing Update Mechanism is Fragile (SEVERITY: HIGH)**
The `scripts/update_classes.py` script does find-and-replace using a 3MB `Changes.txt` file with old-to-new class name mappings. This approach:
- Only works if you know the exact old and new class names
- Doesn't handle structural DOM changes
- Requires manual maintenance of Changes.txt after each Discord update
- Is a reactive fix, not proactive resilience

---

## RECOMMENDED IMPROVEMENTS (PRIORITY ORDER)

### Priority 1: Create Resilient Selector Mixins

**File to create:** `src/modules/mixins/_selectors.scss`

```scss
// ============================================
// RESILIENT SELECTOR MIXINS
// These target Discord UI areas regardless of class name changes
// ============================================

@mixin discord-chat-area {
    // Targets chat content area - multiple fallbacks for resilience
    [class*="chatContent"],
    [data-list-item-id^="chat-messages"] {
        @content;
    }
}

@mixin discord-sidebar {
    // Targets server sidebar (guild list)
    .wrapper_ef3116,                    // Current class (primary)
    [class*="guilds"][class*="wrapper"], // Fallback 1: partial match
    div[class*="guilds"] > div:first-child { // Fallback 2: structural
        @content;
    }
}

@mixin discord-channel-list {
    // Targets channel list area
    .sidebar__5e434,                    // Current class (primary)
    [class*="channelListContents"],     // Fallback 1
    div[class*="sidebar"][class*="tree"] { // Fallback 2
        @content;
    }
}

@mixin discord-member-list {
    // Targets member list
    .membersWrap-3NUR2t,                // Current class (primary)
    [data-list-id$="-members"],         // Fallback 1: data attribute
    div[class*="members"]              // Fallback 2: partial match
    {
        @content;
    }
}

@mixin discord-settings-panel {
    // Targets settings area
    .standardSidebarView__23e6b,        // Current class (primary)
    [class*="standardSidebarView"],     // Fallback 1
    div[class*="sidebarRegion"]         // Fallback 2
    {
        @content;
    }
}

// ============================================
// STRUCTURAL FALLBACK SELECTORS
// These use DOM structure instead of class names
// ============================================

@mixin discord-main-content {
    // Main content area (chat + members)
    #app-mount > div[class*="standardSidebarView"] ~ div,
    [class*="content"][class*="primary"] {
        @content;
    }
}

@mixin discord-guild-list {
    // Server list sidebar
    #app-mount > div:first-child,
    [class*="guilds"][class*="list"] {
        @content;
    }
}

// ============================================
// ATTRIBUTE-BASED SELECTORS
// These use data attributes which are more stable than class names
// ============================================

@mixin discord-voice-channel {
    // Voice channels
    [data-list-item-id^="call-container"],
    [class*="voiceChannel"] {
        @content;
    }
}

@mixin discord-text-input {
    // Text input areas
    textarea,
    [role="textbox"],
    [class*="textArea"] {
        @content;
    }
}
```

### Priority 2: Replace Fragile Selectors in Chat Module (Example)

**Current (_chat.scss - fragile):**
```scss
.chat_f75fb0 { background: transparent; }
.content_f75fb0 { background-color: $LayerFillColorAlt; }
.chatContent_f75fb0 { background-color: $LayerFillColorDefault; }
```

**Recommended (resilient with fallbacks):**
```scss
// Primary selector + fallback chain for each critical element
.chat_f75fb0,                    // Current Discord class (primary)
[class*="chat"][class*="content"] { // Fallback: partial match on both words
    background: transparent;
}

.content_f75fb0,                 // Current Discord class (primary)
[class*="content"][class*="primary"] { // Fallback
    background-color: $LayerFillColorAlt;
    border-left: 0;
    border-radius: 8px 0 0 0;
    box-shadow: none;
}

.chatContent_f75fb0,            // Current Discord class (primary)
[class*="chatContent"] {        // Fallback: partial match on compound name
    background-color: $LayerFillColorDefault;
    border-top-left-radius: 8px;
    overflow: hidden;
}
```

### Priority 3: Add Fallback Selectors to Every Critical Rule

For every critical selector, add a fallback pattern using the **primary + fallback** approach:

```scss
// Pattern: Primary class (current) + Fallback 1 (partial match) + Fallback 2 (structural)
.guilds__5e434,                    // Current Discord class
[class*="guilds"][class*="list"],  // Fallback 1: partial class name match
#app-mount > div:first-child       // Fallback 2: structural position
{
    width: 60px;
}
```

---

## CODE QUALITY IMPROVEMENTS

### Issue #1: Overuse of !important in _channels.scss (Lines 1-69)

**Current:**
```scss
.sidebar__5e434 {
    background-color: transparent !important;
    background: transparent !important;      // DUPLICATE RULE
    border-right: 0 !important;
    box-shadow: none !important;
}
```

**Fix:** Use more specific selectors instead of `!important`:
```scss
// More specific selector eliminates need for !important
.theme-dark .sidebar__5e434 {
    background: transparent;           // 'background' alone covers both properties
    border-right: 0;
    box-shadow: none;

    &::after {
        display: none;
        content: none;
    }
}
```

### Issue #2: Duplicate Property Declarations Across Multiple Files

**Found in:** `_channels.scss`, `_settings.scss`, `_home/main.scss`

**Fix:** Use `background: transparent` alone (it covers both `background-color` and `background-image`)

### Issue #3: Dead Code in _reset.scss (Lines 32-40)

```scss
// Nitro font override classes - verify these are still current Discord classes
.cherryBomb__89a31,
.chicle__89a31,
.museoModerno__89a31,
.neoCastel__89a31,
.pixelify__89a31,
.sinistre__89a31,
.zillaSlab__89a31 {
    font-family: var(--font-primary);
}
```

**Recommendation:** Test if these hash classes still exist in current Discord. If not, replace with partial match `[class*="cherryBomb"]` etc.

---

## DISCORD HTML DUMP ANALYSIS

### Current Class Naming Convention (from HTML dumps)
Discord uses CSS Modules with the format: `className_hash` where hash is 5-6 hex characters:
```html
<!-- Examples from channel_page_html.txt -->
class="appMount__51fd7"
class="bar_c38106 systemBar_c38106 fixed_c38106"
class="wrapper_ef3116 guilds__5e434 theme-dark theme-midnight images-dark"
```

### Stable Data Attributes Found (from HTML dumps)
Discord provides `data-list-item-id` attributes that are **much more stable** than class names:

| UI Area | data-list-item-id Pattern | Stability |
|---------|---------------------------|-----------|
| Server list items | `guildsnav___*` | HIGH - structural, not CSS module based |
| Channel list items | `channels___*` | HIGH |
| Chat messages | `chat-messages___*` | HIGH |
| Member list items | `members-*___*` | HIGH |
| Private channels (DMs) | `private-channels-uid_*___*` | HIGH |
| Settings sidebar items | `settings-sidebar___*_sidebar_item` | HIGH |

**Key Finding:** These data attributes are NOT affected by CSS module hash changes. They're the most resilient selectors available.

---

## IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Estimated: 1-2 hours)
- [ ] Remove duplicate `background`/`background-color` declarations across all files
- [ ] Consolidate redundant `!important` usage where specificity can replace it
- [ ] Clean up dead code in `_reset.scss` (verify nitro font classes still exist)
- [ ] Add comments documenting which Discord UI area each hash class targets

### Phase 2: Selector Hardening (Estimated: 4-6 hours)
- [ ] Create resilient selector mixins file (`src/modules/mixins/_selectors.scss`)
- [ ] Replace exact hash classes with partial matches in chat module first (highest impact)
- [ ] Add fallback selectors for critical UI areas (guilds, channels, members, settings)
- [ ] Test against current Discord version

### Phase 3: Full Migration (Estimated: 8-12 hours)
- [ ] Audit all 95+ SCSS files for fragile selectors
- [ ] Implement new selector patterns throughout
- [ ] Create a "selector mapping" document that tracks which Discord classes map to which UI components
- [ ] Test against current and previous Discord versions

### Phase 4: Ongoing Maintenance (Per Discord update)
- [ ] Run the existing `update_classes.py` script for any class name changes
- [ ] Verify fallback selectors still work
- [ ] Update Changes.txt with new mappings if needed

---

## SPECIFIC FILE-BY-FILE ISSUES FOUND

### _channels.scss (Highest Priority - Most !important usage)
- Lines 1-69: Nearly every rule uses `!important` + duplicate properties
- Fix: Increase selector specificity, remove duplicates

### _settings.scss (High Priority - Settings page is frequently used)
- Lines 98-179: Heavy `!important` for settings redesign modal
- Lines 139-159: Theme selector uses multiple `!important` per rule
- Fix: Use `.theme-dark .layer__960e4` as parent context to increase specificity

### _guilds.scss (High Priority - Server list is core UI)
- 38+ hash class references, all single-point-of-failure
- Lines 15, 22, 52-53: `!important` used for inline style override
- Fix: Add fallback selectors using `[class*="guilds"]` pattern

### _chat.scss (High Priority - Chat is core UI)
- 47+ hash class references
- Lines 60-91: Reaction styling uses deeply nested hash classes
- Fix: Add partial match fallbacks for each critical selector

### _reset.scss (Medium Priority)
- Lines 32-40: Nitro font override classes may be outdated
- Fix: Verify current Discord class names, add partial match fallbacks

---

## TESTING STRATEGY FOR DISCORD UPDATES

### Critical Areas to Test After Each Update
1. Server list renders correctly (guilds module)
2. Channel list shows properly (channels module)
3. Chat area background is transparent (chat module)
4. Member list displays members (members module)
5. Settings panel opens without white backgrounds
6. Acrylic effect still works on main window
7. Voice channel indicators show correctly
8. Thread UI renders properly

### Quick Selector Validation Script
Run this in Discord dev tools to check if selectors match:
```javascript
// Test critical selectors
const tests = {
    'Server Sidebar': document.querySelector('[class*="guilds"]'),
    'Channel List': document.querySelector('[class*="channelListContents"]'),
    'Chat Area': document.querySelector('[class*="chatContent"]'),
    'Member List': document.querySelector('[class*="membersWrap"]'),
};

// Log results
Object.entries(tests).forEach(([name, element]) => {
    console.log(`${name}: ${element ? ' FOUND' : ' NOT FOUND'}`);
});
```

---

## ADDITIONAL RECOMMENDATIONS

1. **Create a selector mapping file** documenting which Discord classes map to which UI components
2. **Add CSS custom properties** for critical selectors that might need runtime adjustment
3. **Implement feature detection** using `@supports` for newer CSS features like `:has()`
4. **Consider using `:has()` selector** where supported for more resilient targeting
