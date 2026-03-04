import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cliMain } from "../cliMain.js";
import { ask, runTemplate, writeFileSafely } from "../prompt.js";
import { makeMenu } from "./cli_menuLayout.js";
import { cli_menu_generate } from "./cli_menu_generate.js";
import { cli_menu_dependancy } from "./cli_menu_dependancy.js";

export async function cli_menu_MainMenu(main: cliMain, back_menu_callback: (_main: cliMain) => Promise<void> = async () => { }) {

  const cmd = await makeMenu('M A I N - M E N U', `
  P = Perameters
  B = Build Designers and Resource File  
  G = Generate
  D = Dependancy
  Q = Quit
    `, 'q');
  switch (cmd.toLowerCase().trim()) {
    case 'b':
      await main.startBuild();
      break;
    case 'd':
      await cli_menu_dependancy(main, cli_menu_MainMenu);
      break;
    case 'p':
      await main._cliSurveys.inquiry();
      await cli_menu_MainMenu(main);
      break;
    case 'g':
      await cli_menu_generate(main, cli_menu_MainMenu);
      break;
    case 'q':
      return;
      break;
  }
  //await cli_menu_MainMenu(main,back_menu_callback);
}
function _runTemplate(rel: string, options: any) {
  return runTemplate(join(dirname(fileURLToPath(import.meta.url)), 'utils/inquiry', rel), import.meta.url, options);
}
