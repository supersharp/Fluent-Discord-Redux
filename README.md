# Fluent Discord Redux
A Windows 11 theme for Discord

This is forked from [Fluent Discord](https://github.com/TakosThings/Fluent-Discord) by [TakosThings](https://github.com/TakosThings)
With the original fixes from [ShiroNeko99](https://github.com/ShiroNeko99/Fluent-Discord)

Changes from the original fork:
* Fixed orbs balance 
* Fixed search bar in all the views (Shop, Quests, Channel view)
* Fixed broken theme for settings page
* Inbox overflow fix - Fixed inbox overflowing the viewport
* Black outline removal - Removed the black outline on server folders
* Fixed broken alignments for server icons in the left dock
* The autoupdate theme now points to this GitHub Repo
* GitHub Actions support for builds
* Updated elements to match the newest Discord UI (May 2026)


## Download
* From [Releases](https://github.com/supersharp/Fluent-Discord-Redux/releases/latest)
  * `Fluent-Discord-Redux.theme.css` will automatically update with new releases
  * `Fluent-Discord-Redux-static.theme.css` if you prefer to manually update to each release
* [Direct Auto-updating Link](https://github.com/supersharp/Fluent-Discord-Redux/releases/latest/download/Fluent-Discord-Redux.theme.css) (Right-click > Save link as...)

### Optional Extras
* [EmojiReplace](https://betterdiscord.app/theme/EmojiReplace) theme by DevilBro to get Windows 11 emoji on Discord

## Getting Help
* Keep in mind, this theme is a personal project and the primary function was to keep the theme updated for myself. Please keep this in mind for issues and requests.
* Report bugs by opening an [issue](https://github.com/supersharp/Fluent-Discord-Redux/issues)

## Preview
![Preview](https://raw.githubusercontent.com/supersharp/Fluent-Discord-Redux/develop/images/ui-1.12.1.png)

## Building Locally
To build and compile the theme yourself from the SCSS source code:

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Clone this repository and open a terminal in the folder.
3. Run `npm install` to install the required `sass` compiler.
4. Run one of the following commands depending on your needs:
   * `npm run build-static`: Compiles a fully standalone, static theme file to `dist/Fluent-Discord-Redux-static.theme.css`.
   * `npm run build-auto`: Compiles the auto-updating theme file (requires upstream host).
   * `npm run dev`: Starts the compiler in watch mode. It will automatically recompile and push changes directly to your local Vencord themes folder whenever you save an SCSS file. *(Note: If you use Equicord or BetterDiscord, you may need to adjust the path in `package.json`'s "dev" script).*
