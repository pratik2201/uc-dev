import { relativeFilePath } from "ap-shared-core/out/ucbuilder-devtools/pathUtil.js";
import { ImportUserConfig } from "ap-shared-core/out/ucbuilder-devtools/userConfigManage.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { commonGeneratorX } from "../lib/processes/commonGeneratorX.js";
import { findProject } from "./cliFindProjects.js";
import { ask, askYesNo, runTemplate } from "./prompt.js";
import { ucUtil } from "ap-shared-core/out/ucbuilder/ucUtil.js";

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
type InitOptions = {
    yes: boolean;
    devtools: boolean;
    force: boolean;
    ts: boolean;
};
export async function interect_ELECTRON(opts: InitOptions) {
    const projectDir = await findProject(process.cwd());
    if (projectDir == undefined) return;
    const ucconfigPath = join(projectDir, 'ucconfig.js');
    const ucConfig = await ImportUserConfig(ucconfigPath);
    const pref = ucConfig.preference;
    const dirDec = pref.dirDeclaration;
    const srcdec = dirDec[pref.srcDec];
    const outdec = dirDec[pref.outDec];
    const options = {

        preloadPath: undefined as string,
        resourcePath: undefined as string,
        rendererHtmlPath: undefined as string,
        rendererIndexPath: undefined as string,
        useTypeScript: opts.ts,
        devtools: opts.devtools,
        fileExt: undefined as string,
        removeMenu: true,
        contextIsolation: true,
        nodeIntegration: false,
    }

    options.useTypeScript = await askYesNo(
        `
        +----------------------------------------+
        |             ELECTRON SETUP             |
        +----------------------------------------+
PROJECT DIR :- ${projectDir}
        
Use Typescript
==> `, options.useTypeScript);
    options.fileExt = options.useTypeScript ? '.ts' : '.js';

    options.contextIsolation = await askYesNo(`Enable contextIsolation? 
==>`, options.contextIsolation);
    options.nodeIntegration = await askYesNo(`Enable nodeIntegration?
==>`, options.nodeIntegration);
    options.removeMenu = await askYesNo(`Remove Menu?
==>`, options.removeMenu);

    const mainFilePath = join(projectDir, await ask(`Main file
==>`, `${join(srcdec.dirPath, 'main/index.ts')}`));

    const preloadFilePath = join(projectDir, await ask(`Preload file
==>`, `${join(srcdec.dirPath, 'preload/index' + options.fileExt)}`));
    const rendererHtmlFilePath = join(projectDir, await ask(`Renderer HTML file
==>`, `${join(srcdec.dirPath, 'renderer/index.html')}`));
    const rendererIndexFilePath = join(projectDir, await ask(`Renderer Ts file (load with HTML file)
==>`, `${join(srcdec.dirPath, 'renderer/index' + options.fileExt)}`));

    const resourceFilePath = join(projectDir, srcdec.dirPath, ucConfig.preference.build.ResourceStorageFile);
    options.preloadPath = relativeFilePath(mainFilePath, preloadFilePath);
    options.resourcePath = relativeFilePath(mainFilePath, resourceFilePath);
    options.rendererHtmlPath = relativeFilePath(mainFilePath, rendererHtmlFilePath);
    options.rendererIndexPath = ucUtil.changeExtension(relativeFilePath(rendererHtmlFilePath, rendererIndexFilePath), '.ts', '.js');

    opts.force = true;
    writeFileSafely(
        mainFilePath,
        runTemplate('../../assets/ucbuilder/templates/electron/ts.main', import.meta.url, options),
        { overrideOld: opts.force });

    writeFileSafely(
        preloadFilePath,
        runTemplate('../../assets/ucbuilder/templates/electron/ts.preload', import.meta.url, options),
        { overrideOld: opts.force });

    writeFileSafely(
        rendererHtmlFilePath,
        runTemplate('../../assets/ucbuilder/templates/electron/html.renderer', import.meta.url, options),
        { overrideOld: opts.force });

    writeFileSafely(
        rendererIndexFilePath,
        runTemplate('../../assets/ucbuilder/templates/electron/ts.renderer', import.meta.url, options),
        { overrideOld: opts.force });

    console.log('.... ELECTRON GENERATED ...');
}
async function writeFileSafely(fpath: string, data: string, options = { overrideOld: false }) {
    if (existsSync(fpath)) {
        const overwrite = options.overrideOld ?? await askYesNo(
            `${fpath} already exists. Overwrite?`,
            false
        );

        if (!overwrite) {
            console.log(`✖ ${fpath} is not overwrited`);
            return;
        }
    }
    commonGeneratorX.ensureDirectoryExistence(fpath);
    writeFileSync(fpath, data, { encoding: 'utf8' });
}

