import { TemplateMaker } from "ap-shared-core/out/template/TemplateMaker.js";
import { type IFileDeclarationTypesMap } from "ap-shared-core/out/uc-control/configResources.js";
import { ucUtil } from "ap-shared-core/out/uc-control/ucUtil.js";
import { CommonRow } from "ap-shared-core/out/uc-dev/buildRow.js";
import { ensureDirectoryExistence, relativeFilePath, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, normalize, resolve } from "path";
import { fileURLToPath } from "url";
import { BuildingProcess } from "../BuildingProcess.js";
import { ResourceBuildEngine } from "./ResourceBuildEngine.js";
import { cliMain } from "../../utils/cliMain.js";

interface CodeFilesNode {
    DESIGNER: string,
    CODE: string,
    STYLE: string,
}
interface TNode {
    HTML: string,
    STYLE: string,
}
interface BaseTypeNode {
    UC: CodeFilesNode,
    TPT: CodeFilesNode,
}

interface SourceTypeNode {
    JS: BaseTypeNode,
    TS: BaseTypeNode,
}

export class commonGeneratorX {
    rows: CommonRow[] = [];
    tMaker = new TemplateMaker();
    constructor() { }

    static readTemplate(tptFileName: string) {
        //const cpath = fileURLToPath(import.meta.url);        
        let fpath = resolveFilePath(import.meta.url, `templates/${tptFileName}`);//resolve(dirname(cpath), join(cliMain.TEMPLATE_DIR, tptFileName));
        const data = readFileSync(fpath, 'utf-8');
        return data;
    }
    static templateUnMapped = new Map<string, Function>();
    filex(tptFileName: string) {
        //let tptFileName = `${type}${extType}${fileType}`;
        if (commonGeneratorX.templateUnMapped.has(tptFileName))
            return commonGeneratorX.templateUnMapped.get(tptFileName);
        else {
            const data = commonGeneratorX.readTemplate(tptFileName);
            const _fn = this.tMaker.compileTemplate(data);
            commonGeneratorX.templateUnMapped.set(tptFileName, _fn);
            return _fn;
        }
    }
    generateFiles() {
        let _this = this;
        let _data = "";
        BuildingProcess.FILE_COUNT_OF_PREV_BUILD = this.rows.length;
        if (this.generateResources()) {
            if (this.rows.length == 0) {
                console.log(`NO FILE TO GENERATE`);

                return;
            }
            const pref = this.rows[0]?.src.callerProject.config.preference;
            let dirDeclaration = pref?.dirDeclaration;
            const declareEntries = Object.entries(dirDeclaration);
            
            for (let i = 0, len = this.rows.length; i < len; i++) {
                const row = this.rows[i];
                let uctype = row.src.extCode;
                let codeFileSrctype: keyof IFileDeclarationTypesMap = 'code',
                    designerFileSrctype: keyof IFileDeclarationTypesMap = 'designer';
                for (const [decName, fTypeInfo] of declareEntries) {
                    if (decName == 'out') continue;
                    let srctype = 'ts';

                    ensureDirectoryExistence(row.src.pathOf[designerFileSrctype]);
                    _data = this.filex(`${srctype}${uctype}.designer`)(row);
                    writeFileSync(row.src.pathOf[designerFileSrctype], _data);

                    if (uctype == '.uc') {
                        _data = this.filex(`js${uctype}.designer`)(row);
                        writeFileSync(ucUtil.changeExtension(row.src.pathOf[designerFileSrctype], '.ts', '.js'), _data);
                    }

                    if (uctype == '.tpt') {
                        _data = this.filex(`js${uctype}.designer`)(row);
                        writeFileSync(ucUtil.changeExtension(row.src.pathOf[designerFileSrctype], '.ts', '.js'), _data);
                    }
                    // if (row.htmlFileContent != undefined)
                    //     writeFileSync(`${row.src.pathOf.html}`, row.htmlFileContent);

                    if (!existsSync(row.src.pathOf[codeFileSrctype])) {
                        _data = this.filex(`${srctype}${uctype}.code`)(row);
                        writeFileSync(row.src.pathOf[codeFileSrctype], _data);
                    }
                    if (!existsSync(row.src.pathOf.scss)) {
                        _data = this.filex(`${srctype}${uctype}.style`)(row);
                        writeFileSync(row.src.pathOf.scss, _data);
                    }
                }
            }
        }
       //console.log(this.rows);
        
        console.log(`${this.rows.length} FILES GENERATED..`);

    }

    cssBulder: ResourceBuildEngine;
    generateResources() {
        const chandler = BuildingProcess.configHandler;
        const proj = chandler.MAIN_CONFIG;
        const pref = proj.config.preference;
        const resources = Array.from(this.cssBulder.resources.values());
        resources.forEach(s => {
            s.content = JSON.stringify(s.content);
            if (s.source != undefined)
                s.source = normalize(relativeFilePath(proj.projectPath, s.source));
            s.source = JSON.stringify(s.source ?? '')
            s.guid = JSON.stringify(s.guid);
            s.isGlobalCss = s.isGlobalCss == undefined ? false : (s.isGlobalCss ?? false);
            s.project = s.project ?? proj.projectName
        });
        const rowForRes = {
            mainProject: ResourceBuildEngine.MAIN_PROJECT,
            projectList: this.cssBulder.projectList,
            resources,
            PACKAGE_LIST: chandler.PACKAGE_LIST,
            importPath: BuildingProcess.configHandler.MAIN_CONFIG.projectName == 'uc-control' ? '../core-main.js' : 'uc-control/out/core-main.js',
            declareClassPath: BuildingProcess.configHandler.MAIN_CONFIG.projectName == 'uc-control' ? 'uc-control/src/core-main' : 'uc-control/out/core-main'
        };

        const srcDec = pref.dirDeclaration[pref.srcDec];
        let srcPath = srcDec.dirPath;
        let outPath = pref.dirDeclaration[pref.outDec].dirPath;
        let resSrcFile = resolve(proj.projectPath, srcPath, pref.build.ResourceStorageFile);
        rowForRes.projectList.forEach(s => {
            const resFullpath = s.resourceRelativePath;
            s.resourceRelativePath = JSON.stringify(resFullpath);
            s.importResource = s.projectGuid != chandler.MAIN_CONFIG.config.guid && existsSync(s.resourceFilefullPath);
        });
        ensureDirectoryExistence(resSrcFile);
        let resContent = this.filex('ts.resources')(rowForRes);
        writeFileSync(resSrcFile, resContent, 'utf-8');
        if (!proj.config.useTypeScript) {
            let resSrcTypeFile = ucUtil.changeExtension(resSrcFile, '.js', '.d.ts');
            let resContentTypes = this.filex('t.resources')(rowForRes);
            writeFileSync(resSrcTypeFile, resContentTypes, 'utf-8');
        }
        return true;
    }

}
interface resourceMainProject {
    name: string;
    guid: string;
    globalStyleguid: string;
    configGuid: string;
}