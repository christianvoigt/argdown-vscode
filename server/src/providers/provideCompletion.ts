import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit
} from "vscode-languageserver";
const statementPattern = /\[([^\[]+?)\]$/;
const argumentPattern = /<([^<]+?)>$/;
export const provideCompletion = (
  response: any,
  char: string,
  position: Position,
  text: string,
  offset: number
) => {
  const range = Range.create(
    position.line,
    position.character - 1,
    position.line,
    position.character + 1
  );
  if (char === "[") {
    return Object.keys(response.statements).map((k: any) => {
      const eqClass = response.statements[k];
      const title = eqClass.title;
      const item = CompletionItem.create(`[${title}]`);
      item.textEdit = TextEdit.replace(range, `[${title}]`);
      item.kind = CompletionItemKind.Variable;
      item.detail = eqClass.getCanonicalText();
      return item;
    });
  } else if (char === "<") {
    return Object.keys(response.arguments).map((k: any) => {
      const argument = response.arguments[k];
      const title = argument.title;
      const item = CompletionItem.create(`<${title}>`);
      item.textEdit = TextEdit.replace(range, `<${title}>`);
      item.kind = CompletionItemKind.Variable;
      const desc = argument.getCanonicalDescription();
      if (desc) {
        item.detail = desc.text;
      }
      return item;
    });
  } else if (char === ":") {
    const textBefore = text.slice(0, offset - 1);
    const statementMatch = textBefore.match(statementPattern);
    if (statementMatch && statementMatch.length > 1) {
      const title = statementMatch[1];
      const eqClass = response.statements[title];
      return eqClass.members.map((member: any) => {
        const item = CompletionItem.create(member.text);
        item.kind = CompletionItemKind.Value;
        item.detail = `[${title}]: ${member.text}`;
        item.insertText = ` ${member.text}
`;
        return item;
      });
    } else {
      const argumentMatch = textBefore.match(argumentPattern);
      if (argumentMatch && argumentMatch.length > 1) {
        const title = argumentMatch[1];
        const argument = response.arguments[title];
        if (argument.descriptions) {
          return argument.descriptions.map((member: any) => {
            const item = CompletionItem.create(member.text);
            item.kind = CompletionItemKind.Value;
            item.detail = `<${title}>: ${member.text}`;
            item.insertText = ` ${member.text}
`;
            item.kind = CompletionItemKind.Value;
            return item;
          });
        }
      }
    }
  } else if (char === "#" && response.tagsDictionary) {
    return Object.keys(response.tagsDictionary).map((t: any) => {
      const item = CompletionItem.create(`#(${t})`);
      item.insertText = `(${t})`;
      item.kind = CompletionItemKind.Keyword;
      return item;
    });
  }
  return [];
};
