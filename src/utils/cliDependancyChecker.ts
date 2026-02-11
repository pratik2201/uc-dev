import { exec, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cliMain } from "./cliMain.js";
export class cliDependancyChecker {
  constructor(public main: cliMain) { }
  isInstalled(pkg: string) {
    try {
      require.resolve(pkg, { paths: [this.main.projectDir] });
      return true;
    } catch {
      return false;
    }
  }
}
export function isInstalled(pkg: string): boolean {
  try {
    require.resolve(pkg, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

export function detectPackageManager(): string {
  if (existsSync("pnpm-lock.yaml")) return "pnpm add -D";
  if (existsSync("yarn.lock")) return "yarn add -D";
  return "npm install -D";
}

export function installPackages(pkgs: string[]): Promise<void> {
  const [pm, ...baseArgs] = detectPackageManager().split(" ");

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
