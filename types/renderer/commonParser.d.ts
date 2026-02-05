import { TemplateMaker } from "ap-shared-core/out/template/TemplateMaker.js";
import { FilterContent } from "ucbuilder/out/lib/StampGenerator.js";
import { builder } from "./builder.js";
import { CommonRow, Control, DesignerOptionsBase, ImportClassNode, codeOptionsBase } from "./buildRow.js";
import { codeFileInfo } from "./codeFileInfo.js";
import { commonGenerator } from "./commonGenerator.js";
import { IFileDeclaration, UserUCConfig, IUCConfigPreference, ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export interface PathReplacementNode {
    findPath: string;
    replaceWith: string;
}
export declare class commonParser {
    generateNodes(htContent: string): string;
    reset(): void;
    rows: CommonRow[];
    pathReplacement: PathReplacementNode[];
    pushReplacement({ findPath, replaceWith }: PathReplacementNode): void;
    bldr: builder;
    gen: commonGenerator;
    SRC_DEC: Partial<{
        code: IFileDeclaration;
        designer: IFileDeclaration;
        html: IFileDeclaration;
        scss: IFileDeclaration;
    }>;
    OUT_DEC: Partial<{
        code: IFileDeclaration;
        designer: IFileDeclaration;
        html: IFileDeclaration;
        scss: IFileDeclaration;
    }>;
    SRC_CODE_EXT: string;
    OUT_CODE_EXT: string;
    dynamicTemplate: Function;
    constructor(bldr: builder);
    /** for getting project type of ucbuilder project */
    UC_CONFIG: UserUCConfig;
    CONFIG: UserUCConfig;
    PREFERENCE: IUCConfigPreference;
    project: ProjectRowBase;
    PROJECT_PATH_LENGTH: number;
    init(cinfo: codeFileInfo, htmlContents?: string | undefined): Promise<void>;
    tmaker: TemplateMaker;
    _filterText: FilterContent;
    codeHT: HTMLElement;
    fill(cinfo: codeFileInfo, htmlContents?: string | undefined): Promise<CommonRow>;
    common0: (htmlContents: string, _row: CommonRow, designer: DesignerOptionsBase) => Promise<string>;
    fillUc: (finfo: codeFileInfo, htmlContents: string, _row: CommonRow) => Promise<CommonRow>;
    fillTpt: (finfo: codeFileInfo, htmlContents: string, _row: CommonRow) => Promise<CommonRow>;
    guidList: Map<string, string>;
    getGuid: (_path: string) => string;
    common2: (des: DesignerOptionsBase, finfo: codeFileInfo) => void;
    common1: (des: DesignerOptionsBase, code: codeOptionsBase, finfo: codeFileInfo) => void;
    nc(_path: string, fromFilePath: string): any;
    fillDefImports(name: string, url: string, classList: ImportClassNode[], ctrlNode?: Control): void;
}
export interface CssBuildResult {
    css: string;
    resources: Map<string, string>;
}
export declare class CssResolver {
    static makeGuid(project: string): string;
    static buildProcessCss(input: string, projectName: string): CssBuildResult;
    static runtimeApplyCssResources(css: string, resolver: (guid: string) => string): string;
}
