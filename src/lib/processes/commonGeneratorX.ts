
import { CommonRow } from "ap-shared-core/out/ucbuilder-devtools/buildRow.js";
import { IFileDeclarationTypesMap } from "ap-shared-core/out/ucbuilder/configResources.js";
import { TemplateMaker } from "ap-shared-core/out/template/TemplateMaker.js";
import { ucUtil } from "ap-shared-core/out/ucbuilder/ucUtil.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, normalize, resolve } from "path";
import { ResourceBuildEngine } from "../../main/resMng/ResourceBuildEngine.js";
import { BuildingProcess } from "../BuildingProcess.js";
import { relativeFilePath } from "ap-shared-core/out/ucbuilder-devtools/pathUtil.js";
import { safeStringify } from "ap-shared-core/out/objectUtil.js";

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
    static ensureDirectoryExistence(filePath: string) {
        const _dirname = dirname(filePath);
        if (!existsSync(_dirname)) {
            mkdirSync(_dirname, { recursive: true });
        }
    }
    static readTemplate(tptFileName: string) {
        const tptDirpath = ucUtil.devEsc(`{:../../../assets/ucbuilder/templates}`);
        const cpath = fileURLToPath(import.meta.url);
        let fpath = resolve(dirname(cpath), join(tptDirpath, tptFileName));
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
        //console.log(this.rows);
        //if (this.rows == undefined || this.rows.length == 0) return;
        let _data = "";
        console.log(`
+---------------------+
|                    /
|          BUILD STARTED
|              /
+-------------+            
                    `);
        if (this.generateResources()) {
            if (this.rows.length == 0) {
                console.log(`
                  +---------------+
                 /                |
          NOTHING TO BUILD        |
           /                      |
          +-----------------------+             
                    `);

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

                    commonGeneratorX.ensureDirectoryExistence(row.src.pathOf[designerFileSrctype]);
                    _data = this.filex(`${srctype}${uctype}.designer`)(row);
                    //console.log(_data);

                    writeFileSync(row.src.pathOf[designerFileSrctype], _data);

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
        console.log(`
                  +---------------+
                 /                |
          SUCCESSFULL             |
           /                      |
          +-----------------------+            
                    `);

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

        /* const onlyAlias = resources.filter(s => s.name && s.name != "");
       const nameRegistry = {};
       this.cssBulder.projectList.forEach(prj => {
           const projRes = onlyAlias.filter(s => s.project == prj.projectName);
           nameRegistry[JSON.stringify(prj.projectName)] = projRes.reduce<Record<string, UserResource>>(
               (acc, item) => {
                   if (!item.name) return acc; // skip if name is undefined
                   acc[item.name] = item;
                   return acc;
               },
               {}
           );
       }); */
        const rowForRes = {
            importmap: JSON.stringify(safeStringify(chandler.importmap)),
            mainProject: ResourceBuildEngine.MAIN_PROJECT,
            projectList: this.cssBulder.projectList,
            resources,
            PACKAGE_LIST: chandler.PACKAGE_LIST,
            importPath: BuildingProcess.configHandler.MAIN_CONFIG.projectName == 'ucbuilder' ? '../core.js' : undefined
        };

        let srcPath = pref.dirDeclaration[pref.srcDir].dirPath;
        let outPath = pref.dirDeclaration[pref.outDir].dirPath;
        let resSrcFile = resolve(proj.projectPath, srcPath, pref.build.ResourceDeclarationFile);
        let resOutFile = resolve(proj.projectPath, outPath, pref.build.ResourceDeclarationFile);
        rowForRes.projectList.forEach(s => {
            const resFullpath = s.resourceRelativePath;
            s.resourceRelativePath = JSON.stringify(resFullpath);
            s.importResource = s.projectGuid != chandler.MAIN_CONFIG.config.guid && existsSync(s.resourceFilefullPath);
        });
        let resContent = this.filex('resources')(rowForRes);
        writeFileSync(resSrcFile, resContent, 'utf-8');
        return true;
    }

}
interface resourceMainProject {
    name: string;
    guid: string;
    globalStyleguid: string;
    configGuid: string;
}