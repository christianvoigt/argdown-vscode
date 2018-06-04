import { findNodesContainingPosition } from "./findNodesContainingPosition";
import { IArgdownNode } from "./IArgdownNode";
/**
 *
 * Returns the smallest node containing the position, if the node is of one of the following types:
 * * ArgumentReference
 * * ArgumentDefinition
 * * ArgumentMention
 * * StatementReference
 * * StatementDefinition
 * * StatementMention
 * * Tag
 *
 * Otherwise returns null.
 *
 * @param response The response from the argdownEngine containing an AST
 * @param line the position's line (one-based). This is one-based so if coming from VS Code, add 1.
 * @param character the position's character. This is one-based so if coming from VS Code, add 1.
 */
export const findNodeAtPosition = (
  response: any,
  line: number,
  character: number
): IArgdownNode | null => {
  const containingNodes: any[] = findNodesContainingPosition(
    response.ast.children,
    line,
    character
  );
  return containingNodes.reverse().find(n => {
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
      case "Tag":
        return true;
    }
    return false;
  });
};
