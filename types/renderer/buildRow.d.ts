import { codeFileInfo } from "./codeFileInfo.js";
export type SpecialExtType = "none" | ".uc" | ".tpt";
export declare class Control {
    private _name;
    get name(): string;
    set name(value: string);
    _nameQT: string;
    get nameQT(): string;
    _nameThis: string;
    get nameThis(): string;
    codeFilePath: string;
    type?: SpecialExtType;
    generic?: string;
    scope: ScopeType;
    proto: string;
    importedClassName?: string;
    src?: codeFileInfo;
    nodeName: string;
    constructor();
}
export interface Template {
    name: string;
    scope: ScopeType;
    controls: Control[];
}
export declare const templete: Template;
export interface ImportClassNameAlices {
    name: string;
    alias: string;
    asText?: string;
}
export interface ImportClassNode {
    url: string;
    names?: ImportClassNameAlices[];
}
export declare class DesignerOptionsBase {
    importer: importManage;
    htmlFilePath: string;
    dynamicName: string;
    className: string;
    baseClassName: string;
    codeFilePath: string;
    dynamicFilePath: string;
    rootPath: string;
    htmlGuid: string;
    cssGuid: string;
}
declare class ucDesigner extends DesignerOptionsBase {
    getterFunk: string;
    controls: Control[];
}
declare class tptDesigner extends DesignerOptionsBase {
    templetes: Template[];
}
export declare class dynamicDesignerElementTree {
    type: 'text' | 'element';
    value: string;
    nodeName: string;
    props: {
        [prop: string]: string;
    };
    children: dynamicDesignerElementTree[];
}
export declare class codeOptionsBase {
    className: string;
    designerClassName: string;
    designerFilePath: string;
}
declare class TsUcRow {
    code: codeOptionsBase;
    designer: ucDesigner;
}
declare class TsTptRow {
    code: codeOptionsBase;
    designer: tptDesigner;
}
export declare class CommonRow {
    src: codeFileInfo;
    dynamicFileContent?: string;
    dynamicFileContentx?: string;
    htmlFileContent?: string;
    sources: {
        ts_uc: TsUcRow;
        ts_tpt: TsTptRow;
    };
}
declare class importManage {
    classes: ImportClassNode[];
    private _imprtMap;
    getNameNumber(name: string): string;
    addImport: (names: string[], url: string) => string[];
}
export interface TempleteControl {
    name: string;
    nodeName: string;
    scope: ScopeType;
    proto: string;
}
export declare const templeteControl: TempleteControl;
export type ScopeType = "private" | "protected" | "public";
export {};
