# Argdown for Visual Studio Code

This extension provides the following features:

- Syntax highlighting
- Linting
- Html, Dot and JSON Export

Currently the extension is still in its alpha phase. More features and better documentation will be added over time. 

For more information about the Argdown argumentation syntax visit the central [Argdown repository](https://github.com/christianvoigt/argdown).

## Exporting Argdown files to HTML, Dot and JSON

The extension contributes four new commands to the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette):

- 'Argdown: Export Argdown files to HTML'
- 'Argdown: Export Argdown files to JSON'
- 'Argdown: Export Argdown files to Dot'
- 'Argdown: Run Argdown parser with config file'

To access these commands, open the command palette (`CTRL + Shift + P` on Windows/Linux or `CMD + Shift + P` on OSX), type in Argdown and select the command you want to execute.

By default the export commands will export all Argdown files in each workspace folder. To configure which files to export or at which path you want to save the exported files, you can change the Argdown settings (see below).

In the future, we will try to integrate these exports commands into the general user interfacen and add additional export options.

## Configuration

Basic configuration options are available directly in the VS Code preferences. For advanced configuration you can use a `argdown.config.js` file.

### Choosing which files to export

If you do not want to export all Argdown files in the workspace, you can select the files to export by using a file "glob" selector in the VS Code settings. VS Code allows you to define globals settings, settings for the current workspace or settings for the current workspace folder. To change the settings for the current folder, do the following:

1. Open the preferences by selecting `Code/Preferences/Settings` from the main application menu or by pressing `CTRL + ,` on Windows/Linux or `CMD + ,` on OSX.
2. On the right side you can define your settings. Select the folder settings tab.
3. Add the following setting to only export `.argdown` files in the `argdown` folder to HTML: "argdown.htmlExportInput: argdown/*.argdown"

For selecting which files to export to Dot or JSON, use `argdown.dotExportInput` and `argdown.jsonExportInput`.

### Choosing where to export files to

By default, HTML files are saved in a `./html` folder, json files in a `./dot` folder and JSON files in a `./json` folder. To export all files to an `export` directory, do the following:

1. Open the preferences by selecting `Code/Preferences/Settings` from the main application menu or by pressing `CTRL + ,` on Windows/Linux or `CMD + ,` on OSX.
2. On the right side you can define your settings. Select the folder settings tab.
3. Add: "argdown.htmlDirectory: export"
4. Add: "argdown.dotDirectory: export"
5. Add: "argdown.jsonDirectory: export"

### Using argdown.config.js for advanced configuration options

You can create `argdown.config.js` files in your workspace folders as described in the [argdown-cli Readme](https://github.com/christianvoigt/argdown-cli)  to change the way the Argdown commands are executed. Using config files you can achieve anything you can do with the Argdown Commandline Interface.

If you define a `process` property in your config file, you can run the `Argdown: Run Argdown parser with config file` to run your custom process (only suited for advanced Argdown users).