import { FILE_WARCHER_FILE_ROW } from "ucbuilder/out/global/ucUtil.js";
import { builder } from "./builder.js";
export declare class fileWatcher {
    constructor(main: builder);
    main: builder;
    static renderer: {
        sendSync(key: any, args: any): any;
        send(key: any, args: any): any;
        Invoke(key: any, args: any): any;
        on(key: any, callback: any): void;
        loaded(callback: any): void;
        onLoadedCallBack: any[];
        isReadyForUse: boolean;
    };
    WATCH_LIST: {
        removed: string[];
        modified: string[];
        moved: {
            oldFile: string;
            newFile: string;
        }[];
    };
    clear(): void;
    init(): void;
    static getImportTypeRelativePath: (pth: string) => string;
    GET_REL_PATH: (update: FILE_WARCHER_FILE_ROW, InIndex: number, findable_filepath: string, _path: string) => {
        isChanged: boolean;
        path: string;
    };
    static PATTERN: RegExp;
    doRecursion: (updateStr: string) => void;
    isGenerating: boolean;
    isCollectiong: boolean;
    static isTSFile(filePath: string): boolean;
    static isHTMLFile(filePath: string): boolean;
    static isUcHTMLFile(filePath: string): boolean;
    static isSCSSFile(filePath: string): boolean;
    static isValidFileForPathReplacer(filePath: string): boolean;
    startWatch(): void;
    stopWatch(): Promise<any>;
}
