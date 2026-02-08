#!/usr/bin/env node

import path from "path";
import { BuildingProcess } from "./lib/BuildingProcess.js";
const args = process.argv.slice(2);

switch (args[0]) {
    case "build":
        const cwd = process.cwd();
        console.log(cwd);
        
        await BuildingProcess.start(cwd);
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
