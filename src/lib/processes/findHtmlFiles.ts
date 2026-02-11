import { getCloneableObject } from "ap-shared-core/out/objectUtil.js";
import { codeFileInfo } from "ap-shared-core/out/ucbuilder-devtools/codeFileInfo.js";
import { join } from "path";
import { ResourceBuildEngine } from "./ResourceBuildEngine.js";
import { BuildingProcess } from "../BuildingProcess.js"; 
import { ResourceKeyBridge } from "ucbuilder/out/common/resources/enums.js";

export async function collectFiles() {
    const cfg = BuildingProcess.configHandler.MAIN_CONFIG.config;
    const pref = cfg.preference;
    const projPath = BuildingProcess.configHandler.MAIN_PROJECT_PATH;
    const srcDirDec = pref.dirDeclaration[pref.srcDec];
    const htmlFileDec = srcDirDec.fileDeclaration.html;
    const htmlDirPath = join(projPath, srcDirDec.dirPath, htmlFileDec.subDirPath);
    const allFileList = BuildingProcess.resourceCopy.sourceFileList;
    const ext = htmlFileDec.extension;
    let filteed = allFileList.filter(s =>
        s.startsWith(htmlDirPath) &&
        (s.endsWith(`.uc${ext}`) ||
            s.endsWith(`tpt${ext}`))
    );
    const cInfos: codeFileInfo[] = [];
    filteed.forEach(s => {
        const cInfo = new codeFileInfo();
        if (cInfo.parseUrl(s, 'src') == true)
            cInfos.push(cInfo);
    });
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
    const _mainProj = BuildingProcess.configHandler.MAIN_CONFIG;
    const _cssbuilder = BuildingProcess.buildDesigner.gen.cssBulder;
    const cfg = getCloneableObject(_mainProj.config);
    const prf = cfg.preference;
    const srcdir = prf.dirDeclaration[prf.srcDec].dirPath;
    let stylePath = join(_mainProj.projectPath, _mainProj.config.projectBaseCssPath);
    const mp = ResourceBuildEngine.MAIN_PROJECT;
    mp.cssGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(stylePath, {})));
    mp.ucConfigGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(undefined, {
        content: JSON.stringify(_mainProj.config)
    })));
    mp.name = JSON.stringify(_mainProj.projectName);
    mp.guid = _mainProj.config.guid;
}