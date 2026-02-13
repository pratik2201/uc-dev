import { relativeFilePath, resolveFilePath } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { ImportUserConfig } from "ap-shared-core/out/uc-dev/userConfigManage.js";
import { ucUtil } from "ap-shared-core/out/uc-control/ucUtil.js";
import { join, resolve } from "node:path";
import { findProject } from "../cliFindProjects.js";
import { cliMain } from "../cliMain.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";

export class cliElectronInquiry {
        constructor(public main: cliMain) { }

        async inquiry() {
                if (!this.main._cliUcconfigInq.exist) return;
                const projectDir = this.main.projectDir;
                const ucConfig = this.main.ucConfig;
                const pref = ucConfig.preference;
                const dirDec = pref.dirDeclaration;
                const srcdec = dirDec[pref.srcDec];
                const options = {

                        preloadPath: undefined as string,
                        resourcePath: undefined as string,
                        rendererHtmlPath: undefined as string,
                        rendererIndexPath: undefined as string,
                        useTypeScript: this.main.ucConfig.useTypeScript,
                        fileExt: undefined as string,
                        removeMenu: true,
                        devtools: true,
                        contextIsolation: true,
                        nodeIntegration: false,
                }
                options.fileExt = options.useTypeScript ? '.ts' : '.js';

                const mainFilePath = join(projectDir, await ask(`
+----------------------------------------+
|             ELECTRON SETUP             |
+----------------------------------------+
PROJECT DIR :- ${projectDir}
        
Main file
==> `, `${join(srcdec.dirPath, 'main/index.ts')}`));

                const preloadFilePath = join(projectDir, await ask(`Preload file
==>`, `${join(srcdec.dirPath, 'preload/index' + options.fileExt)}`));
                const rendererHtmlFilePath = join(projectDir, await ask(`Renderer HTML file
==>`, `${join(srcdec.dirPath, 'renderer/index.html')}`));
                const rendererIndexFilePath = join(projectDir, await ask(`Renderer Ts file (load with HTML file)
==>`, `${join(srcdec.dirPath, 'renderer/index' + options.fileExt)}`));


                this.main.QUERY.rendererIndexFilePath = rendererIndexFilePath;
                
                options.contextIsolation = await askYesNo(`Enable contextIsolation? 
==>`, options.contextIsolation);
                options.devtools = await askYesNo(`Enable devtools on load?
==>`, options.devtools);
                options.nodeIntegration = await askYesNo(`Enable nodeIntegration?
==>`, options.nodeIntegration);
                options.removeMenu = await askYesNo(`Remove Menu?
==>`, options.removeMenu);


                const resourceFilePath = join(projectDir, srcdec.dirPath, ucConfig.preference.build.ResourceStorageFile);
                options.preloadPath = ucUtil.changeExtension(relativeFilePath(mainFilePath, preloadFilePath), '.ts', '.js');
                options.resourcePath = ucUtil.changeExtension(relativeFilePath(mainFilePath, resourceFilePath), '.ts', '.js');
                options.rendererHtmlPath = relativeFilePath(mainFilePath, rendererHtmlFilePath);
                options.rendererIndexPath = ucUtil.changeExtension(relativeFilePath(rendererHtmlFilePath, rendererIndexFilePath), '.ts', '.js');

                const cliOptions = this.main.cliOptions;
                writeFileSafely(
                        mainFilePath,
                        _runTemplate('templates/electron/ts.main', options),
                        cliOptions);

                writeFileSafely(
                        preloadFilePath,
                        _runTemplate('templates/electron/ts.preload', options),
                        cliOptions);

                writeFileSafely(
                        rendererHtmlFilePath,
                        _runTemplate('templates/electron/html.renderer', options),
                        cliOptions);

                writeFileSafely(
                        rendererIndexFilePath,
                        _runTemplate('templates/electron/ts.renderer', options),
                        cliOptions);

                console.log('.... ELECTRON GENERATED ...');

        }

}
function _runTemplate(rel: string, options: any) {
        return runTemplate(resolveFilePath(import.meta.url, rel), import.meta.url, options);
}

