#!/usr/bin/env node

import { cliMain } from "./utils/cliMain.js"; 
import { cli_menu_MainMenu } from "./utils/inquiry/cli_menu_MainMenu.js";

const args = process.argv.slice(2);
const cmd = args[0];
//const sub = args[1];
const main = new cliMain();
await main.readConfig();
const copt = main.cliOptions;
copt.force = args.includes("--force");
copt.yes = args.includes("--yes");
const ignreq = args.includes("--ignreq");

switch (cmd) {
    case "build":
        if (!ignreq)
            await main.checkBasicNeed();
        await main.startBuild();
        break;
    case "setup":
        if (!ignreq)
            await main.checkBasicNeed();
        await cli_menu_MainMenu(main);
        break;
    case "--help":
    default:
        console.log(`
uc-dev
Commands:
  build   build the designer files 
  setup   setup project for startup. install required depandancy and set directory paths
`);
        break;
}

