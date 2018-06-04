import {
  Position,
  TextDocumentIdentifier,
  TextEdit,
  WorkspaceEdit
} from "vscode-languageserver";
import { createRange } from "./utils";
import { IArgdownNode } from "./IArgdownNode";
import { findReferences } from "./findReferences";
const createTextEdit = (
  node: IArgdownNode,
  newName: string
): TextEdit | null => {
  if (node.tokenType) {
    switch (node.tokenType.tokenName) {
      case "ArgumentReference":
        return TextEdit.replace(createRange(node), `<${newName}>`);
      case "ArgumentDefinition":
        return TextEdit.replace(createRange(node), `<${newName}>:`);
      case "ArgumentMention":
        return TextEdit.replace(createRange(node), `@<${newName}>`);
      case "StatementReference":
        return TextEdit.replace(createRange(node), `[${newName}]`);
      case "StatementDefinition":
        return TextEdit.replace(createRange(node), `[${newName}]:`);
      case "StatementMention":
        return TextEdit.replace(createRange(node), `@[${newName}]`);
    }
  }
  return null;
};
export const provideRenameWorkspaceEdit = (
  response: any,
  newName: string,
  position: Position,
  textDocument: TextDocumentIdentifier,
  connection: any
): WorkspaceEdit => {
  const line = position.line + 1;
  const character = position.character + 1;
  const nodes: IArgdownNode[] = findReferences(response, line, character, true);
  if (nodes) {
    const edits = nodes
      .map((n: IArgdownNode) => createTextEdit(n, newName))
      .filter(e => e !== null);
    const wsEdit: WorkspaceEdit = {
      changes: {}
    };
    wsEdit.changes[textDocument.uri] = edits;
    connection.console.log(JSON.stringify(wsEdit));
    return wsEdit;
  }
  return {};
};
