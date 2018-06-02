import {
  Location,
  Position,
  Range,
  ReferenceContext
} from "vscode-languageserver";
const walkTree = (
  node: any,
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
  uri: string,
  position: Position,
  context?: ReferenceContext
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
    const references = <Location[]>[];
    const isStatement = nodeAtPosition.tokenType.tokenName.startsWith(
      "Statement"
    );
    const isArgument = nodeAtPosition.tokenType.tokenName.startsWith(
      "Argument"
    );
    const tokenStart = isStatement ? "Statement" : "Argument";
    const includeDeclaration = context ? context.includeDeclaration : true;
    let title = nodeAtPosition.title;
    if (!title && nodeAtPosition.argument) {
      title = nodeAtPosition.argument.title;
    }
    if (!title && nodeAtPosition.statement) {
      title = nodeAtPosition.statement.title;
    }
    walkTree(response.ast, null, 0, (node: any) => {
      if (
        node.tokenType &&
        node.tokenType.tokenName.startsWith(tokenStart) &&
        node.title === title
      ) {
        if (
          includeDeclaration ||
          !node.tokenType.tokenName.endsWith("Definition")
        ) {
          references.push(createLocation(uri, node));
        }
      }
      if (
        isArgument &&
        node.name === "argument" &&
        node.argument.title === title &&
        includeDeclaration
      ) {
        references.push(createLocation(uri, node));
      }
    });
    return references;
  }
  return [];
};
export const findDefinitions = (
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
export const createLocation = (
  uri: string,
  el: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  }
): Location => {
  return Location.create(uri, createRange(el));
};
export const createRange = (el: {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}): Range => {
  return Range.create(
    el.startLine - 1,
    el.startColumn - 1,
    el.endLine - 1,
    el.endColumn
  );
};
export const findNodesContainingPosition = (
  nodes: any[],
  line: number,
  character: number
): any[] => {
  let result = [];
  const closestNode = nodes
    .filter((n: any) => {
      return (
        !n.tokenType ||
        (n.tokenType.tokenName !== "Indent" &&
          n.tokenType.tokenName !== "Dedent")
      );
    })
    .filter((n: any) => {
      return n.endLine >= line && n.startLine <= line;
    })
    .reduce((acc: any, val: any) => {
      if (!acc) {
        return val;
      }
      const valLineDist = line - val.startLine;
      const accLineDist = line - acc.startLine;
      if (valLineDist < accLineDist) {
        return val;
      } else if (accLineDist < valLineDist) {
        return acc;
      } else {
        // acc & val start at the same line
        if (acc.startLine === line) {
          const valCharDistance = character - val.startColumn;
          const accCharDist = character - acc.startColumn;
          return valCharDistance < accCharDist && valCharDistance >= 0
            ? val
            : acc;
        } else {
          return val.startColumn > acc.startColumn ? val : acc;
        }
      }
    });
  if (closestNode) {
    result.push(closestNode);
    if (closestNode.children && closestNode.children.length > 0) {
      result.push(
        ...findNodesContainingPosition(closestNode.children, line, character)
      );
    }
  }
  return result;
};
