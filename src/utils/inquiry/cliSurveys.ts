 
import { cliMain } from "../cliMain.js";
import { ask, askYesNo, runTemplate } from "../prompt.js";
import { cliTypeScriptInquiry } from "./cliTypeScriptInquiry.js";
import { dirname, join } from "path";
import { correctpath, extractPathConfig } from "ap-shared-core/core-common.js";
import { fileURLToPath } from "url";

export class cliSurveys {
  constructor(public main: cliMain) { }
  async inquiry() {
    const projectDir = this.main.projectDir;
    const cfg = this.main.config;
    const cli = cfg.cli;
    cli.useTypeScript = await askYesNo('is Typescript Project ?', cli.useTypeScript);
    cli.useElectron = await askYesNo('is Electron Project ?', cli.useElectron);
    cli.srcDir = await ask(`src dir :`, cli.srcDir ?? 'src');
    cli.outDir = await ask(`out dir :`, cli.outDir ?? 'out');
    cli.designerDir = await ask(`designer dir (in ${cli.srcDir} directory) :`, cli.designerDir ?? 'designerFiles');

    cli.codeFileExt = await ask(`CodeFile Ext. :`, cli.codeFileExt ?? '.ts');

    if (cli.useTypeScript) cli.outputFileExt = await ask(`Output File Ext. :`, cli.outputFileExt ?? '.js');
    else cli.outputFileExt = cli.codeFileExt;

    if (cli.useElectron) {
      cli.mainProcessFilePath = await ask(`main filepath (in ${cli.srcDir} directory):`, cli.mainProcessFilePath ?? `main/index${cli.codeFileExt}`);
      cli.preloadScriptFilePath = await ask(`preload filepath (in ${cli.srcDir} directory):`, cli.preloadScriptFilePath ?? `preload/index${cli.codeFileExt}`);
      cli.baseCodePath = await ask(`renderer filepath (in ${cli.srcDir} directory):`, cli.baseCodePath ?? `renderer/index${cli.codeFileExt}`);
      cli.devtools = await askYesNo(`use Devtools :`, cli.devtools);
      cli.removeMenu = await askYesNo(`Remove Menu :`, cli.removeMenu);
    } else {
      cli.baseCodePath = await ask(`base code filepath (in ${cli.srcDir} directory):`, cli.baseCodePath ?? `index${cli.codeFileExt}`);      
    }

    cli.baseCssPath = await ask(`base css filepath (in project root) :`, cli.baseCssPath ?? 'styles.scss');
    cli.baseHtmlPath = await ask(`base html filepath (in project root):`, cli.baseHtmlPath ?? 'index.html');
    const renderDir = dirname(cli.baseCodePath);
    //cli.baseCodePath = await ask(`base code (in ${cli.srcDir} directory):`,
    //  cli.baseCodePath ?? (!cli.useElectron ? `index${cli.codeFileExt}` : correctpath(join(renderDir, `index${cli.codeFileExt}`))));

    cli.ResourceStorageFile = await ask(`ResourceFile Path (in ${cli.srcDir} directory): `,
      cli.ResourceStorageFile ?? correctpath(join(cli.designerDir, `Resources${cli.codeFileExt}`))
    );

    const cmd = await ask(`
------------------
What to Do Now ?
  E = Generate Electron Stuff
  U = Generate 'ucconfig.js'
  V = Generate '.vscode/settings.json'
  T = Generate 'tsconfig.json' for project
  B = Back
  `, 'u');
    switch (cmd.toLowerCase().trim()) {
      case 'u':
        await this.main._cliUcconfigInq.generateUcConfig();
        break;
      case 'e':
        await this.main._cliElectronInq.generate();
        break;
      case 'v':
        await this.main._cliElectronInq.generate();
        break;
    }
    //console.log(JSON.stringify(cli));

    //   let x = extractPathConfig(cfg);
    //   if (x.srcDec == undefined || x.outDec == undefined) {
    //     await this.main.setupSrcOutDir();
    //     x = extractPathConfig(cfg);
    //     // const srcDir = await ask(`Source Dir`, 'src');
    //     // x.pref.dirDeclaration[srcDir] = {
    //     //       dirPath: 'src',
    //     //       fileDeclaration: {
    //     //             html: { extension: '.html' }
    //     //       }
    //     // }
    //   }
    //   //const meta = this.main.meta;
    //   x.cli.useTypeScript = x.cli.useTypeScript ?? await cliTypeScriptInquiry.AskIsTypescript(true);
    //   const fileExt = x.cli.useTypeScript ? '.ts' : '.js';
    //   x.cli.useElectron = await askYesNo(`SETUP ELECTRON ? 
    // ==> `, x.cli.useElectron);
    //   if (!x.cli.useElectron) return;
    //   console.log(`
    //     + --------------------------+
    // | ELECTRON SETUP |
    //   +--------------------------+
    //   `);
    //   x.cli.mainProcessFilePath = await ask(`Main file(inside '${x.srcDec.dirPath}')
    //   ==> `, x.cli.mainProcessFilePath ?? `main / index.ts`);
    //   x.cli.preloadScriptFilePath = await ask(`Preload file
    //   ==> `, x.cli.preloadScriptFilePath ?? `preload / index${fileExt}`);
    //   x.cli.baseCodePath = await ask(`Renderer Ts file(load with HTML file)
    // ==> `, x.cli.baseCodePath ?? `renderer / index${fileExt} `);
    //   x.cli.baseHtmlPath = (x.cli.baseHtmlPath ?? '') ?? await ask(`Renderer HTML file
    //     ==> `, x.cli.baseHtmlPath ?? 'renderer/index.html');

    //   x.cli.contextIsolation = await askYesNo(`Enable contextIsolation ? 
    // ==> `, x.cli.contextIsolation);
    //   x.cli.devtools = await askYesNo(`Enable devtools on load ?
    // ==> `, x.cli.devtools);
    //   x.cli.nodeIntegration = await askYesNo(`Enable nodeIntegration ?
    // ==> `, x.cli.nodeIntegration);
    //   x.cli.removeMenu = await askYesNo(`Remove Menu ?
    // ==> `, x.cli.removeMenu);
    //   console.log('.... ELECTRON SETUP DONE ...');

  }
}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
