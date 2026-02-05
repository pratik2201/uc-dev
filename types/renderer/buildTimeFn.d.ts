import fs from 'fs';
export declare class buildTimeFn {
    static renderer: {
        sendSync(key: any, args: any): any;
        send(key: any, args: any): any;
        Invoke(key: any, args: any): any;
        on(key: any, callback: any): void;
        loaded(callback: any): void;
        onLoadedCallBack: any[];
        isReadyForUse: boolean;
    };
    static onReady(callback: () => void): void;
    static buildDesignerTS(files: string[], outDir: string): any;
    static crypto: {
        guid: () => any;
    };
    static fs: {
        rmSync: (path: fs.PathLike, options?: fs.RmOptions) => any;
        mkdirSync: (path: string, options: fs.MakeDirectoryOptions) => string;
        readdirSync: (path: string, encode?: BufferEncoding | null) => string[];
        writeFileSync: (path: string, data: string, encode?: fs.WriteFileOptions) => any;
    };
}
