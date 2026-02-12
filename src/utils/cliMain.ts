import path from "path";
import { cliDependancyChecker } from "./cliDependancyChecker.js";
import { findProject, getProjectDir } from "./cliFindProjects.js";
import { existsSync, readFileSync } from "fs";
import { askYesNo } from "./prompt.js";
import { cliUcconfigInquiry } from "./cliUcconfigInquiry.js";
import type { UserUCConfig } from "ap-shared-core/out/ucbuilder/configResources.js";
import { ImportUserConfig } from "ap-shared-core/out/ucbuilder-devtools/userConfigManage.js";
import { cliElectronInquiry } from "./cliElectronInquiry.js";
import { BuildingProcess } from "../lib/BuildingProcess.js";
export class cliOptions {
    yes? = false;
    force? = false;

}
export class cliMain {
    cliOptions = new cliOptions();
    projectDir: string;
    useTypescript = true;
    hasConfigFound = false;
    ucConfig: UserUCConfig;
    dependancyChecker: cliDependancyChecker;
    dependentProjects: string[];
    _cliUcconfigInq: cliUcconfigInquiry;
    _cliElectronInq: cliElectronInquiry;
    constructor() { }
    private async doNewSurveys() {
        this.useTypescript = await askYesNo(`IS TYPESCRIPT PROJECT ? 
==>`, this.useTypescript);
        let newInstalled = await this.dependancyChecker.ensureDependencies({
            electron: true,
            typescript: this.useTypescript,
            ucbuilder: true,
        });
        await this._cliUcconfigInq.inquiry();
        if (this._cliUcconfigInq.exist)
            await this._cliUcconfigInq.read();

        if (newInstalled.includes('electron')) {
            await this._cliElectronInq.inquiry();
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
        if (!this._cliUcconfigInq.exist) {
            await this.doNewSurveys();
        } else {
            const oldValue = this.cliOptions.yes;
            this.cliOptions.yes = true;
            let newInstalled = await this.dependancyChecker.ensureDependencies({
                electron: true,
                ucbuilder: false,
            });
            await this._cliUcconfigInq.read();

            this.useTypescript = this.ucConfig.useTypeScript;
            if (newInstalled.includes('electron')) {
                await this._cliElectronInq.inquiry();
            }
            newInstalled = await this.dependancyChecker.ensureDependencies({
                typescript: this.ucConfig.useTypeScript,
            });

            this.cliOptions.yes = oldValue;
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
        }
    }
}