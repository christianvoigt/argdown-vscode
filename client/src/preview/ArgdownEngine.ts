import { Logger } from "./Logger";
import * as vscode from "vscode";
import * as path from "path";
import { ArgdownPreviewConfiguration } from "./ArgdownPreviewConfiguration";
const argdownCli = require("argdown-cli");
const app = argdownCli.app;

export class ArgdownEngine {
  public constructor(private _logger: Logger) {
    this._logger.log("Argdown Engine constructed.");
    // app.logger.log = (_: any, message: string)=> {
    //     logger.log(message);
    //   };
  }
  public async exportHtml(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<string> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      process: ["preprocessor", "parse-input", "build-model", "export-html"],
      html: {
        ...argdownConfig.html,
        headless: true
      }
    };
    const response = await app.runAsync(request);
    return response.html;
  }
  public async exportJson(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<string> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      process: ["preprocessor", "parse-input", "build-model", "export-json"]
    };
    const response = await app.runAsync(request);
    this._logger.log(response.json);
    return response.json;
  }
  public async exportVizjs(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<string> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-dot",
        "export-svg"
      ],
      html: {
        ...argdownConfig.html,
        headless: true
      }
    };
    const response = await app.runAsync(request);
    return response.svg;
  }
  public loadConfig(configFile: string | undefined, resource: vscode.Uri): any {
    if (!configFile) {
      return {};
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
    let configPath = configFile;
    if (workspaceFolder) {
      let rootPath = workspaceFolder.uri.fsPath;
      configPath = path.resolve(rootPath, configFile);
    } else if (!path.isAbsolute(configPath)) {
      return {};
    }
    return app.loadConfig(configPath);
  }
}
