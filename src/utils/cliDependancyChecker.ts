import { exec, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cliMain } from "./cliMain.js";
import { askYesNo } from "./prompt.js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

type InitOptions = {
  yes: boolean;
  force: boolean;
  ts: boolean;
};
export class cliDependancyChecker {
  constructor(public main: cliMain) { }
  isInstalled(pkg: string) {
    try {
      pkg = pkg.toLowerCase().trim();
      return this.main.dependentProjects.findIndex(s => s.toLowerCase().trim() == pkg) != -1;
    } catch /*(e)*/ {
      //console.log(e);
      return false;
    }
  }
  getMissingDep(opts: string[]) {
    const _this = this;
    const _deps: string[] = []; 
    opts.forEach(dep => {
      if (!_this.isInstalled(dep))
        _deps.push(dep);
    });
    return _deps;
  }
  detectPackageManager(): string {
    if (existsSync("pnpm-lock.yaml")) return "pnpm add ";
    if (existsSync("yarn.lock")) return "yarn add ";
    return "npm install ";
  }

  installPackages(pkgs: string[]): Promise<void> {
    const [pm, ...baseArgs] = this.detectPackageManager().split(" ");

    const args = [...baseArgs, ...pkgs];

    console.log("Installing:", pkgs.join(", "));
    console.log(">", pm, args.join(" "));

    return new Promise((resolve, reject) => {
      const child = spawn(pm, args, {
        stdio: "inherit",
        shell: true
      });

      child.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(`Install failed with code ${code}`));
      });

      child.on("error", reject);
    });
  }

  async ensureDependencies(opts: string[]) {
    const _this = this;
   // console.log(opts);
    
    let missing = this.getMissingDep(opts);
    if (missing.length === 0) {
      console.log("✓ Dependencies OK");
      return missing;
    }
    console.log("✖ Missing dependencies:");
    missing.forEach(p => console.log("  -", p));

    const ok = await askYesNo(
      "Install missing dependencies?",
      false,
      this.main.cliOptions.yes
    );
    if (!ok) {
      throw new Error("Cannot continue without required dependencies.");
    }
    await this.installPackages(missing);
    await this.main.updateDependancies();
    const stillMissingDep = this.getMissingDep(opts);
    missing = missing.filter(s => !stillMissingDep.includes(s));
    console.log("✓ Dependencies installed");
    return missing;
  }


}
