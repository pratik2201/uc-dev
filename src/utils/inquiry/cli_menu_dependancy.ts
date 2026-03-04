import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, runTemplate, writeFileSafely } from "../prompt.js";
import { makeMenu } from "./cli_menuLayout.js";
import { cli_sample_style1 } from "./cli_sample_style1.js";

export async function cli_menu_dependancy(main: cliMain, back_menu_callback: (_main: cliMain) => Promise<void> = async () => { }) {
  let hasAddedSampleForm = false;
  const cmd = await makeMenu('D E P E N D A N C Y', `
  E = Electron
  T = Type Script
  R = rimraf
  U = uc-runtime
  D = uc-dev
  C = uc-controls
  `, 'etrudc');
  await _select(cmd);
  async function _select(selectedOption: string) {
    const packages: string[] = [];
    if (selectedOption.includes('e')) packages.push('electron');
    if (selectedOption.includes('t')) packages.push('typescript', '@types/node');
    if (selectedOption.includes('r')) packages.push('rimraf');
    if (selectedOption.includes('u')) packages.push('uc-runtime');
    if (selectedOption.includes('d')) packages.push('uc-dev');
    if (selectedOption.includes('c')) packages.push('uc-controls');
    if (packages.length > 0)
      await main.dependancyChecker.installPackages(packages);
    console.log('INSTALLED..');
    
  }

}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
