import { Location, Range } from "vscode-languageserver";
import { Argument } from "argdown-parser";
import { IArgdownNode } from "./IArgdownNode";

export const createLocation = (uri: string, el: IArgdownNode): Location => {
  return Location.create(uri, createRange(el));
};

/**
 *  Creates a range from an Argdown node, statement or argument
 * Chevrotain locations have to be transformed to VS Code locations
 **/
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

export const generateMarkdownForStatement = (eqClass: any): string => {
  let relationsStr = "";
  if (eqClass.relations) {
    for (let relation of eqClass.relations) {
      const isOutgoing = relation.to === eqClass;
      const relationSymbol = getRelationSymbol(relation.type, isOutgoing);
      const relationPartner = isOutgoing ? relation.from : relation.to;
      const relationPartnerStr =
        relationPartner instanceof Argument
          ? `<${relationPartner.title}>`
          : `[${relationPartner.title}]`;
      relationsStr += `
  ${relationSymbol} ${relationPartnerStr}`;
    }
  }
  return `
\`\`\`argdown
[${eqClass.title}]: ${eqClass.getCanonicalText()}${relationsStr}
\`\`\``;
};
export const generateMarkdownForArgument = (argument: any): string => {
  let relationsStr = "";
  if (argument.relations) {
    for (let relation of argument.relations) {
      const isOutgoing = relation.to === argument;
      const relationSymbol = getRelationSymbol(relation.type, isOutgoing);
      const relationPartner = isOutgoing ? relation.from : relation.to;
      const relationPartnerStr =
        relationPartner instanceof Argument
          ? `<${relationPartner.title}>`
          : `[${relationPartner.title}]`;
      relationsStr += `
  ${relationSymbol} ${relationPartnerStr}`;
    }
  }
  const descObj = argument.getCanonicalDescription();
  const desc = descObj ? ": " + descObj.text : "";
  return `
\`\`\`argdown
<${argument.title}>${desc}${relationsStr}
\`\`\``;
};
const relationSymbols: { [key: string]: string } = {
  support: "+",
  attack: "-",
  entails: "+",
  contrary: "-",
  undercut: "_",
  contradictory: "><"
};
const getRelationSymbol = (
  relationType: string,
  isOutgoing: boolean
): string => {
  let symbol = relationSymbols[relationType];
  if (relationType !== "contradictory") {
    if (isOutgoing) {
      symbol = `<${symbol}`;
    } else {
      symbol = `${symbol}>`;
    }
  }
  return symbol;
};
