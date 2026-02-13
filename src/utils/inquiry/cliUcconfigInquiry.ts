import { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { fileURLToPath } from "node:url";

export class cliUcconfigInquiry {
    constructor(public main: cliMain) { }
    get exist() {
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
    }
    async inquiry() {
        const defaults = this.inferConfigFromKnownFiles();
        const cfg = new UserUCConfig();
        cfg.useTypeScript = this.main.useTypescript;
        const SRC_DIR_NAME = await ask(
            `
+----------------------------------------+
|              UCCONFIG FILE             |
+----------------------------------------+
        
SOURCE DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.srcDir ?? "src");
        const fileExt = cfg.useTypeScript ? '.ts' : '.js';




        const OUT_DIR_NAME = cfg.useTypeScript ? await ask(`OUTPUT DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.outDir ?? "out") : SRC_DIR_NAME;

        const DESIGNER_DIR_NAME = await ask(`DESIGNER DIRECTORY (SPECIFY DIRPATH (INSIDE '${SRC_DIR_NAME}'))
>`, "designerFiles");

        const resourceStorageFile = await ask(`RESOURCE FILE PATH (SPECIFY FILEPATH (INSIDE '${SRC_DIR_NAME}'))
>`, `${DESIGNER_DIR_NAME}/Resources${fileExt}`);

        let filesToMove: string = '';
        if (cfg.useTypeScript) {
            filesToMove = await ask(`RUNTIME EXTRA FILES (SPECIFY EXTENSIONS)
>`, '.jpg,.png,.html,.scss,.ico,.svg') ?? '';
        }
        let ignoreInBuild = await ask(`IGNORE THESE PATH IN BUILD (SPECIFY PATHS)
>`, `node_modules;.git;.vscode${cfg.useTypeScript ? ';' + OUT_DIR_NAME : ''}`) ?? '';

        cfg.projectBaseCssPath = await ask(`BASE CSS FILE PATH (SPECIFY PATHS)
>`, `styles.scss`) ?? '';





        const pref = cfg.preference;
        const dirdec = pref.dirDeclaration;
        pref.build.ignorePath = ignoreInBuild.split(';');
        pref.build.ignorePath.push('node_modules');
        pref.build.ignorePath = [...new Set(pref.build.ignorePath)] as unknown as Array<string>;

        cfg.guid = crypto.randomUUID();
        if (cfg.useTypeScript) {
            const fitems = filesToMove.split(',');
            if (fitems.length > 0) {
                cfg.preference.build.RuntimeResources = [
                    {
                        fromDeclare: 'src', toDeclares: ['out'], includeCallback: undefined,
                        includeExtensions: fitems
                    }
                ];
            }
        }
        cfg.browser.resolveProjects = ['uc-control', 'uc-dev'] as any;
        pref.build.ResourceStorageFile = resourceStorageFile;

        pref.srcDec = 'src';
        dirdec['src'] = {
            dirPath: SRC_DIR_NAME,
            fileDeclaration: {
                code: { extension: '.ts' },
                designer: { extension: '.designer.ts' },
            }
        }
        if (cfg.useTypeScript) {
            pref.outDec = 'out';
            dirdec['out'] = {
                dirPath: OUT_DIR_NAME,
                fileDeclaration: {
                    code: { extension: '.js' },
                    designer: { extension: '.designer.js' },
                }
            }
        } else pref.outDec = 'src';

        pref.fileCommonDeclaration = {
            designer: { subDirPath: DESIGNER_DIR_NAME },
            scss: { extension: '.scss' },
            html: { extension: '.html' }
        } 
        try { 
            writeFileSafely(
                resolve('ucconfig.js'),
                runTemplate(resolveFilePath(import.meta.url, 'templates/js.ucconfig'), import.meta.url, JSON.parse(JSON.stringify(cfg))),
                this.main.cliOptions);

            const _projectBaseCssPath = resolve(cfg.projectBaseCssPath);
            ensureDirectoryExistence(_projectBaseCssPath);
            if (!existsSync(_projectBaseCssPath))
                writeFileSync(_projectBaseCssPath, '', { encoding: 'utf-8' });

            const _ResourceStorageFile = resolve(dirdec[pref.srcDec].dirPath, cfg.preference.build.ResourceStorageFile);
            ensureDirectoryExistence(_ResourceStorageFile);

            writeFileSync(_ResourceStorageFile, 'export {};', { encoding: 'utf-8' });
            console.log('.... UC CONFIG FILE GENERATED ...');
        } catch (e) {
            console.log(e);
        }
    }
}

