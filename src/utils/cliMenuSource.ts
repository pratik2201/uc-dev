import type { cliMain } from "./cliMain.js";
import { CliMenu, MenuItem } from "./cliDrawMenu.js";
function printHeader() {
  console.log(`
┌───────────────────────────┐
│        UC CLI v1.0        │
└───────────────────────────┘
`);
}
export class cliMenuSource {
  constructor(public main: cliMain) { }
  async mainMenu() {
    printHeader();
    console.log(`
+-------------------------+
|           QUICK         |
+-------------------------+
`); 
    const menuSrc: MenuItem[] = [];
    const dm = new CliMenu("S e l e c t ", menuSrc);
    menuSrc.push({
      label: "ucconfig.js",
      action: async () => {
        await this.main._cliUcconfigInq.generateUcConfig()
      }
    }, {
      label: "uc-controls Setup",
      action: async () => {

      }
    }, {
      label: "Electron Setup",
      action: async () => {
        await this.main._cliElectronInq.generate();
        console.log('----------------------ss-----------------------'); 
      }
    }, {
      label: "typescript Setup",
      action: async () => {

      }
    }, {
      label: "build designer",
      action: async () => {

      }
    }, {
      label: "quit",
      action: async () => {

      }
    });

    await dm.start();
    // const answer = await Select({
    //   message: "S e l e c t ",
    //   choices: [
    //     { name: "ucconfig.js", value: "U" },
    //     { name: "uc-controls Setup", value: "C" },
    //     { name: "Electron Setup", value: "E" },
    //     { name: "typescript Setup", value: "T" },
    //     { name: "build designer", value: "B" },
    //     { name: "quit", value: "Q" },
    //   ],
    // });
    // switch (answer) {
    //   case 'U': await this.main._cliUcconfigInq.inquiry(); break;
    //   case 'C': break;
    //   case 'E': await this.main._cliElectronInq.inquiry(); break;
    //   case 'T': break;
    //   case 'B': break;
    //   case 'Q': return; break;
    // }
    // await this.mainMenu();
    //console.log("\nSelected:", answer);
  }
}