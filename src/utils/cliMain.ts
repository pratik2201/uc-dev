import { extractPathConfig, IFileDeclaration, UserUCConfig } from "ap-shared-core/core-common.js";
import { existsSync, readFileSync } from "fs";
import path, { join } from "path";
import { cliDependancyChecker } from "./cliDependancyChecker.js";
import { getProjectDir } from "./cliFindProjects.js";
import { cliUcconfigInquiry } from "./inquiry/cliUcconfigInquiry.js";
import { ask, askYesNo } from "./prompt.js";
import { ImportUserConfig } from "ap-shared-core/core-main.js";
import { BuildingProcess } from "../lib/BuildingProcess.js";
import { cliMenuSource } from "./cliMenuSource.js";
import { cliElectronInquiry } from "./inquiry/cliElectronInquiry.js";
import { cliNewStartInquiry } from "./inquiry/cliNewStartInquiry.js";
import { cliQuickSetup } from "./inquiry/cliQuickSetup.js";
import { cliSurveys } from "./inquiry/cliSurveys.js";
import { cliTypeScriptInquiry } from "./inquiry/cliTypeScriptInquiry.js";
import { cli_menu_MainMenu } from "./inquiry/cli_menu_MainMenu.js";
import { makesure_package_exist } from "./inquiry/cli_menu_quickStartup.js";

export class cliOptions {
    yes? = false;
    force? = false;
}
class metaInfo {
    projectDir: string;

    srcDir: string;
    designerDir: string;
    outDir: string;

    mainProcessFilePath: string;
    preloadScriptFilePath: string;
    resourceFilePath: string
    htmlFilePath: string;
    codeFilePath: string;
    cssFilePath: string;
}

export class cliMain {
    static ref: cliMain;
    cliOptions = new cliOptions();
    config: UserUCConfig = new UserUCConfig();
    menu: cliMenuSource;
    QUERY = {
        JUST_INSTALLED: [] as string[],
    }
    projectDir = undefined;
    hasConfigFound = false;
    dependancyChecker: cliDependancyChecker;
    dependentProjects: string[];
    _cliUcconfigInq: cliUcconfigInquiry;
    _cliSurveys: cliSurveys;
    _cliNewStart: cliNewStartInquiry;
    _cliElectronInq: cliElectronInquiry;
    _cliTypeScriptInq: cliTypeScriptInquiry;
    _cliQuickSetup: cliQuickSetup;
    constructor() {
        this.projectDir = this.projectDir = process.cwd();

        this._cliSurveys = new cliSurveys(this);
        this._cliUcconfigInq = new cliUcconfigInquiry(this);
        this._cliTypeScriptInq = new cliTypeScriptInquiry(this);
        this._cliElectronInq = new cliElectronInquiry(this);
        this._cliNewStart = new cliNewStartInquiry(this);
        this._cliQuickSetup = new cliQuickSetup(this);
        this.menu = new cliMenuSource(this);
    }
    readConfig = async () => {
        try {
            const cfgPath = join(this.projectDir, 'ucconfig.js');
            //console.log(cfgPath);
            if (existsSync(cfgPath)) {
                this.config = await ImportUserConfig(cfgPath);
                if (this.config != undefined) {
                    const x = extractPathConfig(this.config);
                    const browser = this.config.browser;
                    /*if (x.cli?.mainProcessFilePath)
                        meta.mainProcessFilePath = join(meta.projectDir, x.srcDec.dirPath, x.cli.mainProcessFilePath);
                    if (x.cli?.preloadScriptFilePath)
                        meta.preloadScriptFilePath = join(meta.projectDir, x.srcDec.dirPath, x.cli.preloadScriptFilePath);
                    if (x.cli?.preloadScriptFilePath)
                        meta.preloadScriptFilePath = join(meta.projectDir, x.srcDec.dirPath, x.cli.preloadScriptFilePath);
                    meta.htmlFilePath = x.cli?.baseHtmlPath;
                    meta.cssFilePath = x.cli?.baseCssPath;*/
                }
            } else {
                this.config = new UserUCConfig();
            }
        } catch {

        }
    }
    async setupSrcOutDir() {
        const pref = this.config.preference;
        const dirDec = pref.dirDeclaration;
        const ext = this.config.cli.useTypeScript ? '.ts' : '.js';

        let srcDec = dirDec[pref.srcDec];
        if (srcDec == undefined) {
            const srcDir = await ask(`Source Dir `, 'src');
            pref.srcDec = 'src';
            dirDec[pref.srcDec] = {
                dirPath: srcDir,
                fileDeclaration: await this.fillFilewiseDec('src', {
                    code: { extension: ext },
                    designer: { extension: `.designer${ext}` },
                })
            };
            srcDec = dirDec[pref.srcDec];
        }
        if (!this.config.cli.useTypeScript) {
            pref.outDec = pref.srcDec;
        } else {
            let outDec = dirDec[pref.outDec];
            if (outDec == undefined) {
                const outDir = await ask(`Output Dir `, 'out');
                pref.outDec = 'out';
                dirDec[pref.outDec] = {
                    dirPath: outDir,
                    fileDeclaration: await this.fillFilewiseDec('out', {
                        code: { extension: '.js' },
                        designer: { extension: '.designer.js' },
                    })
                };
                outDec = dirDec[pref.outDec];
            }
        }

        if (pref.fileCommonDeclaration == undefined) {
            console.log(`
---------------------------+
COMMON DECLARATION         |
---------------------------+
`);
            pref.fileCommonDeclaration = await this.fillFilewiseDec('common', {
                designer: { subDirPath: 'designerFiles' },
                scss: { extension: '.scss' },
                html: { extension: '.html' },
            });
        }
    }
    private fillFilewiseDec = async (dirDec: string, fdecList: { [key: string]: IFileDeclaration }) => {
        if ((await askYesNo('   set detail?', false)) == false) {
            return fdecList;
        }
        for (const [key, val] of Object.entries(fdecList)) {
            val.subDirPath = val.subDirPath ?? '';
            val.extension = val.extension ?? '';
            fdecList[key] = await this.fillFdecItem(`${dirDec} => ${key}`, val);
        }
    }
    private async fillFdecItem(title: string, fdec: IFileDeclaration) {
        if (await askYesNo('setup default detail?', false) == false) {
            return fdec;
        }
        fdec.subDirPath = await ask(`FOR :- ${title}
Sub Directory Path (inside source directory) : `, fdec.subDirPath ?? '');
        fdec.extension = await ask(`Extension : `, fdec.extension ?? '');
    }
    private async doNewSurveys() {

        const depNeed = ['uc-runtime'];
        if (this.config.cli.useTypeScript)
            depNeed.push('typescript', '@types/node');
        const remained = await this.dependancyChecker.ensureDependencies(depNeed);
        await this.doInquiryForNewJoinee();
    }

