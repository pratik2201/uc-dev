import { deepAssign } from "ap-shared-core/out/objectUtil.js";
import { correctpath, trimPath } from "ap-shared-core/out/pathUtils.js";
import { ImportMapResolver } from "ap-shared-core/out/ucbuilder-devtools/ImportMapResolver.js";
import { ImportUserConfig } from "ap-shared-core/out/ucbuilder-devtools/userConfigManage.js";
import { GetProjectName, type IDirDeclarations, type IImportMap, IUCConfigPreference, ProjectRowBase, type TPPackage, UcBuildOptions, UserUCConfig } from "ap-shared-core/out/ucbuilder/configResources.js";
import { createRequire } from "module";
import fs from "node:fs";
import path, { join, normalize } from "node:path";
import url from "node:url";
const appRequire = createRequire(
    path.resolve(process.cwd(), "package.json")
);
function isSamePath(path1: string, path2: string) {
    const absA = path.resolve(path1);
    const absB = path.resolve(path2);
    return (path.normalize(absA) === path.normalize(absB));
}
export class ConfigHandler {

    // async init(importMetaPath: string) {
    //     PathBridge.path = path as any;
    //     PathBridge.url = url as any;
    //     if (importMetaPath.startsWith('file:///')) importMetaPath = url.fileURLToPath(importMetaPath);
    //     const cpth = correctpath(importMetaPath);
    //     await this.fillConfig(cpth);
    //     PathBridge.source = this.allConfig;
    //     PathBridge.CheckAndSetDefault();

    // }

    MAIN_CONFIG: ProjectRowBase;
    MAIN_PROJECT_PATH: string;
    allConfig: ProjectRowBase[] = [];

    importmap: IImportMap = {
        imports: {},
        scopes: {

        }
    };

    MAKE_IMPORTMAP = (_config: ProjectRowBase) => {
        function cpath(p: string) {
            if (!p.startsWith('.')) p = './' + p;
            if (!p.endsWith('/')) p = p + '/';
            if (p == './/') p = './';
            return p;
        }

        const aliases = {};
        const pathAlias = _config.config?.browser?.importmap ?? {};

        for (let [als, relPath] of Object.entries(pathAlias)) {
            als = trimPath(als);
            let fpath = join(_config.projectPath, _config.rootPath);
            let resolvPath = normalize(path.join(fpath, relPath));
            let np = correctpath(path.relative(fpath, resolvPath));
            np = cpath(np);// `./${np}/`;
            aliases[`${als}/`] = np;
        }

        const rootPath = cpath(correctpath(_config.rootPath)); //`./${correctpath(_config.rootPath)}/`;
        if (this.importmap.scopes[rootPath] == undefined)
            this.importmap.scopes[rootPath] = aliases;
        for (let i = 0, iObj = _config.children, ilen = iObj.length; i < ilen; i++) {
            const iItem = iObj[i];
            this.MAKE_IMPORTMAP(iItem);
        }
    }

    PACKAGE_LIST: TPPackage;
    ALL_PROJECTS_DIRECTORIES: { [name: string]: string } = {};
    outDirPath: string;
    srcDirPath: string;
    pref: IUCConfigPreference<IDirDeclarations>;
    ucConfig = new ProjectRowBase();
    fillConfig = async (projectDir: string) => {
        await this.RecurciveFindConfigAndFill(projectDir, this.ucConfig);
        const cfg = this.MAIN_CONFIG.config;
        this.pref = cfg.preference;
        this.pref.build = Object.assign(new UcBuildOptions(), this.pref.build);
        const bld = this.pref.build;
        
        this.srcDirPath = this.pref.dirDeclaration[this.pref.srcDec].dirPath;
        this.outDirPath = this.pref.dirDeclaration[this.pref.outDec].dirPath;
        //if (bld.keyBind == undefined || bld.keyBind.length == 0)
        //    bld.keyBind = ['ControlRight', 'F12'];

        this.allConfig.sort((a, b) => b.importMetaURL.length - a.importMetaURL.length);
        this.updateAliceToPath(this.allConfig);
        this.MAKE_IMPORTMAP(this.ucConfig);
        for (const [k, v] of Object.entries(this.importmap.scopes)) {
            if (v == undefined || Object.keys(v).length == 0) delete this.importmap.scopes[k];
        }
        //let str = JSON.stringify(this.importmap).replace(/\.\/\.\//g, './');
        ImportMapResolver.init(this.importmap, this.MAIN_PROJECT_PATH);
        //console.log(this.importmap);
        
    }

