import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, runTemplate, writeFileSafely } from "../prompt.js";
import { makeMenu } from "./cli_menuLayout.js";
import { cli_sample_style1 } from "./cli_sample_style1.js";

export async function cli_menu_generate(main: cliMain, back_menu_callback: (_main: cliMain) => Promise<void> = async () => { }) {
  let hasAddedSampleForm = false;
  const cmd = await makeMenu('G E N E R A T E', `
  E = Electron Stuffs
  S = Sample Style1
  V = '.vscode/settings.json' file
  T = 'tsconfig.json' for project
  A = Do All Above
  Q = Quit
  `, 'q');
  await _select(cmd);
  async function _select(selectedOption: string) {
    switch (selectedOption.toLowerCase().trim()) {
      case 'a':
        await _select('v');
        await _select('t');
        await _select('s');
        if (main.config.cli.useElectron)
          await _select('e');
        await main.startBuild();
        break;
      case 'p': await main._cliSurveys.inquiry(); break;
      case 's': await cli_sample_style1(main); hasAddedSampleForm = true; break;
      case 'e': await main._cliElectronInq.generate(hasAddedSampleForm); break;
      case 't':
        const cli = main.config.cli;
        /*
        * TSCONFIG FILE GENERATE
        */
        await writeFileSafely(
          resolve('tsconfig.json'),
          _runTemplate('templates/typescript/json.tsconfig', {
            outDir: main.config.cli.outDir,
            srcDir: main.config.cli.srcDir,
            isUcControlsInstalled: main.dependentProjects
              .find(s => s == 'uc-controls') != undefined,
          }),
          main.cliOptions);
        await cli_menu_generate(main);
        break;
      case 'v':
        /**
         * SCSS FILE GENERATE
         */
        await writeFileSafely(
          resolve('.vscode/settings.json'),
          _runTemplate('templates/.vscode/json.settings', {}),
          main.cliOptions);
        break;
      case 'q':
        await back_menu_callback(main);
        return;
    }
    await cli_menu_generate(main);
  }

}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
