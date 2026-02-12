import { existsSync } from "fs";
import { exec } from "child_process";
import { askYesNo } from "./prompt.js";

function isInstalled(pkg: string) {
  try {
    require.resolve(pkg, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

async function preflight(options) {
  const missing: string[] = [];

  if (options.electron && !isInstalled("electron")) {
    missing.push("electron");
  }

  if (options.typescript && !isInstalled("typescript")) {
    missing.push("typescript");
    missing.push("@types/node");
  }

  return missing;
}
async function installPackages(pkgs: string[]) {
  const cmd =
    existsSync("pnpm-lock.yaml") ? "pnpm add -D" :
    existsSync("yarn.lock") ? "yarn add -D" :
    "npm install -D";

  await exec(`${cmd} ${pkgs.join(" ")}`);
}
async function ensureDependencies(options) {
  const missing = await preflight(options);

  if (missing.length === 0) return;

  const ok = await askYesNo(
    `Install missing packages (${missing.join(", ")})?`,
    true
  );

  if (!ok) {
    console.log("✖ Cannot continue without required dependencies.");
    process.exit(1);
  }

  await installPackages(missing);

  const stillMissing = await preflight(options);
  if (stillMissing.length) {
    throw new Error(
      `Failed to install: ${stillMissing.join(", ")}`
    );
  }

  console.log("✓ Dependencies ready");
}
