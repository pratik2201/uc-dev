import { cliDependancyChecker } from "./cliDependancyChecker.js";

export class cliMain {
    projectDir: string;
    dependancyChecker: cliDependancyChecker;
    constructor() {
        this.projectDir = process.cwd();
        this.dependancyChecker = new cliDependancyChecker(this);
    }
}