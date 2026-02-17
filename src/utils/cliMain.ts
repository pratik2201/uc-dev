import path, { resolve } from "path";
import { cliDependancyChecker } from "./cliDependancyChecker.js";
import { findProject, getProjectDir } from "./cliFindProjects.js";
import { existsSync, readFileSync } from "fs";
import { askYesNo } from "./prompt.js";
import { cliUcconfigInquiry } from "./inquiry/cliUcconfigInquiry.js";
import type { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { cliElectronInquiry } from "./inquiry/cliElectronInquiry.js";
import { BuildingProcess } from "../lib/BuildingProcess.js";
import { cliTypeScriptInquiry } from "./inquiry/cliTypeScriptInquiry.js";
import { cliNewStartInquiry } from "./inquiry/cliNewStartInquiry.js";
import { cliQuickSetup } from "./inquiry/cliQuickSetup.js";
export class cliOptions {
    yes? = false;
    force? = false;
}
class metaInfo {
    projectDir: string;

    srcDir: string;
    designerDir: string;
    outDir: string;

    useTypescript: boolean;
    mainProcessFilePath: string;
    preloadScriptFilePath: string;
    resourceFilePath: string
    htmlFilePath: string;
    codeFilePath: string;
    cssFilePath: string;
}
export class cliMain {
    cliOptions = new cliOptions();

    QUERY = {
        JUST_ELECTRON_INSTALLED: false,
        rendererIndexFilePath: undefined,
        JUST_TYPESCRIPT_INSTALLED: false,
        JUST_UCBUILDER_INSTALLED: false,
    }
    meta = new metaInfo();
    // useTypescript = true;
    hasConfigFound = false;
    ucConfig: UserUCConfig;
    // static TEMPLATE_DIR = resolve(`assets/ucbuilder/templates`);
    dependancyChecker: cliDependancyChecker;
    dependentProjects: string[];
    _cliUcconfigInq: cliUcconfigInquiry;
    _cliNewStart: cliNewStartInquiry;
    _cliElectronInq: cliElectronInquiry;
    _cliTypeScriptInq: cliTypeScriptInquiry;
    _cliQuickSetup: cliQuickSetup;
    constructor() {
        this._cliUcconfigInq = new cliUcconfigInquiry(this);
        this._cliTypeScriptInq = new cliTypeScriptInquiry(this);
        this._cliElectronInq = new cliElectronInquiry(this);
        this._cliNewStart = new cliNewStartInquiry(this);
        this._cliQuickSetup = new cliQuickSetup(this);
    }
    private async doNewSurveys() {
        this.meta.useTypescript = await askYesNo(`IS TYPESCRIPT PROJECT ? 
==>`, this.meta.useTypescript);
        await this.dependancyChecker.ensureDependencies({
            electron: true,
            typescript: this.meta.useTypescript,
            ucbuilder: true,
        });
        this.QUERY.JUST_UCBUILDER_INSTALLED = true;
        await this.doInquiryForNewJoinee();

    }

    private async doInquiryForNewJoinee() {

        if (this.QUERY.JUST_UCBUILDER_INSTALLED) {
            await this._cliUcconfigInq.inquiry();
            if (this._cliUcconfigInq.exist)
                await this._cliUcconfigInq.read();
        }
        if (this.QUERY.JUST_ELECTRON_INSTALLED) {
            await this._cliElectronInq.inquiry();
        }
        if (this.QUERY.JUST_TYPESCRIPT_INSTALLED) {
            await this._cliTypeScriptInq.inquiry();
        }

    }
    async checkBasicNeed() {
        this.meta.projectDir = await getProjectDir(process.cwd());
        if (this.meta.projectDir == null) {
            throw Error('NO PROJECT FOUND');
        }
        this.dependancyChecker = new cliDependancyChecker(this);
        this.updateDependancies();
        await this.dependancyChecker.ensureDependencies({
            electron: true,
            typescript: true,
            ucbuilder: true,
        })
    }
    async setup() {



        //
        //
        // 
        await this._cliQuickSetup.inquiry(false);

        /*if (!this._cliUcconfigInq.exist) {
             await this.doNewSurveys();
         } else {
             await this.dependancyChecker.ensureDependencies({
                 electron: true,
                 ucbuilder: false,
             });
             await this._cliUcconfigInq.read();
             this.meta.useTypescript = this.ucConfig.useTypeScript;
             if (this.QUERY.JUST_ELECTRON_INSTALLED) {
                 await this._cliElectronInq.inquiry();
             }
             await this.dependancyChecker.ensureDependencies({
                 typescript: this.ucConfig.useTypeScript,
             });
 
             if (this.QUERY.JUST_TYPESCRIPT_INSTALLED) {
                 await this._cliTypeScriptInq.inquiry();
             }
         }*/
    }
    async updateDependancies() {
        if (this.meta.projectDir != undefined) {
            this.dependentProjects = this.listProjectDependencies();
        }
    }

    listProjectDependencies(): string[] {
        const pkgPath = path.resolve(this.meta.projectDir, "package.json");
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
            await BuildingProcess.startBuild(this.meta.projectDir);
            if (BuildingProcess.FILE_COUNT_OF_PREV_BUILD == 0) {
                await this._cliNewStart.inquiry();
            }
        } else {
            await this._cliQuickSetup.inquiry(true);
        }
    }
}