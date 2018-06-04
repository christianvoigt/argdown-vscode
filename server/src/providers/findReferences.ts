import { IArgdownNode } from "./IArgdownNode";
import { walkTree } from "./utils";
/**
 * Finds all references in an Argdown AST to statements, arguments and tags.
 * For statements and arguments this includes definitions, references and mentions.
 **/
export const findReferences = (
  response: any,
  nodeAtPosition: IArgdownNode,
  includeDeclaration: boolean
): IArgdownNode[] => {
  const references = <IArgdownNode[]>[];
  if (nodeAtPosition) {
    const refersToStatement = nodeAtPosition.tokenType.tokenName.startsWith(
      "Statement"
    );
    const refersToArgument = nodeAtPosition.tokenType.tokenName.startsWith(
      "Argument"
    );
    const refersToTag = nodeAtPosition.tokenType.tokenName === "Tag";
    // const isArgument = nodeAtPosition.tokenType.tokenName.startsWith(
    //   "Argument"
    // );
    let tokenStart: string;
    let nodeId: string;
    if (refersToStatement) {
      nodeId = nodeAtPosition.title;
      tokenStart = "Statement";
      if (!nodeId && nodeAtPosition.statement) {
        nodeId = nodeAtPosition.statement.title;
      }
    } else if (refersToArgument) {
      nodeId = nodeAtPosition.title;
      tokenStart = "Argument";
      if (!nodeId && nodeAtPosition.argument) {
        nodeId = nodeAtPosition.argument.title;
      }
    } else if (refersToTag) {
      tokenStart = "Tag";
      nodeId = nodeAtPosition.tag;
    }
    walkTree(response.ast, null, 0, (node: IArgdownNode) => {
      if (node.tokenType && node.tokenType.tokenName.startsWith(tokenStart)) {
        let matches = false;
        if (refersToArgument || refersToStatement) {
          matches = node.title === nodeId;
        } else if (refersToTag) {
          matches = node.tag === nodeId;
        }
        if (
          matches &&
          (includeDeclaration ||
            !node.tokenType.tokenName.endsWith("Definition"))
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
