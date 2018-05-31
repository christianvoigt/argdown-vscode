import * as vscode from "vscode";

export class ArgdownPreviewConfiguration {
  public static getForResource(resource: vscode.Uri) {
    return new ArgdownPreviewConfiguration(resource);
  }

  public readonly scrollBeyondLastLine: boolean;
  public readonly doubleClickToSwitchToEditor: boolean;
  public readonly scrollEditorWithPreview: boolean;
  public readonly scrollPreviewWithEditor: boolean;
  public readonly markEditorSelection: boolean;

  public readonly lineHeight: number;
  public readonly fontSize: number;
  public readonly fontFamily: string | undefined;
  public readonly lockMenu: boolean;
  public readonly view: string;
  public readonly styles: string[];

  private constructor(resource: vscode.Uri) {
    const editorConfig = vscode.workspace.getConfiguration("editor", resource);
    const argdownConfig = vscode.workspace.getConfiguration(
      "argdown",
      resource
    );

    this.scrollBeyondLastLine = editorConfig.get<boolean>(
      "scrollBeyondLastLine",
      false
    );
    this.scrollPreviewWithEditor = !!argdownConfig.get<boolean>(
      "preview.scrollPreviewWithEditor",
      true
    );
    this.scrollEditorWithPreview = !!argdownConfig.get<boolean>(
      "preview.scrollEditorWithPreview",
      true
    );
    this.doubleClickToSwitchToEditor = !!argdownConfig.get<boolean>(
      "preview.doubleClickToSwitchToEditor",
      true
    );
    this.markEditorSelection = !!argdownConfig.get<boolean>(
      "preview.markEditorSelection",
      true
    );
    this.lockMenu = !!argdownConfig.get<boolean>("preview.lockMenu", true);
    this.view = argdownConfig.get<string>("preview.view", "html");

    this.fontFamily = argdownConfig.get<string | undefined>(
      "preview.fontFamily",
      undefined
    );
    this.fontSize = Math.max(
      8,
      +argdownConfig.get<number>("preview.fontSize", NaN)
    );
    this.lineHeight = Math.max(
      0.6,
      +argdownConfig.get<number>("preview.lineHeight", NaN)
    );

    this.styles = argdownConfig.get<string[]>("styles", []);
  }

  public isEqualTo(otherConfig: ArgdownPreviewConfiguration) {
    for (let key in this) {
      if (this.hasOwnProperty(key) && key !== "styles") {
        if (this[key] !== otherConfig[key]) {
          return false;
        }
      }
    }

    // Check styles
    if (this.styles.length !== otherConfig.styles.length) {
      return false;
    }
    for (let i = 0; i < this.styles.length; ++i) {
      if (this.styles[i] !== otherConfig.styles[i]) {
        return false;
      }
    }

    return true;
  }

  [key: string]: any;
}

export class ArgdownPreviewConfigurationManager {
  private readonly previewConfigurationsForWorkspaces = new Map<
    string,
    ArgdownPreviewConfiguration
  >();

  public loadAndCacheConfiguration(
    resource: vscode.Uri
  ): ArgdownPreviewConfiguration {
    const config = ArgdownPreviewConfiguration.getForResource(resource);
    this.previewConfigurationsForWorkspaces.set(this.getKey(resource), config);
    return config;
  }

  public hasConfigurationChanged(resource: vscode.Uri): boolean {
    const key = this.getKey(resource);
    const currentConfig = this.previewConfigurationsForWorkspaces.get(key);
    const newConfig = ArgdownPreviewConfiguration.getForResource(resource);
    return !currentConfig || !currentConfig.isEqualTo(newConfig);
  }

  private getKey(resource: vscode.Uri): string {
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    return folder ? folder.uri.toString() : "";
  }
}
