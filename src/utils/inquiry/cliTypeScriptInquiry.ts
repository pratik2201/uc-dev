import { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { fileURLToPath } from "node:url";

export class cliTypeScriptInquiry {
    constructor(public main: cliMain) { }
    async inquiry() {
        if (this.main.meta.useTypescript && !existsSync(resolve('tsconfig.json'))) {
            if (await askYesNo(
                `
ADD 'tsconfig.json' with required settings?
>`, true)) {
                try {
                    const outDir = this.main.meta.outDir;
                    const srcDir = this.main.meta.srcDir;
                    writeFileSafely(
                        resolve('tsconfig.json'),
                        _runTemplate('templates/typescript/json.tsconfig', {
                            outDir, srcDir
                        }),
                        this.main.cliOptions);
                    console.log('Done...');
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