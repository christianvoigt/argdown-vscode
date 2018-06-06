const settings = { line: 0, character: 0 };
const positionIsInRange = (node: any) => {
  if (node.startLine > settings.line || node.endLine < settings.line) {
    return false;
  }
  return (
    (node.startLine !== settings.line ||
      node.startColumn <= settings.character) &&
    (node.endLine !== settings.line || node.endColumn >= settings.character)
  );
};
export const findElementAtPositionPlugin = {
  name: "FindElementAtPositionPlugin",
  prepare: (request: any) => {
    settings.line = request.findElementAtPosition
      ? request.findElementAtPosition.line
      : 0;
    settings.character = request.findElementAtPosition
      ? request.findElementAtPosition.character
      : 0;
  },
  argdownListeners: {
    ArgumentReferenceEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const argument = response.arguments[node.title];
        response.elementAtPosition = argument;
        response.elementAtPositionType = "argument";
      }
    },
    ArgumentMentionEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const argument = response.arguments[node.title];
        response.elementAtPosition = argument;
        response.elementAtPositionType = "argument";
      }
    },
    ArgumentDefinitionEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const statement = response.arguments[node.title];
        response.elementAtPosition = statement;
        response.elementAtPositionType = "argument";
      }
    },
    StatementReferenceEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const statement = response.statements[node.title];
        response.elementAtPosition = statement;
        response.elementAtPositionType = "statement";
      }
    },
    StatementMentionEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const statement = response.statements[node.title];
        response.elementAtPosition = statement;
        response.elementAtPositionType = "statement";
      }
    },
    StatementDefinitionEntry: ({}, response: any, node: any) => {
      if (positionIsInRange(node)) {
        const statement = response.statements[node.title];
        response.elementAtPosition = statement;
        response.elementAtPositionType = "statement";
      }
    }
  }
};
