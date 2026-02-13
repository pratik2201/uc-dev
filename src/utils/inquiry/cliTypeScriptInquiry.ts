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
    /* get exist() {
         return existsSync(this.configFilepath);
     }
      async read() {
 
         this.main.ucConfig = await ImportUserConfig(this.configFilepath);
 
     }
     get configFilepath() {
         return join(this.main.projectDir, 'ucconfig.js');
     }
    inferConfigFromKnownFiles() {
         if (existsSync("tsconfig.json")) {
             const ts = JSON.parse(readFileSync("tsconfig.json", 'utf-8'));
             return {
                 srcDir: ts.compilerOptions?.rootDir ?? "src",
                 outDir: ts.compilerOptions?.outDir ?? "out",
                 designerDir: "designerFiles"
             };
         }
     }
     async askForSetup() {
         let quickSetup = await askYesNo(`QUICK SETUP CONFIG FILE     ?   `, true);
         if (quickSetup) {
             await this.inquiry();
         }
         return quickSetup;
     }*/
    async inquiry() {
        // const defaults = this.inferConfigFromKnownFiles();
        const cfg = await ImportUserConfig(resolve('ucconfig.js'));

        if (this.main.useTypescript && !existsSync(resolve('tsconfig.json'))) {
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

