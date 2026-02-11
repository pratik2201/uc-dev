#!/usr/bin/env node

import path from "path";
import { BuildingProcess } from "./lib/BuildingProcess.js";
import { askForInit_UCCONFIG, interect_UCCONFIG } from "./utils/interect_UCCONFIG.js";
import { interect_ELECTRON } from "./utils/interect_ELECTRON.js";
import { ensureDependencies } from "./utils/preflight.js";
import { findProject } from "./lib/processes/findProject.js";
const args = process.argv.slice(2);
const cmd = args[0];
const sub = args[1];

switch (cmd) {
    case "build":
        const cwd = process.cwd();
        let projPath = await findProject(cwd);
        if (projPath == undefined) {
            console.log(`!!! NO CONFIG FOUND`);
            if (await askForInit_UCCONFIG() == true) {
                projPath = await findProject(cwd);
                if (projPath != undefined)
                    await BuildingProcess.startBuild(projPath);
            }
        }
        else {
            await BuildingProcess.startBuild(projPath);
        }
        break;
    case "setup":
        const overrideOld = args.includes("--force");
        const devtools = args.includes("--devtools");
        const useTypeScript = !args.includes("--js");
        if (sub == 'full') {
            const autoYes = args.includes("--yes");
            /*await ensureDependencies({
                electron: true,
                ucbuilder: true,
                typescript: useTypeScript,
                autoYes: autoYes
            });*/
            if (args.includes("--init"))
                await interect_UCCONFIG({ useTypeScript, overrideOld });
            await interect_ELECTRON({ force: overrideOld, devtools, ts: useTypeScript, yes: autoYes });
        }
        break;
    case "--help":
    default:
        console.log(`
ucbuilder-devtools

Commands:
  build   build the designer files 
`);
        break;
}
