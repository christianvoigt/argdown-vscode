"use strict";
import * as path from "path";
import {
  createConnection,
  TextDocuments,
  TextDocument,
  Diagnostic,
  DiagnosticSeverity,
  Range,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  Proposed
} from "vscode-languageserver";
import Uri from "vscode-uri";
import { IArgdownSettings } from "./IArgdownSettings";
import {
  exportDocument,
  exportContent,
  ExportContentArgs,
  ExportDocumentArgs
} from "./commands/Export";

const EXPORT_CONTENT_COMMAND = "argdown.server.exportContent";
const EXPORT_DOCUMENT_COMMAND = "argdown.server.exportDocument";
const RUN_COMMAND = "argdown.run";

const argdownCli = require("argdown-cli");
const argdownEngine = argdownCli.app;

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = createConnection(ProposedFeatures.all);
argdownEngine.logger.log = function(level: string, message: string) {
  if (level != "verbose" || this.logLevel == "verbose") {
    connection.console.log(message);
  }
};

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
let workspaceFolders: Proposed.WorkspaceFolder[];

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
connection.onInitialize(
  (
    params: InitializeParams & Proposed.WorkspaceFoldersInitializeParams
  ): InitializeResult => {
    let capabilities = params.capabilities;
    connection.console.log("Node version: " + process.version);

    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    hasWorkspaceFolderCapability =
      (capabilities as Proposed.WorkspaceFoldersClientCapabilities).workspace &&
      !!(capabilities as Proposed.WorkspaceFoldersClientCapabilities).workspace
        .workspaceFolders;
    hasConfigurationCapability =
      (capabilities as Proposed.ConfigurationClientCapabilities).workspace &&
      !!(capabilities as Proposed.ConfigurationClientCapabilities).workspace
        .configuration;

    if (params.workspaceFolders) {
      workspaceFolders = params.workspaceFolders;

      // Sort folders.
      sortWorkspaceFolders();
    }
    return {
      capabilities: {
        // Tell the client that the server works in FULL text document sync mode
        textDocumentSync: documents.syncKind,
        // Tell the client that the server support code complete
        // completionProvider: {
        // 	resolveProvider: true,
        // },
        executeCommandProvider: {
          commands: [
            EXPORT_DOCUMENT_COMMAND,
            EXPORT_CONTENT_COMMAND,
            RUN_COMMAND
          ]
        }
      }
    };
  }
);

connection.onInitialized(() => {
  connection.console.log(
    "Argdown language server initialized. Node version: " + process.version
  );
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      // Removed folders.
      for (const workspaceFolder of event.removed) {
        const index = workspaceFolders.findIndex(
          folder => folder.uri === workspaceFolder.uri
        );

        if (index !== -1) {
          workspaceFolders.splice(index, 1);
        }
      }

      // Added folders.
      for (const workspaceFolder of event.added) {
        workspaceFolders.push(workspaceFolder);
      }

      // Sort folders.
      sortWorkspaceFolders();
    });
  }
});

function sortWorkspaceFolders() {
  workspaceFolders.sort((folder1, folder2) => {
    let uri1 = folder1.uri.toString();
    let uri2 = folder2.uri.toString();

    if (!uri1.endsWith("/")) {
      uri1 += path.sep;
    }

    if (uri2.endsWith("/")) {
      uri2 += path.sep;
    }

    return uri1.length - uri2.length;
  });
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: IArgdownSettings = {
  configFile: "argdown.config.js"
};
let globalSettings: IArgdownSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<IArgdownSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <IArgdownSettings>(change.settings.lspMultiRootSample ||
      defaultSettings);
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<IArgdownSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({ scopeUri: resource });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
// interface Settings {
// 	lspSample: ExampleSettings;
// }

// These are the example settings we defined in the client's package.json
// file
// interface ExampleSettings {
// 	maxNumberOfProblems: number;
// }

// hold the maxNumberOfProblems setting
//let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // let settings = await getDocumentSettings(textDocument.uri);

  let text = textDocument.getText();
  let result = argdownEngine.run({
    process: ["preprocessor", "parse-input", "build-model"],
    input: text
  });
  let diagnostics: Diagnostic[] = [];
  if (result.parserErrors && result.parserErrors.length > 0) {
    for (var error of result.parserErrors) {
      var start = {
        line: error.token.startLine - 1,
        character: error.token.startColumn - 1
      };
      var end = {
        line: error.token.endLine - 1,
        character: error.token.endColumn
      }; //end character is zero based, exclusive
      var range = Range.create(start, end);
      var message = error.message;
      var severity = DiagnosticSeverity.Error;
      var diagnostic = Diagnostic.create(range, message, severity, "argdown");
      diagnostics.push(diagnostic);
    }
  }
  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VSCode
  connection.console.log("We recevied an file change event");
});

// // This handler provides the initial list of the completion items.
// connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
// 	// The pass parameter contains the position of the text document in
// 	// which code complete got requested. For the example we ignore this
// 	// info and always provide the same completion items.
// 	return [
// 		{
// 			label: 'TypeScript',
// 			kind: CompletionItemKind.Text,
// 			data: 1
// 		},
// 		{
// 			label: 'JavaScript',
// 			kind: CompletionItemKind.Text,
// 			data: 2
// 		}
// 	]
// });

// // This handler resolve additional information for the item selected in
// // the completion list.
// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
// 	if (item.data === 1) {
// 		item.detail = 'TypeScript details',
// 			item.documentation = 'TypeScript documentation'
// 	} else if (item.data === 2) {
// 		item.detail = 'JavaScript details',
// 			item.documentation = 'JavaScript documentation'
// 	}
// 	return item;
// });

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

connection.onExecuteCommand(async params => {
  if (params.command === EXPORT_CONTENT_COMMAND) {
    if (!params.arguments) {
      return;
    }
    const args = params.arguments[0] as ExportContentArgs;
    await exportContent(argdownEngine, args);
  } else if (params.command === EXPORT_DOCUMENT_COMMAND) {
    connection.console.log("EXPORT_DOCUMENT_COMMAND received");
    if (!params.arguments) {
      return;
    }
    const args = params.arguments[0] as ExportDocumentArgs;
    connection.console.log("args.target: " + args.target.toString());
    await exportDocument(argdownEngine, args);
  } else if (params.command === RUN_COMMAND) {
    if (!workspaceFolders || workspaceFolders.length == 0) {
      connection.console.log("No workspace folder found.");
    }
    for (var workspaceFolder of workspaceFolders) {
      let settings = await getDocumentSettings(workspaceFolder.uri);
      let rootPath = Uri.parse(workspaceFolder.uri).fsPath;
      if (!settings.configFile || settings.configFile === "") {
        return;
      }
      let configPath = path.resolve(rootPath, settings.configFile);
      let config = argdownEngine.loadConfig(configPath);
      if (config !== null) {
        if (!config.rootPath) {
          config.rootPath = rootPath;
        }
        await argdownEngine.load(config);
      }
    }
  }
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
