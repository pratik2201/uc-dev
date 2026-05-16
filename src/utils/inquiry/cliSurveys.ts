
import { correctpath } from "ap-shared-core/core-common.js";
import { dirname, join, normalize, relative } from "path";
import { fileURLToPath } from "url";
import { cliMain } from "../cliMain.js";
import { ask, askYesNo, runTemplate } from "../prompt.js";

export class cliSurveys {
  constructor(public main: cliMain) { }
  setDefault() {
    const cfg = this.main.config;
    const cli = cfg.cli;
    cli.useElectron = true;
    cli.useTypeScript = true;
    cli.srcDir = 'src';
    cli.outDir = 'out';
    cli.designerDir = 'designerFiles';
    cli.codeFileExt = '.ts';
    cli.outputFileExt = '.js';
    cli.mainProcessFilePath = `main/index${cli.codeFileExt}`;
    cli.preloadScriptFilePath = `preload/index${cli.codeFileExt}`;
    cli.baseCodePath = `renderer/index${cli.codeFileExt}`;
    cli.devtools = true;
    cli.removeMenu = true;
    cli.baseCssPath = 'styles.scss';
    cli.baseHtmlPath = 'index.html';
    cli.ResourceStorageFile = `Resources${cli.codeFileExt}`;
    cli.filesToMove = '.jpg,.png,.html,.scss,.ico,.svg';
    cli.ignoreInBuild = `node_modules;.git;.vscode;${cli.outDir}`;
  }
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

    /*const baseParentdir = normalize(dirname(join(projectDir, cli.baseHtmlPath)));
    const projectParentdir = normalize(projectDir);
    if (baseParentdir != projectParentdir) {
      const relpath = relative(baseParentdir, projectParentdir);
      cli.baseHtmlLoadUrlOptions = {
        baseURLForDataURL: await ask(`  (in project root):`, cli.baseHtmlPath ?? 'index.html');
      }
    }*/
    /*cli.baseHtmlLoadUrlOptions = {
      baseURLForDataURL
    }*/
    // if (cli.useElectron) {
    //   cli.baseHtmlLoadUrlOptions = Object.assign({}, cli.baseHtmlLoadUrlOptions);
    //  cli.baseHtmlLoadUrlOptions
    // }
    cli.baseHtmlPath = await ask(`base html filepath (in project root):`, cli.baseHtmlPath ?? 'index.html');

    cli.ResourceStorageFile = await ask(`ResourceFile Path (in ${cli.srcDir} directory): `,
      cli.ResourceStorageFile ?? correctpath(join(cli.designerDir, `Resources${cli.codeFileExt}`))
    );
    if (cli.useTypeScript) {
      cli.filesToMove = await ask(`RUNTIME EXTRA FILES (SPECIFY EXTENSIONS)
>`, '.jpg,.png,.html,.scss,.ico,.svg') ?? '';
    }
    cli.ignoreInBuild = await ask(`IGNORE THESE PATH IN DESIGNER BUILD TIME (SPECIFY PATH FROM ROOT)
>`, `node_modules;.git;.vscode${cli.useTypeScript ? ';' + cli.outDir : ''}`) ?? '';
    await this.main._cliUcconfigInq.generateUcConfig();
  }
}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
