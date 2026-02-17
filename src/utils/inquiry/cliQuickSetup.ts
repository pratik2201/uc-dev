import { extractPathConfig, UserUCConfig } from "ap-shared-core/out/uc-control/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { commonGeneratorX } from "../../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cliMain } from "../cliMain.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ensureDirectoryExistence, relativeFilePath, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { fileURLToPath } from "node:url";
import { ucUtil } from "ap-shared-core/out/uc-control/ucUtil.js";

export class cliQuickSetup {
    constructor(public main: cliMain) { }
    async inquiry(askFirst = true) {
        const cfg = new UserUCConfig();

        if (askFirst)
            if (await askYesNo(`SETUP UC CONFIG FILE ?
>`, false) == false) return;
        console.log(`
+----------------------------------------+
|              QUICK SETUP               |
+----------------------------------------+`);
        const meta = this.main.meta;

        meta.useTypescript = await askYesNo(`USE TYPESCRIPT?
>`, true);
        const fileExt = meta.useTypescript ? '.ts' : '.js';
        cfg.useTypeScript = this.main.meta.useTypescript;

        meta.srcDir = await ask(`SOURCE DIRECTORY (SPECIFY DIRPATH)
>`, "src");

        meta.outDir = meta.useTypescript ? await ask(`OUTPUT DIRECTORY (SPECIFY DIRPATH)
>`, "out") : meta.srcDir;

        meta.designerDir = await ask(`DESIGNER DIRECTORY (SPECIFY DIRPATH (INSIDE '${meta.srcDir}'))
>`, "designerFiles");

        meta.resourceFilePath = await ask(`RESOURCE FILE PATH (SPECIFY FILEPATH (INSIDE '${meta.srcDir}'))
>`, `${meta.designerDir}/Resources${fileExt}`);

        console.log('-------------------- ELECTRON SETUP -------------------');


        meta.mainProcessFilePath = await ask(`
PROJECT DIR :- ${meta.projectDir}
Main file
==> `, `main/index${fileExt}`);

        meta.preloadScriptFilePath = await ask(`Preload file
==>`, `preload/index${fileExt}`);

        meta.htmlFilePath = await ask(`HTML file that will initialy load in browser
==>`, 'index.html');

        meta.cssFilePath = await ask(`Base .scss (stylesheet) file
==>`, 'styles.scss');

        meta.codeFilePath = await ask(`Renderer Ts/Js File Loaded in Html file (Entry Point)
==>`, `renderer/index${fileExt}`);


        let filesToMove = meta.useTypescript ? '.jpg,.png,.html,.scss,.ico,.svg' : "";
        let ignoreInBuild = `node_modules;.git;.vscode${meta.useTypescript ? ';' + meta.outDir : ''}`;


        //         if (meta.useTypescript) {
        //             filesToMove = await ask(`RUNTIME EXTRA FILES (SPECIFY EXTENSIONS)
        // >`, '.jpg,.png,.html,.scss,.ico,.svg') ?? '';
        //         }


        const browser = cfg.browser;
        browser.baseHtmlPath = meta.htmlFilePath;
        browser.baseCssPath = meta.cssFilePath;

        browser.baseCodePath = meta.codeFilePath;



        //let x = extractPathConfig(cfg);
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
        pref.dirDeclaration['src'] = {
            dirPath: meta.srcDir,
            fileDeclaration: {
                code: { extension: '.ts' },
                designer: { extension: '.designer.ts' },
            }
        }
        if (cfg.useTypeScript) {
            pref.outDec = 'out';
            pref.dirDeclaration['out'] = {
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
        //const x = extractPathConfig(cfg);
        try {
            const _SRC_DIR = join(meta.projectDir, meta.srcDir);
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

            const rendererIndexFilePath = join(meta.projectDir, meta.outDir, meta.codeFilePath);
            writeFileSafely(
                join(_SRC_DIR, meta.codeFilePath),
                _runTemplate('templates/electron/ts.renderer', {
                    startUpCode: ``
                }),
                this.main.cliOptions);

            const rendererHtmlFilePath = join(meta.projectDir, meta.htmlFilePath);
            writeFileSafely(
                rendererHtmlFilePath,
                _runTemplate('templates/electron/html.renderer', {
                    indexFilePath: ucUtil.changeExtension(relativeFilePath(rendererHtmlFilePath, rendererIndexFilePath), '.ts', '.js')
                }),
                this.main.cliOptions);

            const preloadScriptFilePath = join(meta.projectDir, meta.srcDir, meta.preloadScriptFilePath);
            writeFileSafely(
                preloadScriptFilePath,
                _runTemplate('templates/electron/ts.preload', {}),
                this.main.cliOptions);


            const resourceFilePath = join(meta.projectDir, meta.srcDir, meta.resourceFilePath);
            const mainIndexFilePath = join(meta.projectDir, meta.srcDir, meta.mainProcessFilePath);
            writeFileSafely(
                mainIndexFilePath,
                _runTemplate('templates/electron/ts.main', {
                    nodeIntegration: false,
                    contextIsolation: true,
                    removeMenu: true,
                    devtools: true,
                    resourcePath: ucUtil.changeExtension(relativeFilePath(mainIndexFilePath, resourceFilePath), '.ts', '.js'),
                    preloadPath: ucUtil.changeExtension(relativeFilePath(mainIndexFilePath, preloadScriptFilePath), '.ts', '.js'),
                    rendererHtmlPath: relativeFilePath(mainIndexFilePath, rendererHtmlFilePath),
                }),
                this.main.cliOptions);



            if (cfg.browser.baseHtmlPath?.trim().length > 0) {
                const _projectBaseHtmlPath = resolve(cfg.browser.baseHtmlPath);
                ensureDirectoryExistence(_projectBaseHtmlPath);
                if (!existsSync(_projectBaseHtmlPath))
                    writeFileSync(_projectBaseHtmlPath, '', { encoding: 'utf-8' });
            }

            const _ResourceStorageFile = resolve(dirdec[pref.srcDec].dirPath, pref.build.ResourceStorageFile);
            ensureDirectoryExistence(_ResourceStorageFile);

            writeFileSync(_ResourceStorageFile, 'export {};', { encoding: 'utf-8' });
            console.log('.... UC CONFIG FILE GENERATED ...');

            if (meta.useTypescript && !existsSync(resolve('tsconfig.json'))) {
                this.main._cliTypeScriptInq.inquiry();
            }
            const vscodeSettingsFile = resolve('.vscode/settings.json');
            if (isVSCode() && !existsSync(vscodeSettingsFile)) {
                if (await askYesNo(`USE TYPESCRIPT?
>`, true)) {
                    writeFileSafely(
                        vscodeSettingsFile,
                        _runTemplate('templates/.vscode/json.settings', {}),
                        this.main.cliOptions);
                }

            }
        } catch (e) {
            console.log(e);
        }
    }
}
function isVSCode() {
    return !!(
        process.env.VSCODE_PID ||
        process.env.VSCODE_IPC_HOOK ||
        process.env.TERM_PROGRAM === "vscode"
    );
}
function _runTemplate(rel: string, options: any) {
    return runTemplate(resolveFilePath(import.meta.url, rel), import.meta.url, options);
}

