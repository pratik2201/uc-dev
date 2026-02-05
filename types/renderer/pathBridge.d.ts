import { IDirDeclarationTypesMap, ProjectRowBase, FileDeclarationTypes, DirDeclarationTypes } from "ap-shared-core/out/ucbuilder/configResources.js";
interface ConvertedPathRow {
    paths: IDirDeclarationTypesMap;
    project: ProjectRowBase<unknown>;
}
export declare class PathBridge {
    static path: (typeof import("ucbuilder/out/renderer/nodeFn.js").nodeFn)['path'];
    static url: (typeof import("ucbuilder/out/renderer/nodeFn.js").nodeFn)['url'];
    static source: ProjectRowBase<any>[];
    static CheckAndSetDefault: () => void;
    static Convert: (path: string, pathDeclare: DirDeclarationTypes, givenFileType: FileDeclarationTypes, demandPathtype?: DirDeclarationTypes) => ConvertedPathRow;
    static changeExt: (path: string, from: FileDeclarationTypes, to: FileDeclarationTypes) => string;
    static GetFullPath: (path: string, basePath: string) => string;
}
export {};
