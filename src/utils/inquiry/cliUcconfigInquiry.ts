import { extractPathConfig, UserUCConfig } from "ap-shared-core/core-common.js";
import { ImportUserConfig } from "ap-shared-core/core-main.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { askYesNo, runTemplate, writeFileSafely } from "../prompt.js";

export class cliUcconfigInquiry {
    constructor(public main: cliMain) { }
    get exist() {
        return existsSync(this.configFilepath);
    }
    async read() {

        this.main.config = await ImportUserConfig(this.configFilepath);

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
            await this.generateUcConfig();
        }
        return quickSetup;
    }
    async generateUcConfig() {
        //const defaults = this.inferConfigFromKnownFiles();
        const cfg = this.main.config ?? new UserUCConfig();

        const cli = cfg.cli;
        const pref = cfg.preference;
        const fileExt = cfg.cli.useTypeScript ? '.ts' : '.js';
        const x = extractPathConfig(cfg);
        pref.srcDec = 'src';
        pref.outDec = 'out';
        const dirDec = pref.dirDeclaration;
        if (pref.dirDeclaration[pref.srcDec] == undefined) {
            dirDec[pref.srcDec] = dirDec[pref.srcDec] ?? {
                dirPath: cli.srcDir,
                fileDeclaration: {
                    code: { extension: '.ts' },
                    designer: { extension: '.designer.ts' },
                }
            }
        }
        if (cli.useTypeScript) {
            if (pref.dirDeclaration[pref.outDec] == undefined) {
                dirDec[pref.outDec] = dirDec[pref.outDec] ?? {
                    dirPath: cli.outDir,
                    fileDeclaration: {
                        code: { extension: '.js' },
                        designer: { extension: '.designer.js' },
                    }
                }
            }
        }
        pref.build.ignorePath = cli.ignoreInBuild.split(';');
        pref.build.ignorePath.push('node_modules');
        pref.build.ignorePath = [...new Set(pref.build.ignorePath)] as unknown as Array<string>;
        cfg.guid = crypto.randomUUID();
        if (cli.useTypeScript) {
            const fitems = cli.filesToMove.split(',');
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

        pref.fileCommonDeclaration = {
            designer: { subDirPath: cli.designerDir },
            scss: { extension: '.scss' },
            html: { extension: '.html' }
        }
        try {
            //console.log(JSON.stringify(cfg));
            await writeFileSafely(
                resolve('ucconfig.js'),
                _runTemplate('templates/js.ucconfig', JSON.parse(JSON.stringify(cfg))),
                this.main.cliOptions);
            
            // if (cfg.cli.baseCssPath?.trim().length > 0) {
            //     const _projectBaseCssPath = resolve(cfg.cli.baseCssPath);
            //     ensureDirectoryExistence(_projectBaseCssPath);
            //     if (!existsSync(_projectBaseCssPath))
            //         writeFileSync(_projectBaseCssPath, '', { encoding: 'utf-8' });
            // }
            // if (cfg.cli.baseHtmlPath?.trim().length > 0) {
            //     const _projectBaseHtmlPath = resolve(cfg.cli.baseHtmlPath);
            //     ensureDirectoryExistence(_projectBaseHtmlPath);
            //     if (!existsSync(_projectBaseHtmlPath))
            //         writeFileSync(_projectBaseHtmlPath, '', { encoding: 'utf-8' });
            // }
            // const _ResourceStorageFile = resolve(dirdec[pref.srcDec].dirPath, cfg.cli.ResourceStorageFile);
            // ensureDirectoryExistence(_ResourceStorageFile);
            // writeFileSync(_ResourceStorageFile, 'export {};', { encoding: 'utf-8' });
            // console.log('.... UC CONFIG FILE GENERATED ...');

        } catch (e) {
            console.log(e);
        }
    }
}
function _runTemplate(rel: string, options: any) {
    //console.log(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel));

    return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
