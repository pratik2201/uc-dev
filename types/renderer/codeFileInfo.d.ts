import { SpecialExtType } from "./buildRow.js";
import { IFileDeclarationTypesMap, FileDeclarationTypes, IDirDeclarationTypesMap, DirDeclarationTypes, ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export declare function GetAliceInfoByPath(filePath: string, projectRows?: ProjectRowBase<any>[]): {
    alias: string;
    rootPath: string;
    absolutePath: string;
    project: ProjectRowBase;
};
export declare function GetDeclaration(filepath: string, projectRows?: ProjectRowBase<any>[]): {
    project: ProjectRowBase<any>;
    dirDec: string;
    fileDec: string;
};
export declare class codeFileInfo {
    name: string;
    extCode: SpecialExtType;
    static getExtType(path: string): SpecialExtType;
    pathOf: IFileDeclarationTypesMap;
    fullWithoutExt: (ftype: FileDeclarationTypes) => any;
    pathWithExt: (ftype: FileDeclarationTypes) => any;
    static GetFileName(filePath: string): string;
    allPathOf: IDirDeclarationTypesMap;
    callerMetaUrl: string;
    callerProject: ProjectRowBase;
    get projectInfo(): ProjectRowBase<any>;
    parseUrl(_path: string, demandType: DirDeclarationTypes | string, callerMetaUrl?: string): boolean;
    get mainFileRootPath_btoa(): string;
}
