import { findNodesContainingPosition } from "./findNodesContainingPosition";
import { IArgdownNode } from "./IArgdownNode";
const walkTree = (
  node: IArgdownNode,
  parentNode: any,
  childIndex: number,
  callback: (node: any, parentNode: any, childIndex: number) => void
) => {
  callback(node, parentNode, childIndex);
  if (node.children && node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      let child = node.children[i];
      walkTree(child, node, i, callback);
    }
  }
};
export const findReferences = (
  response: any,
  line: number,
  character: number,
  includeDeclaration: boolean
): IArgdownNode[] => {
  const references = <IArgdownNode[]>[];
  const containingNodes: any[] = findNodesContainingPosition(
    response.ast.children,
    line,
    character
  );
  const nodeAtPosition = containingNodes.reverse().find(n => {
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
    const isStatement = nodeAtPosition.tokenType.tokenName.startsWith(
      "Statement"
    );
    // const isArgument = nodeAtPosition.tokenType.tokenName.startsWith(
    //   "Argument"
    // );
    const tokenStart = isStatement ? "Statement" : "Argument";
    let title = nodeAtPosition.title;
    if (!title && nodeAtPosition.argument) {
      title = nodeAtPosition.argument.title;
    }
    if (!title && nodeAtPosition.statement) {
      title = nodeAtPosition.statement.title;
    }
    walkTree(response.ast, null, 0, (node: IArgdownNode) => {
      if (
        node.tokenType &&
        node.tokenType.tokenName.startsWith(tokenStart) &&
        node.title === title
      ) {
        if (
          includeDeclaration ||
          !node.tokenType.tokenName.endsWith("Definition")
        ) {
          references.push(node);
        }
      }
      // if (
      //   isArgument &&
      //   node.name === "argument" &&
      //   node.argument.title === title &&
      //   includeDeclaration
      // ) {
      //   references.push(node);
      // }
    });
  }
  return references;
};
