import {Logger} from "./Logger";
const argdownCli = require("argdown-cli");
const app = argdownCli.app;


export class ArgdownEngine{
    public constructor(private _logger:Logger){
        this._logger.log("Argdown Engine constructed.");
        // app.logger.log = (_: any, message: string)=> {
        //     logger.log(message);
        //   };
    }
    public async exportHtml(input:string):Promise<string>{
        const request = {
            input: input,
            process: ["preprocessor", "parse-input", "build-model", "export-html"],
            html: {
                headless: true
            }
        };
        const response = await app.runAsync(request);
        return response.html;
    }
    public async exportJson(input:string):Promise<string>{
        const request = {
            input: input,
            process: ["preprocessor", "parse-input", "build-model", "export-json"]
        };
        const response = await app.runAsync(request);
        this._logger.log(response.json);
        return response.json;
    }
    public async exportVizjs(input:string):Promise<string>{
        const request = {
            input: input,
            process: ["preprocessor", "parse-input", "build-model", "export-dot", "export-svg"],
            html: {
                headless: true
            }
        };
        const response = await app.runAsync(request);
        return response.svg;
    }
}