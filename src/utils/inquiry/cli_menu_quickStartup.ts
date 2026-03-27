import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, runTemplate, writeFileSafely } from "../prompt.js";
import { cli_menu_MainMenu } from "./cli_menu_MainMenu.js";
import { cli_menu_generate } from "./cli_menu_generate.js";
import { cli_menu_dependancy } from "./cli_menu_dependancy.js";
import { exec } from 'child_process';

export async function makesure_package_exist() {
  const projDir = process.cwd();
  const ppath = join(projDir, 'package.json');
  if (!existsSync(ppath)) {
    const projectName = await ask(`Project Name : `, 'sample-project');
    /*
     * PACKAGE.JSON FILE GENERATE
     */
    await writeFileSafely(
      resolve('package.json'),
      _runTemplate('templates/json.package', {
        projectName
      }), {});
    cliMain.ref.projectDir = projDir;
  }
}
export async function cli_menu_quickStartup(main: cliMain, back_menu_callback: (_main: cliMain) => Promise<void> = async () => { }) {
  let hasAddedSampleForm = false;
  const cfg = main.config;

  await makesure_package_exist();
  cliMain.ref._cliSurveys.setDefault();
  await main._cliUcconfigInq.generateUcConfig();
  await cli_menu_generate(cli_menu_MainMenu, "vtse");
  await cli_menu_dependancy(cli_menu_MainMenu, 'etruc');
  await main.startBuild();
  console.log(`TO BUILD AND RUN PROJECT
npm run rebuild:start`); 
  process.exit();   
}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
