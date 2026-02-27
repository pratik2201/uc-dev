import { extractPathConfig, UserUCConfig } from "ap-shared-core/core-common.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js"; 
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/core-main.js";
import { fileURLToPath } from "node:url";

export class cliTypeScriptInquiry {
     static async AskIsTypescript(defValue = true) {
        return await askYesNo(`IS TYPESCRIPT PROJECT ? 
==>`, defValue);
    }
    constructor(public main: cliMain) { }
    async inquiry() {
        const x = extractPathConfig(this.main.config);
        if (x.cli.useTypeScript && !existsSync(resolve('tsconfig.json'))) {
            if (await askYesNo(
                `
ADD 'tsconfig.json' with required settings?
>`, true)) {
                try {
                    const outDir = x.outDec.dirPath;
                    const srcDir = x.srcDec.dirPath;
                    // writeFileSafely(
                    //     resolve('tsconfig.json'),
                    //     _runTemplate('templates/typescript/json.tsconfig', {
                    //         outDir,
                    //         srcDir,
                    //         isUcControlsInstalled:this.main.dependentProjects.includes('uc-controls')
                    //     }),
                    //     this.main.cliOptions);
                    // console.log('Done...');
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
}

function _runTemplate(rel: string, options: any) {
    return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}