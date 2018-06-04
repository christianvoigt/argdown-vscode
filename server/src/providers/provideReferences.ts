import { Location, Position, ReferenceContext } from "vscode-languageserver";
import { createLocation } from "./utils";
import { IArgdownNode } from "./IArgdownNode";
import { findReferences } from "./findReferences";

export const provideReferences = (
  response: any,
  uri: string,
  position: Position,
  context?: ReferenceContext
): Location[] => {
  const line = position.line + 1;
  const character = position.character + 1;
  const includeDeclaration = context ? context.includeDeclaration : true;
  const nodes = findReferences(response, line, character, includeDeclaration);
  return nodes.map((n: IArgdownNode) => createLocation(uri, n));
};
