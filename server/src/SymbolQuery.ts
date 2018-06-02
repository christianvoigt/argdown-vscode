import { Location, Position, Range } from "vscode-languageserver";
export const findDefinitions = (
  response: any,
  uri: string,
  position: Position,
  connection: any
): Location[] => {
  const line = position.line + 1;
  const character = position.character + 1;
  const nodes: any[] = findNodesContainingPosition(
    response.ast.children,
    line,
    character,
    connection
  );
  connection.console.log("nodes: " + nodes.length);
  nodes.map(n => {
    if (n.tokenType) {
      connection.console.log("Node: " + n.tokenType.tokenName);
    } else {
      connection.console.log("Node: " + n.name);
    }
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
  connection.console.log("node: " + JSON.stringify(node));
  if (node) {
    if (node.tokenType.tokenName.startsWith("Statement")) {
      // collect locations of all equivalenceClass members
      const equivalenceClass = response.statements[node.title];
      const definitions: Location[] = equivalenceClass.members.map((m: any) => {
        const range = createRange(m);
        return Location.create(uri, range);
      });
      return definitions;
    } else if (node.tokenType.tokenName.startsWith("Argument")) {
      // collect locations of pcs and all descriptions
      const argument = response.arguments[node.title];
      const definitions: Location[] = argument.descriptions.map((d: any) => {
        connection.console.log("Description: " + JSON.stringify(d));
        const range = createRange(d);
        return Location.create(uri, range);
      });
      if (argument.pcs && argument.pcs.length > 0) {
        connection.console.log("Argument: " + JSON.stringify(argument));
        const range = createRange(argument);
        const pcsLocation: Location = Location.create(uri, range);
        definitions.push(pcsLocation);
      }
      return definitions;
    }
  }
  return [];
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
  character: number,
  connection: any
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
        ...findNodesContainingPosition(
          closestNode.children,
          line,
          character,
          connection
        )
      );
    }
  }
  return result;
};
