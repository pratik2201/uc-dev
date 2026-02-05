import { PreloadFullFill, ProjectRowR } from "ap-shared-core/out/ucbuilder/ucUtil.js";
export declare class ProjectManage {
    static projects: ProjectRowR[];
    static PROJECT_COUNTER: number;
    static PROJECT_PATH: string;
    static MAIN_PROJECT: ProjectRowR;
    static wu: PreloadFullFill;
    static init(): void;
    static FILL_PROJECTS(_project: ProjectRowR): ProjectRowR;
    static getInfoByProjectPath(path: string): ProjectRowR | undefined;
    static getInfoByAlices(alices: string): ProjectRowR | undefined;
}
