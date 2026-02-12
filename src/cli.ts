#!/usr/bin/env node

import { cliMain } from "./utils/cliMain.js";

const args = process.argv.slice(2);
const cmd = args[0];
//const sub = args[1];
const main = new cliMain();
const copt = main.cliOptions;
copt.force = args.includes("--force");
copt.yes = args.includes("--yes");
switch (cmd) {
    case "build":
        await main.startBuild();
        break;
    case "setup":
        await main.init();
        break;
    case "--help":
    default:
        console.log(`
ucbuilder-devtools
Commands:
  build   build the designer files 
  setup   setup project install required depandancy
`);
        break;
}

