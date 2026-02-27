import { UserUCConfig } from "ap-shared-core/core-common.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js"; 
import { ensureDirectoryExistence, ImportUserConfig, resolveFilePath } from "ap-shared-core/core-main.js";
import { fileURLToPath } from "node:url";

export class cliNewStartInquiry {
    constructor(public main: cliMain) { }

    async inquiry() {
        const cfg = await ImportUserConfig(resolve('ucconfig.js'));
        if (await askYesNo(`
+-----------------------------+
|        EMPTY PROJECT        |
+-----------------------------+

ADD BLANK FORM?
>`, false) == false) return;
            
        const pref = cfg.preference;
        const srcdec = pref.dirDeclaration[pref.srcDec];
        let __dpath = "";
        if (cfg.cli.baseCodePath != undefined) {
            const renderDirPath = dirname(cfg.cli.baseCodePath);
            let ddirdpath = await ask(`WHERE TO GENERATE?
INSIDE ('${renderDirPath}' DIRECTORY)
>`, '');
            __dpath = join(resolve(renderDirPath), ddirdpath);
        } else {
            let dirPath = await ask(`WHERE TO GENERATE?
INSIDE ('${srcdec.dirPath}' DIRECTORY)
>`, '');
            __dpath = join(resolve(srcdec.dirPath), dirPath);
        }
        writeFileSafely(
            join(__dpath, 'form1.uc.html'),
            _runTemplate('templates/electron/sample1/form.uc.html.tp', JSON.parse(JSON.stringify(cfg))),
            this.main.cliOptions);
        writeFileSafely(
            join(__dpath, 'form1.uc.scss'),
            _runTemplate('templates/electron/sample1/form.uc.scss.tp', JSON.parse(JSON.stringify(cfg))),
            this.main.cliOptions);
        console.log('.... new form CONFIG FILE GENERATED ...');
    }

}


function _runTemplate(rel: string, options: any) {
    return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}