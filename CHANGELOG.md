# Changelog

All notable changes to Fluent Discord Redux are documented here. Earlier release notes are available on the [GitHub releases page](https://github.com/supersharp/Fluent-Discord-Redux/releases).

## 0.0.38 - Tooltips, profile surfaces and Quests cleanup

Released 23 November 2026.

### Tooltips

- Unified Discord's legacy and design-system tooltip popups under the Fluent Frost surface (82% surface, 28px blur), with the Fluent stroke, 4px radius and 14px body text.
- Hid the legacy pointer and the design-system caret for a clean rounded tooltip, and preserved rich tooltips' own padding.
- Fixed the unavailable-servers notice tooltip, which previously fell back to Discord's opaque black tooltip.

### Profiles

- The DM profile sidebar now uses the Mica dialog surface instead of Discord's solid black aside and 60% black wash.
- Centred the full-profile tab labels and aligned the blue leading selector with the label, including a proper gutter.

### Quests

- Hid the sponsored takeover hero (for example, the GTA VI banner) and the full-width takeover footer at the end of the quest grid.
- Left the regular quest tiles untouched.

### Context menus

- Added the missing icons for the custom channel-list actions: `opt-into-category`, `opt-into-channel` and `opt-out-category` (Add/Remove from Channel List and Unfollow Channel Category).

### Channel notices

- The "This channel is not on your channel list" bar now uses the theme's Mica strip instead of Discord's opaque surface-high black, with a Fluent divider and no legacy shadow.

### Assets

- `Fluent-Discord-Redux-static.theme.css` - standalone/static theme.
- `Fluent-Discord-Redux.theme.css` - auto-updating theme stub.
