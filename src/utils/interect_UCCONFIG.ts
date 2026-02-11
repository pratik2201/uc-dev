import { UserUCConfig } from "ap-shared-core/out/ucbuilder/configResources.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { commonGeneratorX } from "../lib/processes/commonGeneratorX.js";
import { ask, askYesNo, runTemplate } from "./prompt.js";

function inferConfigFromKnownFiles() {
    if (existsSync("tsconfig.json")) {
        const ts = JSON.parse(readFileSync("tsconfig.json", 'utf-8'));
        return {
            srcDir: ts.compilerOptions?.rootDir ?? "src",
            outDir: ts.compilerOptions?.outDir ?? "out",
            designerDir: "designerFiles"
        };
    }
}
export async function askForInit_UCCONFIG() {
    let quickSetup = await askYesNo(
        `QUICK SETUP CONFIG FILE     ?   `, true);
    if (quickSetup) {
        await interect_UCCONFIG();
    }
    return quickSetup;
}
export async function interect_UCCONFIG(options = { useTypeScript: true, overrideOld: false }) {
    const defaults = inferConfigFromKnownFiles();
    const fileExt = options.useTypeScript ? '.ts' : '.js';
    const cfg = new UserUCConfig();


    
    const SRC_DIR_NAME = await ask(
        `
+----------------------------------------+
|   QUICK SETUP UCBUILDER CONFIG FILE    |
+----------------------------------------+
        
SOURCE DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.srcDir ?? "src");

    const OUT_DIR_NAME = options.useTypeScript ? await ask(`OUTPUT DIRECTORY (SPECIFY DIRPATH)
>`, defaults?.outDir ?? "out") : SRC_DIR_NAME;

    const DESIGNER_DIR_NAME = await ask(`DESIGNER DIRECTORY (SPECIFY DIRPATH (INSIDE '${SRC_DIR_NAME}'))
>`, "designerFiles");

    const resourceStorageFile = await ask(`RESOURCE FILE PATH (SPECIFY FILEPATH (INSIDE '${SRC_DIR_NAME}'))
>`, `${DESIGNER_DIR_NAME}/Resources${fileExt}`);
    
    let filesToMove: string = '';
    if (options.useTypeScript) {
        filesToMove = await ask(`RUNTIME EXTRA FILES (SPECIFY EXTENSIONS)
>`, '.jpg,.png,.html,.scss,.ico,.svg') ?? '';
    }
    let ignoreInBuild = await ask(`IGNORE THESE PATH IN BUILD (SPECIFY PATHS)
>`, `node_modules;.git;.vscode${options.useTypeScript ? ';' + OUT_DIR_NAME : ''}`) ?? '';

    cfg.projectBaseCssPath = await ask(`BASE CSS FILE PATH (SPECIFY PATHS)
>`, `styles.scss`) ?? '';

    
    
    

    const pref = cfg.preference;
    const dirdec = pref.dirDeclaration;
    pref.build.ignorePath = ignoreInBuild.split(';');
    pref.build.ignorePath.push('node_modules');
    pref.build.ignorePath = [...new Set(pref.build.ignorePath)] as unknown as Array<string>;

    cfg.guid = crypto.randomUUID();
    if (options.useTypeScript) {
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
    cfg.browser.resolveProjects = ['ucbuilder', 'ucbuilder-devtools'] as any;
    pref.build.ResourceStorageFile = resourceStorageFile;

    pref.srcDec = 'src';
    dirdec['src'] = {
        dirPath: SRC_DIR_NAME,
        fileDeclaration: {
            code: { extension: '.ts' },
            designer: { extension: '.designer.ts' },
        }
    }
    if (options.useTypeScript) {
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
        const cfgStr = runTemplate('../../assets/ucbuilder/templates/js.ucconfig', import.meta.url, JSON.parse(JSON.stringify(cfg)));
        writeUcConfigSafely(cfgStr, options)

        const _projectBaseCssPath = resolve(cfg.projectBaseCssPath);
        if (!existsSync(_projectBaseCssPath))
            writeFileSync(_projectBaseCssPath, '', { encoding: 'utf-8' });

        const _ResourceStorageFile = resolve(dirdec[pref.srcDec].dirPath, cfg.preference.build.ResourceStorageFile);
        commonGeneratorX.ensureDirectoryExistence(_ResourceStorageFile);
        writeFileSync(_ResourceStorageFile, 'export {};', { encoding: 'utf-8' });
        console.log('.... CONFIG FILE GENERATED ...');
    } catch (e) {
        console.log(e);
    }
}
async function writeUcConfigSafely(cfg, options = { overrideOld: false }) {
    if (existsSync("ucconfig.js")) {
        const overwrite = options.overrideOld ?? await askYesNo(
            "ucconfig.js already exists. Overwrite?",
            false
        );

        if (!overwrite) {
            console.log("✖ init cancelled");
            return;
        }
    }

    writeFileSync(resolve('ucconfig.js'), cfg, { encoding: 'utf8' });
}

