import { UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { fileURLToPath } from "node:url";

export class cliQuickSetup {
    constructor(public main: cliMain) { }
    async inquiry() {
        const cfg = new UserUCConfig();
        cfg.useTypeScript = this.main.meta.useTypescript;
        if (await askYesNo(`
+----------------------------------------+
|              QUICK SETUP               |
+----------------------------------------+

SETUP UC CONFIG FILE ?
>`, false) == false) return;

        const meta = this.main.meta;

        meta.useTypescript = await askYesNo(`USE TYPESCRIPT?
>`, true);
        const fileExt = meta.useTypescript ? '.ts' : '.js';


        meta.srcDir = await ask(`SOURCE DIRECTORY (SPECIFY DIRPATH)
>`, "src");

        meta.outDir = cfg.useTypeScript ? await ask(`OUTPUT DIRECTORY (SPECIFY DIRPATH)
>`, "out") : meta.srcDir;

        meta.designerDir = await ask(`DESIGNER DIRECTORY (SPECIFY DIRPATH (INSIDE '${meta.srcDir}'))
>`, "designerFiles");

        meta.resourceFilePath = await ask(`RESOURCE FILE PATH (SPECIFY FILEPATH (INSIDE '${meta.srcDir}'))
>`, `${meta.designerDir}/Resources${fileExt}`);


        meta.mainProcessFilePath = await ask(`
PROJECT DIR :- ${meta.projectDir}
Main file
==> `, `${join(meta.srcDir, 'main/index.ts')}`);

        meta.preloadScriptFilePath = await ask(`Preload file
==>`, `${join(meta.srcDir, 'preload/index' + fileExt)}`);

        meta.htmlFilePath = await ask(`Renderer HTML file
==>`, 'index.html');

        meta.codeFilePath = await ask(`Renderer Ts/Js File Loaded in Html file (Entry Point)
==>`, `${join(meta.srcDir, 'renderer/index' + fileExt)}`);


        meta.cssFilePath = await ask(`Base .scss (stylesheet) file
==>`, 'styles.scss');


        let filesToMove = meta.useTypescript ? '.jpg,.png,.html,.scss,.ico,.svg' : "";
        let ignoreInBuild = `node_modules;.git;.vscode${meta.useTypescript ? ';' + meta.outDir : ''}`;

        const browser = cfg.browser;
        browser.baseHtmlPath = meta.htmlFilePath;
        browser.baseCssPath = meta.cssFilePath;

        browser.baseCodePath = meta.codeFilePath;




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
        pref.build.ResourceStorageFile = meta.resourceFilePath;

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
                runTemplate(resolveFilePath(import.meta.url, 'templates/js.ucconfig'), import.meta.url, JSON.parse(JSON.stringify(cfg))),
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

