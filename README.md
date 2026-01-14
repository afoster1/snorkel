# Snorkel

Snorkel is an Obsidian plugin assistant for getting things done.

## Development

1. Clone this repo into your vault's `.obsidian/plugins/` folder
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start compilation in watch mode
4. Reload Obsidian to load the plugin
5. Make changes to `main.ts` and they will be compiled automatically

## Building

- Run `npm run build` to build the plugin for production

## Manually Installing the Plugin

- Copy `main.js`, `styles.css`, `manifest.json` to your vault's `.obsidian/plugins/snorkel/` folder

## Releasing

- Update your `manifest.json` with your new version number
- Update your `versions.json` file with the new version and minimum Obsidian version
- Create a new GitHub release with the files `main.js`, `styles.css`, `manifest.json`
- Tag the release with the version number

## API Documentation

See https://github.com/obsidianmd/obsidian-api
