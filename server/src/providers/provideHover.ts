import { Hover, Position } from "vscode-languageserver";
import { findNodesContainingPosition } from "./findNodesContainingPosition";
import {generateMarkdownForArgument, generateMarkdownForStatement} from "./utils";
export const provideHover = (response: any, position: Position) => {
  const line = position.line + 1;
  const character = position.character + 1;
  const nodes = findNodesContainingPosition(
    response.ast.children,
    line,
    character
  );
  const nodeAtPosition = nodes.reverse().find(n => {
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
  if (nodeAtPosition) {
    if (nodeAtPosition.tokenType.tokenName.startsWith("Statement")) {
      const eqClass = response.statements[nodeAtPosition.title];
      return <Hover>{
        contents: generateMarkdownForStatement(eqClass)
      };
    } else {
      const argument = response.arguments[nodeAtPosition.title];
      return <Hover>{
        contents: generateMarkdownForArgument(argument)
      };
    }
  }
  return <Hover>{};
};