    private async doInquiryForNewJoinee() {
        if (this.QUERY.JUST_INSTALLED['uc-runtime'] != undefined) {
            await this._cliUcconfigInq.generateUcConfig();
            if (this._cliUcconfigInq.exist)
                await this._cliUcconfigInq.read();
        }
        await this._cliElectronInq.generate();
        if (this.QUERY.JUST_INSTALLED['typescript'] != undefined) {
            await this._cliTypeScriptInq.inquiry();
        }
    }
    async checkBasicNeed(inquiry = true) {

        this.projectDir = getProjectDir(process.cwd());
        if (this.projectDir == null) {
            await makesure_package_exist();
            this.projectDir = getProjectDir(process.cwd());
            if (this.projectDir == null) {
                throw Error('NO PROJECT FOUND');
            }
        }
        this.dependancyChecker = new cliDependancyChecker(this);
        await this.updateDependancies();
        const depNeed = ['uc-runtime'];
        if (inquiry) {
            if (this.config.cli.useTypeScript)
                depNeed.push('typescript', '@types/node');
            await this.dependancyChecker.ensureDependencies(depNeed);
        }
    }


    updateDependancies() {
        if (this.projectDir != undefined) {
            this.dependentProjects = this.listProjectDependencies();
        }
    }

    listProjectDependencies(): string[] {
        const pkgPath = path.resolve(this.projectDir, "package.json");
        if (!existsSync(pkgPath)) {
            throw new Error("package.json not found in project directory");
        }
        const pkgJson = JSON.parse(
            readFileSync(pkgPath, "utf-8")
        );
        const deps = {
            ...pkgJson.dependencies,
            ...pkgJson.optionalDependencies,
            ...pkgJson.devDependencies
        };
        return Object.keys(deps ?? {});
    }

    async startBuild() {
        if (this._cliUcconfigInq.exist) {
            await BuildingProcess.startBuild(this.projectDir);
            /*if (BuildingProcess.FILE_COUNT_OF_PREV_BUILD == 0) {
                await this._cliNewStart.inquiry();
            }*/
        } else {
            await cli_menu_MainMenu(this, undefined);//this._cliQuickSetup.inquiry(true);
        }
    }
}