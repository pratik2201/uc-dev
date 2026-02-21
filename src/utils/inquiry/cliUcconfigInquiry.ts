import { UserUCConfig } from "ap-shared-core/out/uc-runtime/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
        return join(this.main.meta.projectDir, 'ucconfig.js');
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
        cfg.useTypeScript = this.main.meta.useTypescript;
        if (await askYesNo(`
+----------------------------------------+
|              UCCONFIG FILE             |
+----------------------------------------+

SETUP UC CONFIG FILE ?
>`, false) == false) return;


        const fileExt = cfg.useTypeScript ? '.ts' : '.js';
        const meta = this.main.meta;

        meta.srcDir = await ask(`SOURCE DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.srcDir ?? "src");

        meta.outDir = cfg.useTypeScript ? await ask(`OUTPUT DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.outDir ?? "out") : meta.srcDir;

        meta.designerDir = await ask(`DESIGNER DIRECTORY (SPECIFY DIRPATH (INSIDE '${meta.srcDir}'))
>`, "designerFiles");

        const resourceStorageFile = await ask(`RESOURCE FILE PATH (SPECIFY FILEPATH (INSIDE '${meta.srcDir}'))
>`, `${meta.designerDir}/Resources${fileExt}`);



        let filesToMove: string = '';
        if (cfg.useTypeScript) {
            filesToMove = await ask(`RUNTIME EXTRA FILES (SPECIFY EXTENSIONS)
>`, '.jpg,.png,.html,.scss,.ico,.svg') ?? '';
        }
        let ignoreInBuild = await ask(`IGNORE THESE PATH IN BUILD (SPECIFY PATH FROM ROOT)
>`, `node_modules;.git;.vscode${cfg.useTypeScript ? ';' + meta.outDir : ''}`) ?? '';

        const browser = cfg.browser;

        browser.baseHtmlPath = await ask(`BASE HTML FILE PATH (FROM ROOT)
>`, `index.html`) ?? undefined;
        if (browser.baseHtmlPath != undefined && browser.baseHtmlPath.trim().length == 0)
            browser.baseHtmlPath = undefined;

        browser.baseCssPath = await ask(`BASE CSS FILE PATH (FROM ROOT)
>`, `styles.scss`) ?? '';

        browser.baseCodePath = await ask(`BASE CODE FILE PATH (SPECIFY FILEPATH (INSIDE '${meta.srcDir}')')
>`, `${meta.srcDir}/index.${fileExt}`) ?? '';




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
        cfg.browser.resolveProjects = ['uc-runtime', 'uc-dev'] as any;
        pref.build.ResourceStorageFile = resourceStorageFile;

        pref.srcDec = 'src';
        dirdec['src'] = {
            dirPath: meta.srcDir,
            fileDeclaration: {
                code: { extension: '.ts' },
                designer: { extension: '.designer.ts' },
            }
        }
        if (cfg.useTypeScript) {
            pref.outDec = 'out';
            dirdec['out'] = {
                dirPath: meta.outDir,
                fileDeclaration: {
                    code: { extension: '.js' },
                    designer: { extension: '.designer.js' },
                }
            }
        } else pref.outDec = 'src';

        pref.fileCommonDeclaration = {
            designer: { subDirPath: meta.designerDir },
            scss: { extension: '.scss' },
            html: { extension: '.html' }
        }
        try {
            writeFileSafely(
                resolve('ucconfig.js'),
                _runTemplate('templates/js.ucconfig', JSON.parse(JSON.stringify(cfg))),
                this.main.cliOptions);

            if (cfg.browser.baseCssPath?.trim().length > 0) {
                const _projectBaseCssPath = resolve(cfg.browser.baseCssPath);
                ensureDirectoryExistence(_projectBaseCssPath);
                if (!existsSync(_projectBaseCssPath))
                    writeFileSync(_projectBaseCssPath, '', { encoding: 'utf-8' });
            }

            if (cfg.browser.baseHtmlPath?.trim().length > 0) {
                const _projectBaseHtmlPath = resolve(cfg.browser.baseHtmlPath);
                ensureDirectoryExistence(_projectBaseHtmlPath);
                if (!existsSync(_projectBaseHtmlPath))
                    writeFileSync(_projectBaseHtmlPath, '', { encoding: 'utf-8' });
            }
            const _ResourceStorageFile = resolve(dirdec[pref.srcDec].dirPath, cfg.preference.build.ResourceStorageFile);
            ensureDirectoryExistence(_ResourceStorageFile);

            writeFileSync(_ResourceStorageFile, 'export {};', { encoding: 'utf-8' });
            console.log('.... UC CONFIG FILE GENERATED ...');
        } catch (e) {
            console.log(e);
        }
    }
}
function _runTemplate(rel: string, options: any) {
    return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
