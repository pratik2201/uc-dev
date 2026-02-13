import { recursive } from "ap-shared-core/out/uc-dev/ConfigHandler.js";
import { ensureDirectoryExistence } from "ap-shared-core/out/uc-dev/pathUtil.js";
import { copyFileSync } from "fs";
import { join, resolve } from "path";
function copyRes() {
    const projPath = resolve();
    const srcDir = join(projPath, 'src');
    const outDir = join(projPath, 'out');
    const fileSource = recursive(srcDir, []);
    const resToCopy = fileSource.filter(s => s.endsWith('.ts') == false)
    resToCopy.forEach(f => {
        const outPath = f.replace(srcDir, outDir);
        ensureDirectoryExistence(outPath);
        copyFileSync(f, outPath);
    });
}
copyRes();