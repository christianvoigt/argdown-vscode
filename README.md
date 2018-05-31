# Argdown Visual Studio Code Extension and Language Server

This repository contains the Argdown Visual Studio Code extension and the Argdown language server. For more information about the extension please read the [extension's Readme](client/README.md).

For more information about the Argdown argumentation syntax, visit the central [Argdown repository](https://github.com/christianvoigt/argdown).

![Argdown](https://cdn.rawgit.com/christianvoigt/argdown-vscode/master/argdown-mark.svg)

The code for the extension is in the 'client' folder. It uses the 'vscode-languageclient' node module to launch the language server.

The language server is located in the 'server' folder. 

# How to run locally
* `npm install` to initialize the extension and the server
* `npm run compile` to compile the extension and the server
* open this folder in VS Code. In the Debug viewlet, run 'Launch Client' from drop-down to launch the extension and attach to the extension.
* create a file `test.argdown`, and type `[title]: <A>`. You should see a validation error.
* to debug the server use the 'Attach to Server' launch config.
* set breakpoints in the client or the server.