#!/usr/bin/env node

import { cliMain } from "./utils/cliMain.js";
import fs from "fs";
import { cli_menu_MainMenu } from "./utils/inquiry/cli_menu_MainMenu.js";
import { cli_menu_quickStartup } from "./utils/inquiry/cli_menu_quickStartup.js";

const args = process.argv.slice(2);
const cmd = args[0];
//const sub = args[1];
const main = new cliMain();
cliMain.ref = main;
await main.readConfig();
const copt = main.cliOptions;
copt.force = args.includes("--force");
copt.yes = args.includes("--yes");
const ignreq = args.includes("--ignreq");
debugger;
switch (cmd) {
    case "build":
        if (!ignreq)
            await main.checkBasicNeed();
        await main.startBuild();
        break;
    case "setup":
        if (isDirEmpty(main.projectDir)) {
            if (!ignreq)
                await main.checkBasicNeed(false);
            await cli_menu_quickStartup(main, cli_menu_MainMenu); 
        } else {
            if (!ignreq)
                await main.checkBasicNeed(false); 
        }
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

function isDirEmpty(path: string): boolean {
    const files = fs.readdirSync(path);
    return files.length === 0;
}