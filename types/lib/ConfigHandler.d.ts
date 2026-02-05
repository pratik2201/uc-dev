import { IImportMap, ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export declare class ConfigHandler {
    static filler: ConfigHandler;
    static init(importMetaPath: string): Promise<void>;
    MAIN_CONFIG: ProjectRowBase;
    MAIN_PROJECT_PATH: string;
    allConfig: ProjectRowBase[];
    importmap: IImportMap;
    MAKE_IMPORTMAP(_config: ProjectRowBase): void;
    ucConfig: ProjectRowBase<any>;
    fill: (mainDirPath: string) => Promise<void>;
    copyAssets: () => void;
    updateAliceToPath(linearPushAr: ProjectRowBase[]): void;
    private FILL_UCcONFIG;
    listProjectPath(projectDir: string): string[];
    getProjectDir(_dirPath: string): string;
}
