import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { IpcMainHelper } from "ucbuilder/out/main/ipc/IpcMainHelper.js";
import { ImportUserConfig } from "./userConfigManage.js";
import { PathBridge } from "../renderer/pathBridge.js";
import { correctpath, trimPath } from "ap-shared-core/out/pathUtils.js";
import { GetProjectName, IImportMap, ProjectRowBase, UcBuildOptions, UserUCConfig } from "ap-shared-core/out/ucbuilder/configResources.js";

import { deepAssign } from "ap-shared-core/out/objectUtil.js";
import { UC_ACCESS_KEY } from "ucbuilder/out/common/ipc/enumAndMore.js";

export class ConfigHandler {
    static filler = new ConfigHandler();
    static async init(importMetaPath: string) {
        PathBridge.path = path as any;
        PathBridge.url = url as any;
        if (importMetaPath.startsWith('file:///')) importMetaPath = url.fileURLToPath(importMetaPath);
        const cpth = correctpath(importMetaPath);
        await this.filler.fill(cpth);
        PathBridge.source = ConfigHandler.filler.allConfig;
        PathBridge.CheckAndSetDefault();

        IpcMainHelper.On('ucConfig', (event, args: {}) => {
            event.returnValue = this.filler.ucConfig;
        }, UC_ACCESS_KEY);
    }

    MAIN_CONFIG: ProjectRowBase;
    MAIN_PROJECT_PATH: string;
    allConfig: ProjectRowBase[] = [];

    importmap: IImportMap = {
        imports: {},
        scopes: {

        }
    };
    MAKE_IMPORTMAP(_config: ProjectRowBase) {
        const aliases = {};
        const pathAlias = _config.config?.browser?.importmap ?? {};
        for (let [als, relPath] of Object.entries(pathAlias)) {
            als = trimPath(als);
            const np = trimPath(correctpath(path.join(_config.rootPath, relPath)));
            aliases[`${als}/`] = `./${np}/`;
        }
        if (this.importmap.scopes[_config.rootPath] == undefined)
            this.importmap.scopes[_config.rootPath] = aliases;
        for (let i = 0, iObj = _config.children, ilen = iObj.length; i < ilen; i++) {
            const iItem = iObj[i];
            this.MAKE_IMPORTMAP(iItem);
        }
    }
    ucConfig = new ProjectRowBase();
    fill = async (mainDirPath: string) => {
        let projectDir = this.getProjectDir(mainDirPath);
        await this.FILL_UCcONFIG(projectDir, this.ucConfig);
        const cfg = this.MAIN_CONFIG.config;
        const pref = cfg.preference;
        pref.build = Object.assign(new UcBuildOptions(), pref.build);
        const bld = pref.build;
        if (bld.keyBind == undefined || bld.keyBind.length == 0)
            bld.keyBind = ['ControlRight', 'F12'];
        this.allConfig.sort((a, b) => b.importMetaURL.length - a.importMetaURL.length);
        this.updateAliceToPath(this.allConfig);
        this.copyAssets();
        this.MAKE_IMPORTMAP(this.ucConfig);
    }
    copyAssets = () => {
        const cfg = this.MAIN_CONFIG.config;
        if (app.isPackaged) return;
        const pref = cfg.preference;
        const dirDeclaration = pref.dirDeclaration;
        const runtimeRes = pref.build?.RuntimeResources ?? [];
        runtimeRes.forEach(res => {
            const SRC_DIR = pref.dirDeclaration[res.fromDeclare].dirPath;
            function copyAssets(fromDir: string) {
                const dirContents = fs.readdirSync(fromDir);
                for (const file of dirContents) {
                    const full = path.join(fromDir, file);
                    const isDirectory = fs.statSync(full).isDirectory();
                    let fileExt = file.substring(file.lastIndexOf('.'));
                    if (isDirectory) copyAssets(full);
                    else if (res.includeExtensions.includes(fileExt)) {
                        const commonPath = path.relative(SRC_DIR, full);
                        res.toDeclares.forEach(ot => {
                            let OUT_DIR = dirDeclaration[pref.outDir].dirPath;
                            const dest = path.join(OUT_DIR, commonPath);
                            fs.mkdirSync(path.dirname(dest), { recursive: true });
                            fs.copyFileSync(full, dest);
                        });
                    }
                }
            }
            copyAssets(SRC_DIR);
        });
    }
    updateAliceToPath(linearPushAr: ProjectRowBase[]) {
        let p_path = this.MAIN_CONFIG.projectPath;
        for (let i = 0, iObj = linearPushAr, ilen = iObj.length; i < ilen; i++) {
            const iUc = iObj[i];
            for (const [pathAliasKey, pathAliasValue] of Object.entries(iUc.config.browser.importmap)) {
                let fullPath = correctpath(path.join(p_path, pathAliasValue) + '/');
                let p = linearPushAr.find(s => fullPath.startsWith(s.projectPath));
                if (p != undefined)
                    iUc.aliceToPath[pathAliasKey] = p.projectPath;
            }
        }
    }
    private async FILL_UCcONFIG(projectDirPath: string, row: ProjectRowBase) {
        if (projectDirPath != undefined) {
            let projectName = GetProjectName(projectDirPath, path, fs);
            let ucConfigPath = path.join(projectDirPath, 'ucconfig.js');
            let ucCfg = await ImportUserConfig(ucConfigPath);
            if (ucCfg != undefined) {
                row.config = deepAssign(row.config ?? new UserUCConfig(), ucCfg);
                if (this.MAIN_CONFIG == undefined) {
                    this.MAIN_CONFIG = row;
                    this.MAIN_PROJECT_PATH = projectDirPath;
                }
                row.projectName =
                    row.projectPrimaryAlice = projectName;

                row.projectPath = correctpath(projectDirPath);
                const cfg = row.config;
                row.rootPath = correctpath(path.normalize(path.relative(this.MAIN_PROJECT_PATH, row.projectPath)));
                row.rootPath = row.rootPath == '.' ? '.' : `./${row.rootPath}/`;
                cfg.browser.importmap[row.projectPrimaryAlice] = '';


                this.allConfig.push(row);
                row.importMetaURL = url.pathToFileURL(projectDirPath).href;
                let dirs = this.listProjectPath(projectDirPath);
                for (let i = 0, ilen = dirs.length; i < ilen; i++) {
                    const child_project_dir = dirs[i];
                    let nchild = new ProjectRowBase();
                    await this.FILL_UCcONFIG(child_project_dir, nchild);
                    row.children.push(nchild);
                }
            }
        }
    }
    listProjectPath(projectDir: string) {
        let child_projects_dirpath = path.join(projectDir, 'node_modules');
        let child_project_dirList: string[] = [];
        if (fs.existsSync(child_projects_dirpath)) {
            let child_projects = fs.readdirSync(child_projects_dirpath);
            child_projects.forEach(project_name => {
                let child_project_configfile = path.join(child_projects_dirpath, project_name, 'ucconfig.js');
                if (fs.existsSync(child_project_configfile)) {
                    child_project_dirList.push(path.join(child_projects_dirpath, project_name));
                }
            });
        }
        return child_project_dirList;
    }

    getProjectDir(_dirPath: string) {
        let package_path = '';
        do {
            package_path = path.join(_dirPath, 'ucconfig.js');
            _dirPath = path.dirname(_dirPath);
        } while (!fs.existsSync(package_path))
        return path.dirname(package_path);
    }
}


