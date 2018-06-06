import * as vscode from "vscode";
import * as path from "path";
import { ArgdownPreviewConfiguration } from "./ArgdownPreviewConfiguration";
import { findElementAtPositionPlugin } from "./FindElementAtPositionPlugin";
const argdownCli = require("argdown-cli");
const app = argdownCli.app;
const mapMakerPlugin = app.getPlugin("MapMaker", "export-json");
app.addPlugin(mapMakerPlugin, "build-map");
app.addPlugin(findElementAtPositionPlugin, "find-element-at-position");

export class ArgdownEngine {
  public constructor() {}
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
  public async getMapNodeId(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration,
    line: number,
    character: number
  ): Promise<string> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      findElementAtPosition: {
        line: line + 1,
        character: character + 1
      },
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "build-map",
        "find-element-at-position"
      ]
    };
    const response = await app.runAsync(request);
    if (response.elementAtPosition && response.elementAtPositionType) {
      const title = response.elementAtPosition.title;
      const elementType = response.elementAtPositionType;
      const node = this.findNodeInMapNodeTree(
        response.map.nodes,
        (n: any) => n.title === title && n.type === elementType
      );
      return node.id || "";
    }
    return "";
  }
  public async getRangeOfHeading(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration,
    headingText: string
  ): Promise<vscode.Range> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      process: ["preprocessor", "parse-input", "build-model"]
    };
    const response = await app.runAsync(request);
    if (!response.sections || response.sections.length == 0) {
      return new vscode.Range(0, 0, 0, 0);
    }
    const section = this.findSection(response.sections, headingText);
    if (section) {
      return new vscode.Range(
        section.startLine - 1,
        section.startColumn - 1,
        section.startLine - 1,
        section.startColumn - 1
      );
    }
    return new vscode.Range(0, 0, 0, 0);
  }
  private findSection(sections: any[], headingText: string): any | null {
    for (let section of sections) {
      if (section.title === headingText) {
        return section;
      }
      if (section.children) {
        const descSection = this.findSection(section.children, headingText);
        if (descSection) {
          return descSection;
        }
      }
    }
    return null;
  }
  public async getRangeOfMapNode(
    doc: vscode.TextDocument,
    config: ArgdownPreviewConfiguration,
    id: string
  ): Promise<vscode.Range> {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      process: ["preprocessor", "parse-input", "build-model", "build-map"]
    };
    const response = await app.runAsync(request);
    const node = this.findNodeInMapNodeTree(
      response.map.nodes,
      (n: any) => n.id === id
    );
    if (node && node.type === "argument") {
      const argument = response.arguments[node.title];
      const desc = argument.getCanonicalDescription();
      if (desc) {
        return new vscode.Range(
          desc.startLine - 1,
          desc.startColumn - 1,
          desc.endLine - 1,
          desc.endColumn
        );
      }
    } else if (node && node.type === "statement") {
      const eqClass = response.statements[node.title];
      const statement = eqClass.getCanonicalStatement();
      if (statement) {
        return new vscode.Range(
          statement.startLine - 1,
          statement.startColumn - 1,
          statement.endLine - 1,
          statement.endColumn
        );
      }
    }
    return new vscode.Range(0, 0, 0, 0);
  }
  private findNodeInMapNodeTree(
    nodes: any[],
    handler: (n: any) => boolean
  ): any | null {
    for (let node of nodes) {
      if (handler(node)) {
        return node;
      }
      if (node.nodes) {
        const result = this.findNodeInMapNodeTree(node.nodes, handler);
        if (result) {
          return result;
        }
      }
    }
    return null;
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
