import { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";

export class cliTypeScriptInquiry {
    constructor(public main: cliMain) { } 
    async inquiry() { 
        const cfg = await ImportUserConfig(resolve('ucconfig.js')); 
        if (this.main.meta.useTypescript && !existsSync(resolve('tsconfig.json'))) {
            if (await askYesNo(
                `
+----------------------------------------+
|              TYPE SCRIPT               |
+----------------------------------------+
ADD 'tsconfig.json' with required settings?
>`, true)) {
                try {
                    writeFileSafely(
                        resolve('tsconfig.json'),
                        runTemplate(resolveFilePath(import.meta.url, 'templates/typescript/json.tsconfig'),
                            import.meta.url,
                            JSON.parse(JSON.stringify(cfg))),
                        this.main.cliOptions);
                    console.log('.... TYPESCRIPT CONFIG FILE GENERATED ...');
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
}

