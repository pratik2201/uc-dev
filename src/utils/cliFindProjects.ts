import { existsSync, realpathSync, statSync } from "fs";
import path from "path";

export async function findProject(mainDirPath: string) {
    let projectDir = getProjectDir(mainDirPath);
    if (projectDir == null) {
        throw new Error('NO PROJECT FOUND');
    } else {
        const cfgFile = path.join(projectDir, 'ucconfig.js');
        if (existsSync(cfgFile)) return projectDir;
        else {
            /*if (existsSync(cfgFile)) return projectDir;
            else */ return undefined;
        }
    }
}
export function getProjectDir(startPath: string): string | null {
    let dir = statSync(startPath).isFile()
        ? path.dirname(startPath)
        : startPath;
    dir = realpathSync(dir);
    while (true) {
        const candidate = path.join(dir, "package.json");
        if (existsSync(candidate)) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return null;
        }
        dir = parent;
    }
}