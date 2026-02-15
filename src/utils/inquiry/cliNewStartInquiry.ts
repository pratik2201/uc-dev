import { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";

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
        if (this.main.QUERY.rendererIndexFilePath != undefined) {
            const renderDirPath = dirname(this.main.QUERY.rendererIndexFilePath);
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
        console.log('.... new form CONFIG FILE GENERATED ...');
    }

}

function _runTemplate(rel: string, options: any) {
    return runTemplate(resolveFilePath(import.meta.url, rel), import.meta.url, options);
}
