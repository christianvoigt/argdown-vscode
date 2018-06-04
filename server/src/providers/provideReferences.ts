import { Location, Position, ReferenceContext } from "vscode-languageserver";
import { createLocation } from "./utils";
import { IArgdownNode } from "./IArgdownNode";
import { findReferences } from "./findReferences";
import { findNodeAtPosition } from "./findNodeAtPosition";

export const provideReferences = (
  response: any,
  uri: string,
  position: Position,
  context?: ReferenceContext
): Location[] => {
  const line = position.line + 1;
  const character = position.character + 1;
  const includeDeclaration = context ? context.includeDeclaration : true;
  const nodeAtPosition = findNodeAtPosition(response, line, character);
  const nodes = findReferences(response, nodeAtPosition, includeDeclaration);
  return nodes.map((n: IArgdownNode) => createLocation(uri, n));
};
