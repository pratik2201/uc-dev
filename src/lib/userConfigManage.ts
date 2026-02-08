import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { UserUCConfig, IDirDeclarations, IUCConfigPreference, IFileDeclaration, UcBuildOptions, BuildTimeGuidMeta, GetProjectName } from "ap-shared-core/out/ucbuilder/configResources.js";
import { deepAssign } from "ap-shared-core/out/objectUtil.js";

export async function GetUcConfig(projectdir: string): Promise<UserUCConfig> {
    let config_file_path = path.join(projectdir, 'ucconfig.js');
    if (fs.existsSync(config_file_path)) {
        return await ImportUserConfig(config_file_path); //JSON.parse(fs.readFileSync(config_file_path, 'binary'));
    }
    return undefined;
}
export default function UcDefaultConfig<K = IDirDeclarations>(...cfg: Partial<UserUCConfig<K>>[]) {
    let rtrn = new UserUCConfig<K>();
    deepAssign(rtrn, ...cfg);
    return rtrn;
}

export async function ImportUserConfig(fpath: string): Promise<UserUCConfig> {
    if (!fpath.startsWith('file:/')) fpath = pathToFileURL(fpath).href;
    try {
        return await checkUc(fpath);
    } catch (e) {
        console.log(e);
    }
}
async function checkUc(filePath: string) {
    let res = (await import(filePath));
    let cfg = res?.default as UserUCConfig;
    if (cfg == undefined) throw new Error('EMPTY CONFIG');
    const pref = cfg.preference = cfg.preference ?? {} as IUCConfigPreference;
    pref.srcDir = (pref.srcDir ?? "") as any;
    pref.outDir = (pref.outDir ?? "") as any;
    cfg.projectBaseCssPath = (cfg.projectBaseCssPath ?? "");

    let dirDeclaration = pref?.dirDeclaration;
    if (dirDeclaration != undefined) {
        const fileWisePath = pref.fileCommonDeclaration;
        if (fileWisePath != undefined) {
            for (const [fileDeckey, fileDec] of Object.entries(fileWisePath)) {
                fileDec.subDirPath = fileDec.subDirPath ?? '';
                for (const dirDec of Object.values(pref?.dirDeclaration)) {
                    dirDec.dirPath = dirDec.dirPath ?? '';
                    dirDec.fileDeclaration = dirDec.fileDeclaration ?? {};
                    dirDec.fileDeclaration[fileDeckey] = dirDec.fileDeclaration[fileDeckey] ?? {};

                    const fd = dirDec.fileDeclaration[fileDeckey] as IFileDeclaration;
                    fd.subDirPath = fd.subDirPath ?? fileDec.subDirPath ?? '';
                    fd.extension = fd.extension ?? fileDec.extension ?? '';
                }
            }
        }
        for (const dirDec of Object.values(pref?.dirDeclaration)) {
            for (const [srcType, fileDec] of Object.entries(dirDec.fileDeclaration)) {
                fileDec.subDirPath = fileDec.subDirPath ?? '';
                fileDec.extension = fileDec.extension ?? '';
            }
        }
    }
    pref.build = pref.build ?? new UcBuildOptions();
    if (filePath.startsWith('file:///')) filePath = fileURLToPath(filePath);
    cfg.browser = cfg.browser ?? { importmap: {} };
    pref.build.guidOptions = pref.build.guidOptions ?? new BuildTimeGuidMeta();
    /*
    const prjName = GetProjectName(path.dirname(filePath), path, fs);
    if (cfg.browser.importmap['ucbuilder'] == undefined) {
        cfg.browser = cfg.browser ?? { importmap: {} };
        cfg.browser.importmap = cfg.browser.importmap ?? {};
        cfg.browser.importmap.ucbuilder =
            cfg.browser.importmap.ucbuilder =
            (prjName == 'ucbuilder' ? "." : "node_modules/ucbuilder");
        cfg.browser.importmap['ucbuilder-devtools'] = "node_modules/ucbuilder-devtools";
    }*/
    return cfg;
}