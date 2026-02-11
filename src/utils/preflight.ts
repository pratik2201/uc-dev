import { isInstalled, installPackages } from "./cliDependancyChecker.js";
import { askYesNo } from "./prompt.js";
type InitOptions = {
  yes: boolean;
  force: boolean;
  ts: boolean;
};
export async function ensureDependencies(opts: {
    electron?: boolean;
    ucbuilder?: boolean;
    typescript?: boolean;
    autoYes?: boolean;
}) {
    const missing: string[] = [];

    if (opts.electron && !isInstalled("electron")) {
        missing.push("electron");
    }

    if (opts.ucbuilder && !isInstalled("ucbuilder")) {
        missing.push("ucbuilder");
    }
    
    if (opts.typescript && !isInstalled("typescript")) {
        missing.push("typescript", "@types/node", "@types/electron");
    }

    if (missing.length === 0) {
        console.log("✓ Dependencies OK");
        return;
    }

    console.log("✖ Missing dependencies:");
    missing.forEach(p => console.log("  -", p));

    const ok = await askYesNo(
        "Install missing dependencies?",
        true,
        opts.autoYes
    );

    if (!ok) {
        throw new Error("Cannot continue without required dependencies.");
    }

    await installPackages(missing);

    // recheck
    const stillMissing = missing.filter(p => !isInstalled(p));
    if (stillMissing.length) {
        throw new Error(
            `Failed to install: ${stillMissing.join(", ")}`
        );
    }

    console.log("✓ Dependencies installed");
}