    updateAliceToPath(rows: ProjectRowBase[]) {
        let mainProjectPath = this.MAIN_CONFIG.projectPath;
        const dict = this.ALL_PROJECTS_DIRECTORIES;
        rows.forEach(row => {
            for (const [pathAliasKey, pathAliasValue] of Object.entries(row.config.browser.importmap)) {
                let fullPath = correctpath(path.join(mainProjectPath, pathAliasValue) + '/');
                let p = rows.find(s => fullPath.startsWith(s.projectPath));
                if (p != undefined)
                    row.aliceToPath[pathAliasKey] = p.projectPath;
            }
            const cfg = row.config;
            cfg.browser = cfg.browser ?? { importmap: {}, resolveProjects: [] };
            cfg.browser.importmap = cfg.browser.importmap ?? {};
            const imap = cfg.browser.importmap;
            cfg.browser.resolveProjects.forEach(resolveProject => {
                let resolveProjectPath = this.ALL_PROJECTS_DIRECTORIES[resolveProject];
                if (resolveProjectPath != undefined)
                    imap[resolveProject] = imap[resolveProject] ?? correctpath(path.relative(row.projectPath, resolveProjectPath));
            });
            /*let ucbuilderProjPath = this.PROJECT_DICTONARY.ucbuilder;
            if (ucbuilderProjPath != undefined)
                imap.ucbuilder = imap.ucbuilder ?? correctpath(path.relative(row.projectPath, ucbuilderProjPath));
            */
        });
    }
    private async RecurciveFindConfigAndFill(projectDirPath: string, row: ProjectRowBase) {
        if (projectDirPath != undefined) {
            projectDirPath = path.normalize(projectDirPath);
            if (this.allConfig.findIndex(s => isSamePath(s.projectPath, projectDirPath)) >= 0) return;
            let projectName = GetProjectName(projectDirPath, path, fs);
            const ucConfigPath = path.join(projectDirPath, 'ucconfig.js');
            if (fs.existsSync(ucConfigPath)) {
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
                    this.ALL_PROJECTS_DIRECTORIES[row.projectName] = this.ALL_PROJECTS_DIRECTORIES[row.projectName] ?? row.projectPath;
                    row.rootPath = correctpath(path.normalize(path.relative(this.MAIN_PROJECT_PATH, row.projectPath)));
                    row.rootPath = row.rootPath == '.' ? '.' : path.join('./', row.rootPath, '/');

                    cfg.browser = cfg.browser ?? { importmap: {}, resolveProjects: [] };
                    cfg.browser.importmap = cfg.browser.importmap ?? {};
                    cfg.browser.importmap[row.projectPrimaryAlice] = '';
                    this.allConfig.push(row);
                    row.importMetaURL = url.pathToFileURL(projectDirPath).href;
                    let dirs = this.listProjectPath(projectDirPath);
                    for (let i = 0, ilen = dirs.length; i < ilen; i++) {
                        const child_project_dir = dirs[i];
                        let nchild = new ProjectRowBase();
                        await this.RecurciveFindConfigAndFill(child_project_dir, nchild);
                        row.children.push(nchild);
                    }
                }
            } else {
                console.log('NO `ucconfig.js` found in Root Dir');
            }
        }
    }

    listProjectPath(projectDir: string) {
        const _this = this;
        const pkgJson = JSON.parse(
            fs.readFileSync(path.resolve(projectDir, "package.json"), "utf-8")
        );
        const deps = {
            ...pkgJson.dependencies,
            ...pkgJson.optionalDependencies
        };
        const rtrn: string[] = [];

        //console.log(this.PACKAGE_LIST);
        const _PACKEGE_LIST = {}
        for (const pkgName of Object.keys(deps)) {
            const ucprojectDir = findUcConfig(pkgName);
            if (ucprojectDir) {
                rtrn.push(ucprojectDir);
                //foundConfigs[pkgName] = foundConfigs[pkgName] ?? ;

            }
        }
        if (this.PACKAGE_LIST == undefined)
            this.PACKAGE_LIST = _PACKEGE_LIST;
        /*for (const [pkgName, _pth] of Object.entries(_PACKEGE_LIST))
            if (this.PACKAGE_LIST[pkgName])
                this.PACKAGE_LIST = _PACKEGE_LIST;*/

        // console.log(foundConfigs);

        return rtrn;
        function findUcConfig(pkgName) {
            const root = resolvePackageRoot(pkgName);
            if (!root) return null;
            const _rootPath = correctpath(root);
            _PACKEGE_LIST[pkgName] = _rootPath;
            _this.ALL_PROJECTS_DIRECTORIES[pkgName] = _this.ALL_PROJECTS_DIRECTORIES[pkgName] ?? _rootPath;
            const configPath = path.join(root, "ucconfig.js");
            return fs.existsSync(configPath) ? root : null;
        }

        function resolvePackageRoot(pkgName) {
            try {
                const pkgJsonPath = appRequire.resolve(`${pkgName}/package.json`);
                return path.dirname(pkgJsonPath);
            } catch (ee) {
                return null;
            }
        }
        return [];
    }


}


