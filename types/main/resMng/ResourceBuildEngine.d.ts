import { UserResource } from "ap-shared-core/out/ucbuilder/resources/enums.js";
import { UserUCConfig, ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export declare class ResourceBuildEngine {
    projectList: {
        project: ProjectRowBase;
        resourceFilefullPath: string;
        projectGuid: string;
        importResource: boolean;
        resourceRelativePath: string;
    }[];
    private resourceMap;
    private guidResolver;
    clear(): void;
    ucCfg: UserUCConfig;
    constructor(rb: ProjectRowBase);
    get resources(): Map<string, UserResource>;
    get: (guid: string) => UserResource;
    static MAIN_PROJECT: {
        cssGuid: string;
        ucConfigGuid: string;
        name: string;
        guid: string;
    };
    registerProject: (s: ProjectRowBase) => void;
    isVirtualResource(key: string): boolean;
    build(path: string, _blueprint?: Partial<UserResource>): string;
    private buildContentOnly;
    private buildCss;
    private buildHtml;
    private buildAsset;
    private resolveAsset;
}
