import { CommonRow } from "./buildRow.js";
import { ResourceBuildEngine } from "../main/resMng/ResourceBuildEngine.js";
import { TemplateMaker } from "ap-shared-core/out/template/TemplateMaker.js";
export declare class commonGenerator {
    rows: CommonRow[];
    designerTMPLT: {
        [key: string]: string;
    };
    codefileTMPLT: {
        [key: string]: string;
    };
    styleTMPLT: {
        [key: string]: string;
    };
    tMaker: TemplateMaker;
    constructor();
    static ensureDirectoryExistence(filePath: string): void;
    static readTemplate(tptFileName: string): any;
    static templateUnMapped: Map<string, Function>;
    filex(tptFileName: string): Function;
    generateFiles(rows?: CommonRow[]): void;
    cssBulder: ResourceBuildEngine;
    generateResources(): boolean;
}
