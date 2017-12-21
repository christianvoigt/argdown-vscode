'use strict';
import * as path from 'path';
import Uri from 'vscode-uri';
import { IArgdownSettings } from '../IArgdownSettings'
export function exportHtml(argdownApp:any, settings:IArgdownSettings, rootPath:string){
    let settingsInputPath = Uri.parse(settings.htmlExportInput).fsPath;
    let inputPath = path.resolve(rootPath, settingsInputPath);

    let config: any = {};
    if (settings.configFile && settings.configFile !== "") {
        let configPath = path.resolve(rootPath, settings.configFile);
        config = argdownApp.loadConfig(configPath);
    }
    if (!config.rootPath) {
        config.rootPath = rootPath;
    }
    config.html = config.html || config.HtmlExport || {};
    config.input = inputPath;
    config.saveAs = config.saveAs || config.SaveAsFilePlugin;
    if (!config.saveAs || !config.saveAs.outputDir) {
        let outputDirectory = path.resolve(rootPath, settings.htmlDirectory);
        config.saveAs = {};
        config.saveAs.outputDir = outputDirectory;
    } else {
        config.saveAs.outputDir = path.resolve(rootPath, config.saveAs.outputDir)
    }
    config.process = ['preprocessor', 'parse-input'];
    if (config.logParserErrors) {
        config.process.push("log-parser-errors");
    }
    config.process.push('build-model')
    config.process.push('export-html');
    config.process.push('save-as-html');

    if (!config.html.css) {
        config.process.push('copy-default-css');
    }
    argdownApp.load(config);     
}