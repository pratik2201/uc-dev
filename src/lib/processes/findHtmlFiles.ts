
import type { UserUCConfig } from "ap-shared-core/core-common.js";
import { getCloneableObject, ResourceKeyBridge, safeStringify } from "ap-shared-core/core-common.js";
import { codeFileInfo } from "ap-shared-core/core-main.js";
import { rmSync } from "fs";
import { join } from "path";
import { BuildingProcess } from "../BuildingProcess.js";
import { ResourceBuildEngine } from "./ResourceBuildEngine.js";

export async function collectFiles() {
    const cfg = BuildingProcess.configHandler.MAIN_CONFIG.config;
    const pref = cfg.preference;
    const projPath = BuildingProcess.configHandler.MAIN_PROJECT_PATH;
    const srcDirDec = pref.dirDeclaration[pref.srcDec];
    const htmlFileDec = srcDirDec.fileDeclaration.html;
    const htmlDirPath = join(projPath, srcDirDec.dirPath, htmlFileDec.subDirPath);
    const allFileList = BuildingProcess.resourceCopy.sourceFileList;
    let ext = htmlFileDec.extension;
    let filteed = allFileList.filter(s =>
        s.startsWith(htmlDirPath) &&
        (s.endsWith(`.uc${ext}`) || s.endsWith(`tpt${ext}`))
    );
    const designerFileDec = srcDirDec.fileDeclaration.designer;
    const designerDirPath = join(projPath, srcDirDec.dirPath, designerFileDec.subDirPath);
    let designerList = allFileList.filter(s =>
        s.startsWith(designerDirPath) &&
        (s.endsWith(`.uc${designerFileDec.extension}`) || s.endsWith(`tpt${designerFileDec.extension}`))
    )
    const cInfos: codeFileInfo[] = [];
    const oldUsedDesigners: string[] = [];
    filteed.forEach(s => {
        const cInfo = new codeFileInfo();
        if (cInfo.parseUrl(s, 'src') == true) {
            cInfos.push(cInfo);
            oldUsedDesigners.push(cInfo.allPathOf.src.designer);
        }
    });

    const toRemoveOldUnUsedDesigners = designerList.filter(s => !oldUsedDesigners.includes(s));
    for (let index = 0; index < toRemoveOldUnUsedDesigners.length; index++) {
        const s = toRemoveOldUnUsedDesigners[index];
        rmSync(s, { force: true });
        console.log(`!! '${s}' file deleted`);
    }


    BuildingProcess.buildDesigner.cInfoToBuild.length = 0;
    BuildingProcess.buildDesigner.cInfoToBuild.push(...cInfos);
    registerMain();
    //BuildingProcess.buildDesigner.init(cInfos.at(10));
    for (let index = 0; index < cInfos.length; index++) {
        const cInfo = cInfos[index];
        await BuildingProcess.buildDesigner.init(cInfo);
    }

    BuildingProcess.buildDesigner.gen.rows.push(...BuildingProcess.buildDesigner.rows);
    BuildingProcess.buildDesigner.gen.generateFiles();
    //console.log(BuildingProcess.buildDesigner.gen.cssBulder.resources);

}
function registerMain() {
    const chandler = BuildingProcess.configHandler;
    const _mainProj = chandler.MAIN_CONFIG;
    const _cssbuilder = BuildingProcess.buildDesigner.gen.cssBulder;
    const cfg = getCloneableObject(_mainProj.config) as UserUCConfig;
    const browser = cfg.browser;
    const prf = cfg.preference;
    const srcdir = prf.dirDeclaration[prf.srcDec].dirPath;
    let stylePath = join(_mainProj.projectPath, cfg.cli.baseCssPath);
    const mp = ResourceBuildEngine.MAIN_PROJECT;
    mp.importMapGuid = ResourceKeyBridge.extractKey(_cssbuilder.build(undefined, {
        content: safeStringify(chandler.importmap),
        encrypt: cfg.encryptResource,
    }));
    mp.cssGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(stylePath, {})));

    if (cfg.cli.baseHtmlPath != undefined && cfg.cli.baseHtmlPath.length > 0) {
        let htmlPath = join(_mainProj.projectPath, cfg.cli.baseHtmlPath);
        const mainHtmlRes = _cssbuilder.build(htmlPath, {});
        if (mainHtmlRes != undefined)
            mp.mainHtmlGuid = ResourceKeyBridge.extractKey(mainHtmlRes);
    }
    mp.ucConfigGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(undefined, {
        content: JSON.stringify(_mainProj.config)
    })));
    mp.name = JSON.stringify(_mainProj.projectName);
    mp.guid = _mainProj.config.guid;
}