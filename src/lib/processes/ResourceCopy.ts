
import { join, relative, dirname, normalize, isAbsolute, resolve } from "path";
import { BuildingProcess } from "../BuildingProcess.js";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { normalizeJSON, safeStringify } from "ap-shared-core/out/objectUtil.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { pathToFileURL } from "url";
import { UserResource } from "ap-shared-core/out/enums.js";
import { recursive } from "ap-shared-core/out/uc-dev/ConfigHandler.js";

export class ResourceCopy {

    sourceFileList: string[] = [];
    fillFiles() {
        this.sourceFileList = recursive(BuildingProcess.configHandler.MAIN_PROJECT_PATH);
    }
    registerResource = async () => {
        const _builder = BuildingProcess.buildDesigner.gen.cssBulder;
        async function walk(fullpath: string) {
            const filwRes: UserResource[] = [];
            fullpath = !fullpath.startsWith('file:///') ? pathToFileURL(fullpath).href : fullpath;
            const _default = (await import(fullpath)).default;
            if (typeof _default === 'function')
                filwRes.push(..._default());
            else if (typeof _default === 'object')
                filwRes.push(..._default);
            filwRes.forEach(r => {
                if (r.source != undefined) {
                    _builder.build(resolveFilePath(fullpath, r.source), r);
                }
            });
        }
        const cfg = BuildingProcess.configHandler.MAIN_CONFIG.config;
        const pref = cfg.preference;
        const projPath = BuildingProcess.configHandler.MAIN_PROJECT_PATH;
        const dirDecfullPath = join(projPath, pref.dirDeclaration[pref.outDec].dirPath);
        let filteed = this.sourceFileList.filter(s =>
            s.startsWith(dirDecfullPath) &&
            s.endsWith('.resx.js')
        );
        for (let index = 0; index < filteed.length; index++) {
            const fpath = filteed[index];
            await walk(fpath);
        }
        //filteed.forEach(async (fpath) => { await walk(fpath); });
    }
    copyAssets = () => {
        const cfg = BuildingProcess.configHandler.MAIN_CONFIG.config;
        const pref = cfg.preference;
        const dirDeclaration = pref.dirDeclaration;
        const runtimeRes = pref.build?.RuntimeResources ?? [];
        const projPath = BuildingProcess.configHandler.MAIN_PROJECT_PATH;


        runtimeRes.forEach(res => {
            const dirDecfullPath = join(projPath, pref.dirDeclaration[res.fromDeclare].dirPath);
            let filteed = this.sourceFileList.filter(s =>
                s.startsWith(dirDecfullPath) &&
                res.includeExtensions.findIndex(e => s.endsWith(e)) >= 0
            );
            filteed.forEach(full => {
                const commonPath = relative(dirDecfullPath, full);
                res.toDeclares.forEach((todeclare) => {
                    let targetDir = dirDeclaration[todeclare].dirPath;
                    const dest = join(targetDir, commonPath);
                    //mkdirSync(dirname(dest), { recursive: true });
                    ensureDirectoryExistence(dest);
                    copyFileSync(full, dest);
                });
            });
        });

        /*runtimeRes.forEach(res => {
            const SRC_DIR = pref.dirDeclaration[res.fromDeclare].dirPath;
            function copyAssets(fromDir: string) {
                const dirContents = readdirSync(fromDir);
                for (const file of dirContents) {
                    const full = join(fromDir, file);
                    const isDirectory = statSync(full).isDirectory();
                    let fileExt = file.substring(file.lastIndexOf('.'));
                    if (isDirectory) copyAssets(full);
                    else if (res.includeExtensions.includes(fileExt)) {
                        const commonPath = relative(SRC_DIR, full);
                        res.toDeclares.forEach(ot => {
                            let OUT_DIR = dirDeclaration[pref.outDec].dirPath;
                            const dest = join(OUT_DIR, commonPath);
                            mkdirSync(dirname(dest), { recursive: true });
                            copyFileSync(full, dest);
                        });
                    }
                }
            }
            copyAssets(SRC_DIR);
        });*/
    }
}
