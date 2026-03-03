import { correctpath, extractPathConfig } from "ap-shared-core/core-common.js";
import { relativeFilePath } from "ap-shared-core/core-main.js";
import { ucUtil } from "ap-shared-core/core.js";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { cli_sample_style1 } from "./cli_sample_style1.js";

export class cliElectronInquiry {
      constructor(public main: cliMain) { }

      async generate(hasAddedSampleForm = false) {
            const cfg = this.main.config;
            const cli = cfg.cli;
            const mainFilePath = resolve(join(cli.srcDir, cli.mainProcessFilePath));
            const preloadFilePath = resolve(join(cli.srcDir, cli.preloadScriptFilePath));
            const baseHtmlPath = resolve(cli.baseHtmlPath);
            const baseCodePath = resolve(join(cli.srcDir, cli.baseCodePath));
           
            const baseCodeOutPath = resolve(join(cli.outDir, cli.baseCodePath));
            const ResourceStorageFile = resolve(join(cli.srcDir, cli.ResourceStorageFile));
            const baseCssPath = resolve(cli.baseCssPath);

            /**
             * MAIN FILE GENERATE
             */
            writeFileSafely(
                  mainFilePath,
                  _runTemplate('templates/electron/ts.main', {
                        removeMenu: cli.removeMenu,
                        devtools: cli.devtools,
                        preloadPath: ucUtil.changeExtension(correctpath(relativeFilePath(mainFilePath, preloadFilePath)), '.ts', '.js'),
                        rendererHtmlPath: correctpath(relativeFilePath(mainFilePath, baseHtmlPath)),
                        resourcePath: ucUtil.changeExtension(correctpath(relativeFilePath(mainFilePath, ResourceStorageFile)), '.ts', '.js'),
                  }),
                  this.main.cliOptions);
            /**
             * PRELOAD FILE GENERATE
             */
            writeFileSafely(
                  preloadFilePath,
                  _runTemplate('templates/electron/ts.preload', {}),
                  this.main.cliOptions);

            /**
            * Resource FILE GENERATE
            */
            writeFileSafely(ResourceStorageFile, 'export { };', this.main.cliOptions);

            /**
             * HTML FILE GENERATE
             */
            writeFileSafely(
                  baseHtmlPath,
                  _runTemplate('templates/electron/html.renderer', {
                        indexFilePath:

                              ucUtil.changeExtension(correctpath(relativeFilePath(baseHtmlPath, baseCodeOutPath)), '.ts', '.js'),
                  }),
                  this.main.cliOptions);

            /**
             * SCSS FILE GENERATE
             */
            writeFileSafely(
                  baseCssPath,
                  _runTemplate('templates/electron/css.renderer', {}),
                  this.main.cliOptions);


            //const needSampleForm = await askYesNo('add Sample Form?', true);
             
            /**
              * RENDERER CODE FILE GENERATE
              */
            writeFileSafely(
                  baseCodePath,
                  _runTemplate('templates/electron/ts.renderer', {
                        startUpCode: (
                              hasAddedSampleForm ? `
const { frmDashboard } = await import("./frmDashboard.uc.js");
const frm = await frmDashboard.CreateAsync({ targetElement: document.body });
await frm.ucExtends.showDialog();`: ''
                        )
                  }),
                  this.main.cliOptions);


            return true;
      }
      async askAboutBasePath() {
            const x = extractPathConfig(this.main.config);
            const fileExt = x.cli.useTypeScript ? '.ts' : '.js';
            if (x.cli.useElectron) {

            } else {
                  x.cli.baseHtmlPath = x.cli.baseHtmlPath ?? await ask(`BASE HTML FILE PATH (FROM ROOT)
>`, `index.html`) ?? undefined;

                  x.cli.baseCssPath = x.cli.baseCssPath ?? await ask(`BASE CSS FILE PATH (FROM ROOT)
>`, `styles.scss`) ?? '';

                  x.cli.baseCodePath = x.cli.baseCodePath ?? await ask(`RENDERER SCRIPT FILE (INSIDE '${x.srcDec.dirPath}')
>`, `index.${fileExt}`) ?? '';
            }
      }
}
function _runTemplate(rel: string, options: any) {
      return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}






/*
 // if (!this.main._cliUcconfigInq.exist) {
            //       console.log('SETUP `ucconfig.js` FILE FIRST THAN TRY');
            //       return;
            // }
            const projectDir = this.main.projectDir;
            const ucConfig = this.main.config;
            let x = extractPathConfig(ucConfig);
            if (x.srcDec == undefined || x.outDec == undefined) {
                  await this.main.setupSrcOutDir();
                  x = extractPathConfig(ucConfig);
                  // const srcDir = await ask(`Source Dir `, 'src');
                  // x.pref.dirDeclaration[srcDir] = {
                  //       dirPath: 'src',
                  //       fileDeclaration: {
                  //             html: { extension: '.html' }
                  //       }
                  // }
            }
            //const meta = this.main.meta;
            x.cli.useTypeScript = x.cli.useTypeScript ?? await cliTypeScriptInquiry.AskIsTypescript(true);
            const fileExt = x.cli.useTypeScript ? '.ts' : '.js';
            x.cli.useElectron = await askYesNo(`SETUP ELECTRON ? 
==>`, x.cli.useElectron);
            if (!x.cli.useElectron) return;
            console.log(`
+--------------------------+
|      ELECTRON SETUP      |
+--------------------------+
`);
            x.cli.mainProcessFilePath = await ask(`Main file (inside '${x.srcDec.dirPath}')
==> `, x.cli.mainProcessFilePath ?? `main/index.ts`);
            x.cli.preloadScriptFilePath = await ask(`Preload file
==>`, x.cli.preloadScriptFilePath ?? `preload/index${fileExt}`);
            x.cli.baseCodePath = await ask(`Renderer Ts file (load with HTML file)
==>`, x.cli.baseCodePath ?? `renderer/index${fileExt}`);
            x.cli.baseHtmlPath = (x.cli.baseHtmlPath ?? '') ?? await ask(`Renderer HTML file
==>`, x.cli.baseHtmlPath ?? 'renderer/index.html');

//             x.cli.contextIsolation = await askYesNo(`Enable contextIsolation? 
// ==>`, x.cli.contextIsolation);
//             x.cli.devtools = await askYesNo(`Enable devtools on load?
// ==>`, x.cli.devtools);
//             x.cli.nodeIntegration = await askYesNo(`Enable nodeIntegration?
// ==>`, x.cli.nodeIntegration);
            x.cli.removeMenu = await askYesNo(`Remove Menu?
==>`, x.cli.removeMenu);
            console.log('.... ELECTRON SETUP DONE ...');



*/