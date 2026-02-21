import path, { resolve } from "path";
import { cliDependancyChecker } from "./cliDependancyChecker.js";
import { findProject, getProjectDir } from "./cliFindProjects.js";
import { existsSync, readFileSync } from "fs";
import { askYesNo } from "./prompt.js";
import { cliUcconfigInquiry } from "./inquiry/cliUcconfigInquiry.js";
import type { UserUCConfig } from "ap-shared-core/out/uc-runtime/configResources.js";
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
        JUST_INSTALLED: [] as string[],
        //JUST_ELECTRON_INSTALLED: false,
        rendererIndexFilePath: undefined,
        //JUST_TYPESCRIPT_INSTALLED: false,
        //JUST_UCBUILDER_INSTALLED: false,
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
        this.meta.projectDir = process.cwd();
        this._cliUcconfigInq = new cliUcconfigInquiry(this);
        this._cliTypeScriptInq = new cliTypeScriptInquiry(this);
        this._cliElectronInq = new cliElectronInquiry(this);
        this._cliNewStart = new cliNewStartInquiry(this);
        this._cliQuickSetup = new cliQuickSetup(this);
    }
    private async doNewSurveys() {
        this.meta.useTypescript = await askYesNo(`IS TYPESCRIPT PROJECT ? 
==>`, this.meta.useTypescript);
        const depNeed = ['uc-runtime'];
        if (this.meta.useTypescript)
            depNeed.push('typescript', '@types/node');

        await this.dependancyChecker.ensureDependencies(depNeed);

        await this.doInquiryForNewJoinee();

    }

    private async doInquiryForNewJoinee() {

        if (this.QUERY.JUST_INSTALLED['uc-runtime'] != undefined) {
            await this._cliUcconfigInq.inquiry();
            if (this._cliUcconfigInq.exist)
                await this._cliUcconfigInq.read();
        }
        //if (this.QUERY.JUST_INSTALLED['electron']) {
        await this._cliElectronInq.inquiry();

        if (this.QUERY.JUST_INSTALLED['typescript'] != undefined) {
            await this._cliTypeScriptInq.inquiry();
        }

    }
    async checkBasicNeed() {
        this.meta.projectDir = getProjectDir(process.cwd());
        if (this.meta.projectDir == null) {
            throw Error('NO PROJECT FOUND');
        }
        this.dependancyChecker = new cliDependancyChecker(this);
        await this.updateDependancies();
        const depNeed = ['uc-runtime'];
        if (this.meta.useTypescript)
            depNeed.push('typescript', '@types/node');
        await this.dependancyChecker.ensureDependencies(depNeed);
    }
    async setup() {
        await this._cliQuickSetup.inquiry(false);
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