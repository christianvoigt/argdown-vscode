import Uri from "vscode-uri";
interface IDictionary<T> {
  [Key: string]: T;
}

export interface ExportContentArgs {
  content: string;
  target: Uri;
  process: string;
}
export interface ExportDocumentArgs {
  source: Uri;
  target: Uri;
  process: string;
}
const requestProviders: IDictionary<(r: any) => any> = {
  "vizjs-to-svg": r => {
    return {
      ...r,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-dot",
        "export-svg",
        "save-svg-as-svg"
      ]
    };
  },
  "vizjs-to-pdf": r => {
    return {
      ...r,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-dot",
        "export-svg",
        "save-svg-as-pdf"
      ]
    };
  },
  "dagre-to-pdf": r => {
    return {
      ...r,
      process: ["save-svg-as-pdf"]
    };
  },
  dot: r => {
    return {
      ...r,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-dot",
        "save-as-dot"
      ]
    };
  },
  html: r => {
    return {
      ...r,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-html",
        "save-as-html",
        "copy-default-css"
      ]
    };
  },
  json: r => {
    return {
      ...r,
      process: [
        "preprocessor",
        "parse-input",
        "build-model",
        "export-json",
        "save-as-json"
      ]
    };
  }
};
export const exportContent = async (
  argdownEngine: any,
  args: ExportContentArgs
) => {
  let request: any = {};
  if (args.process === "vizjs-to-pdf") {
    request.outputPath = args.target.fsPath;
    const getRequest = requestProviders[args.process];
    request = getRequest(request);
    const response = {
      svg: args.content
    };
    await argdownEngine.runAsync(request, response);
  } else {
    request.input = args.content;
    request.outputPath = args.target.fsPath;
    const getRequest = requestProviders[args.process];
    request = getRequest(request);
    await argdownEngine.runAsync(request);
  }
};
export const exportDocument = async (
  argdownEngine: any,
  args: ExportDocumentArgs
) => {
  let request: any = { logLevel: "verbose" };
  request.inputPath = args.source.fsPath;
  request.outputPath = args.target.fsPath;
  const getRequest = requestProviders[args.process];
  request = getRequest(request);
  await argdownEngine.load(request);
};
