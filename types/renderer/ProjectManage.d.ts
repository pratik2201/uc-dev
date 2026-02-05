import { PreloadFullFill } from "ap-shared-core/out/ucbuilder/ucUtil.js";
import { ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export declare class ProjectManage {
    static projects: ProjectRowBase[];
    static PROJECT_COUNTER: number;
    static PROJECT_PATH: string;
    static MAIN_PROJECT: ProjectRowBase;
    static wu: PreloadFullFill;
    static init(): void;
    static FILL_PROJECTS(_project: ProjectRowBase): ProjectRowBase;
    static getInfoByProjectPath(path: string): ProjectRowBase | undefined;
    static getInfoByAlices(alices: string): ProjectRowBase | undefined;
}
