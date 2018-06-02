import { Location, SymbolKind, SymbolInformation } from "vscode-languageserver";
import Uri from "vscode-uri";

export const enum ArgdownSymbolKind {
  PCS,
  ArgumentDefinition,
  StatementDefinition,
  Heading
}

export class ArgdownSymbolInformation implements SymbolInformation {
  public name: string;
  public kind: SymbolKind;
  public location: Location;
  public argdownKind: ArgdownSymbolKind;
  public argdownId: string;
}

const addSymbol = (
  {},
  response: any,
  node: any,
  name: string,
  argdownKind: ArgdownSymbolKind,
  argdownId: string
) => {
  const symbolInfo: ArgdownSymbolInformation = {
    name,
    kind: SymbolKind.Variable,
    argdownKind,
    argdownId,
    location: {
      uri: response.inputUri,
      range: {
        start: { line: node.startLine - 1, character: node.startColumn - 1 },
        end: { line: node.endLine - 1, character: node.endColumn }
      }
    }
  };
  response.documentSymbols.push(symbolInfo);
};
export const documentSymbolsPlugin = {
  name: "DocumentSymbolsPlugin",
  prepare: (request: any, response: any) => {
    response.inputUri = Uri.file(request.inputPath).toString();
  },
  argdownListeners: {
    argdownEntry: ({}, response: any) => {
      response.documentSymbols = <SymbolInformation[]>[];
    },
    ArgumentDefinitionEntry: (request: any, response: any, node: any) => {
      addSymbol(
        request,
        response,
        node,
        `<${node.title}>`,
        ArgdownSymbolKind.ArgumentDefinition,
        node.title
      );
    },
    argumentEntry: (request: any, response: any, node: any) => {
      addSymbol(
        request,
        response,
        node,
        `PCS <${node.argument.title}>`,
        ArgdownSymbolKind.PCS,
        node.argument.title
      );
    },
    StatementDefinitionEntry: (request: any, response: any, node: any) => {
      addSymbol(
        request,
        response,
        node,
        `[${node.title}]`,
        ArgdownSymbolKind.StatementDefinition,
        node.title
      );
    },
    headingEntry: (request: any, response: any, node: any) => {
      const sectionId = node.section ? node.section.id : node.text;
      addSymbol(
        request,
        response,
        node,
        `${node.children[0].image}${node.text}`,
        ArgdownSymbolKind.Heading,
        sectionId
      );
    }
  }
};
