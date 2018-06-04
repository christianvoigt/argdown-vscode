import { Location, Position } from "vscode-languageserver";
import { findNodesContainingPosition } from "./findNodesContainingPosition";
import { createLocation } from "./utils";

export const provideDefinitions = (
  response: any,
  uri: string,
  position: Position
): Location[] => {
  const line = position.line + 1;
  const character = position.character + 1;
  const nodes: any[] = findNodesContainingPosition(
    response.ast.children,
    line,
    character
  );
  nodes.map(n => {
    return n;
  });
  const node = nodes.reverse().find(n => {
    if (!n.tokenType) {
      return false;
    }
    switch (n.tokenType.tokenName) {
      case "StatementReference":
      case "StatementDefinition":
      case "StatementMention":
      case "ArgumentReference":
      case "ArgumentDefinition":
      case "ArgumentMention":
        return true;
    }
    return false;
  });
  if (node) {
    if (node.tokenType.tokenName.startsWith("Statement")) {
      // collect locations of all equivalenceClass members
      const equivalenceClass = response.statements[node.title];
      const definitions: Location[] = equivalenceClass.members.map((m: any) => {
        return createLocation(uri, m);
      });
      return definitions;
    } else if (node.tokenType.tokenName.startsWith("Argument")) {
      // collect locations of pcs and all descriptions
      const argument = response.arguments[node.title];
      const definitions: Location[] = argument.descriptions.map((d: any) => {
        return createLocation(uri, d);
      });
      if (argument.pcs && argument.pcs.length > 0) {
        const pcsLocation: Location = createLocation(uri, argument);
        definitions.push(pcsLocation);
      }
      return definitions;
    }
  }
  return [];
};
