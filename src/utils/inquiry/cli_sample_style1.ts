import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, askYesNo, runTemplate, writeFileSafely } from "../prompt.js";
import { correctpath, TemplateMaker } from "ap-shared-core/core-common.js";
import { ucUtil } from "ap-shared-core/core.js";
import { readFileSync } from "node:fs";

export async function cli_sample_style1(main: cliMain) {
  const cli = main.config.cli;

  const sampleroot = dirname(join(cli.srcDir, cli.baseCodePath));

  const sample = {
    frmDashboard: {
      html: resolve(join(sampleroot, 'frmDashboard.uc.html')),
      scss: resolve(join(sampleroot, 'frmDashboard.uc.scss')),
      code: resolve(join(sampleroot, 'frmDashboard.uc.ts')),
    },
    tptDashboard: {
      html: resolve(join(sampleroot, 'tptDashboard.tpt.html')),
      scss: resolve(join(sampleroot, 'tptDashboard.tpt.scss')),
      code: resolve(join(sampleroot, 'tptDashboard.tpt.ts')),
    }
  }
  const relHtmlPath = relative(resolve(cli.srcDir), sample.frmDashboard.html);
  const designerRoot = ucUtil.changeExtension(resolve(join(cli.srcDir, cli.designerDir, relHtmlPath)), '.html', '.designer.js');

  const templateRoot = 'templates/sample1';
  /**
   * sample form usercontrol GENERATE
   */
  await writeFileSafely(
    sample.frmDashboard.html,
    _runTemplate_x(`${templateRoot}/frmDashboard.uc.html.tp`, {}),
    main.cliOptions);
  await writeFileSafely(
    sample.frmDashboard.scss,
    _runTemplate_x(`${templateRoot}/frmDashboard.uc.scss.tp`, {}),
    main.cliOptions);
  const designerReletivePath = relative(dirname(sample.frmDashboard.code), designerRoot);
  await writeFileSafely(
    sample.frmDashboard.code,
    _runTemplate(`${templateRoot}/frmDashboard.uc.ts.tp`, {
      designerReletivePath:
        correctpath(designerReletivePath)
    }),
    main.cliOptions);


  await writeFileSafely(
    sample.tptDashboard.html,
    _runTemplate_x(`${templateRoot}/tptDashboard.tpt.html.tp`, {}),
    main.cliOptions);

  await writeFileSafely(
    sample.tptDashboard.scss,
    _runTemplate_x(`${templateRoot}/tptDashboard.tpt.scss.tp`, {}),
    main.cliOptions);

}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
function _runTemplate_x(rel: string, row: any) {
  const fpath = join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel);
  let content = readFileSync(fpath, 'utf-8');
  content = ucUtil.PHP_REMOVE(content);
  const tmaker = new TemplateMaker();
  const callback = tmaker.compileTemplate(content);
  return ucUtil.PHP_ADD(callback(row));
}