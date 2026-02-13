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
export class cliOptions {
    yes? = false;
    force? = false;

}
export class cliMain {
    cliOptions = new cliOptions();
    projectDir: string;
    QUERY = {
        JUST_ELECTRON_INSTALLED: false,
        rendererIndexFilePath: undefined,
        JUST_TYPESCRIPT_INSTALLED: false,
        JUST_UCBUILDER_INSTALLED: false,
    }
    useTypescript = true;
    hasConfigFound = false;
    ucConfig: UserUCConfig;
    // static TEMPLATE_DIR = resolve(`assets/ucbuilder/templates`);
    dependancyChecker: cliDependancyChecker;
    dependentProjects: string[];
    _cliUcconfigInq: cliUcconfigInquiry;
    _cliNewStart: cliNewStartInquiry;
    _cliElectronInq: cliElectronInquiry;
    _cliTypeScriptInq: cliTypeScriptInquiry;
    constructor() { }
    private async doNewSurveys() {
        this.useTypescript = await askYesNo(`IS TYPESCRIPT PROJECT ? 
==>`, this.useTypescript);
        await this.dependancyChecker.ensureDependencies({
            electron: true,
            typescript: this.useTypescript,
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
    async init() {
        this.projectDir = await getProjectDir(process.cwd());

        if (this.projectDir == null) {
            throw Error('NO PROJECT FOUND');
        }
        this.dependancyChecker = new cliDependancyChecker(this);
        this.updateDependancies();
        this._cliUcconfigInq = new cliUcconfigInquiry(this);
        this._cliElectronInq = new cliElectronInquiry(this);
        this._cliTypeScriptInq = new cliTypeScriptInquiry(this);
        this._cliNewStart = new cliNewStartInquiry(this);
        if (!this._cliUcconfigInq.exist) {
            await this.doNewSurveys();
        } else {

            const oldValue = this.cliOptions.yes;
            //this.cliOptions.yes = true;
            await this.dependancyChecker.ensureDependencies({
                electron: true,
                ucbuilder: false,
            });
            await this._cliUcconfigInq.read();
            this.useTypescript = this.ucConfig.useTypeScript;
            if (this.QUERY.JUST_ELECTRON_INSTALLED) {
                await this._cliElectronInq.inquiry();
            }

            await this.dependancyChecker.ensureDependencies({
                typescript: this.ucConfig.useTypeScript,
            });
            // console.log(this.QUERY.JUST_TYPESCRIPT_INSTALLED);

            if (this.QUERY.JUST_TYPESCRIPT_INSTALLED) {
                await this._cliTypeScriptInq.inquiry();
            }
            //this.cliOptions.yes = oldValue;


        }


    }
    async updateDependancies() {
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
        await this.init();
        if (this._cliUcconfigInq.exist) {
            await BuildingProcess.startBuild(this.projectDir);
            if (BuildingProcess.FILE_COUNT_OF_PREV_BUILD == 0) {
                await this._cliNewStart.inquiry();
            }
        }
    }
}