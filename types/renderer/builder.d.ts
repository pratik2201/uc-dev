import { codeFileInfo } from "./codeFileInfo.js";
import { CommonEvent } from "ucbuilder/out/global/commonEvent.js";
import { commonParser } from "./commonParser.js";
import { fileWatcher } from "./fileWatcher.js";
import { ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
export interface SourceCodeNode {
    designerCode?: string;
    jsFileCode?: string;
    htmlCode?: string;
}
export declare class builder {
    private ignoreDirs;
    project: ProjectRowBase;
    ROOT_DIR: string;
    private static INSTANCE;
    static GetInstance(): builder;
    constructor();
    projectDir: string;
    addToIgnore: (...pathlist: string[]) => void;
    commonMng: commonParser;
    filewatcher: fileWatcher;
    Event: {
        onSelect_xName: CommonEvent;
    };
    getAllDesignerXfiles(): Promise<{
        cinfo: codeFileInfo[];
    }>;
    buildDynamic(): Promise<{
        cinfo: codeFileInfo[];
    }>;
    nodex: {
        dynamicFiles: string[];
        htmlFiles: string[];
    };
    htmlToDynamic(htmlFilePath: string): string;
    private registerMain;
    counter: number;
    buildALL(onComplete?: () => void, _fillReplacerPath?: boolean): Promise<void>;
    _ignoreThis: (pth: string) => boolean;
    /** @private */
    recursive: (parentDir: string, /*ignoreDir = this.ignoreDirs,*/ ignoreThis: (pth: string) => boolean, callback: (path: string) => Promise<void>) => Promise<void>;
    /** @param {codeFileInfo} fInfo */
    checkFileState(filePath: string, htmlContents?: string): Promise<void>;
}
