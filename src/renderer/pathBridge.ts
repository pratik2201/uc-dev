
import { subtractPath, correctpath } from "ap-shared-core/out/pathUtils.js";
import { IDirDeclarationTypesMap, ProjectRowBase, FileDeclarationTypes, DirDeclarationTypes, GetProject } from "ap-shared-core/out/ucbuilder/configResources.js";
import { ucUtil } from "ap-shared-core/out/ucbuilder/ucUtil.js";

interface ConvertedPathRow {
    paths: IDirDeclarationTypesMap;
    project: ProjectRowBase<unknown>;
}
export class PathBridge {
    static path: (typeof import("ucbuilder/out/renderer/nodeFn.js").nodeFn)['path'];
    static url: (typeof import("ucbuilder/out/renderer/nodeFn.js").nodeFn)['url'];
    static source: ProjectRowBase<any>[];
    static CheckAndSetDefault = () => {
        const _this = this;
        if (_this.GetFullPath == undefined && PathBridge.path != undefined) {
            _this.GetFullPath = (path: string, basePath: string) => {
                if (PathBridge.path.isAbsolute(path)) return path;
                return _this.path.resolveFilePath(basePath, path);
            }
        }
        if (_this.Convert == undefined && PathBridge.path != undefined && PathBridge.url != undefined) {


            function givaAll(givenType: FileDeclarationTypes, path: string, fromSrcType: DirDeclarationTypes = 'src', toSrcType: DirDeclarationTypes = 'src') {
                let rtrn: ConvertedPathRow = {
                    paths: {},
                    project: undefined,
                };

                rtrn.project = GetProject(path, PathBridge.source as any, PathBridge.url as any);
                if (givenType == undefined || rtrn.project == undefined) { console.log(path); return undefined; }
                const pref = rtrn.project.config.preference;
                const rootDir = rtrn.project.projectPath;
                const dirDeclaration = pref.dirDeclaration;
                let right = '';
                const givenDirectoryDeclaration = dirDeclaration[fromSrcType];
                const givenFileWisePath = givenDirectoryDeclaration.fileDeclaration;
                const givenFileDeclaration = givenFileWisePath[givenType];
                const demandDeclaration = dirDeclaration[toSrcType];
                const demandFileWisePath = demandDeclaration.fileDeclaration;
                right = subtractPath(correctpath(`${rootDir}/${givenDirectoryDeclaration.dirPath}/${givenFileDeclaration.subDirPath}`), path, _this.path as any);

                for (const [key, typeDec] of Object.entries(dirDeclaration)) {
                    rtrn.paths[key] = {} as any;
                    const fWisePath = rtrn.paths[key];
                    for (const [fileType, fileDec] of Object.entries(typeDec.fileDeclaration)) {

                        fWisePath[fileType] = PathBridge.changeExt(PathBridge.path.join(rootDir, typeDec.dirPath, fileDec.subDirPath, right),
                            `${givenFileDeclaration.extension}` as any,
                            `${fileDec.extension}` as any);

                    }
                }
                return rtrn;
            }
            _this.Convert = (path, givenDeclareType, givenFileType, demandDeclareType) => {
                //let gtype: SourceFileType = givenFileType;
                // if (gtype == undefined) {
                //     let ext = 
                //     const s = GiveSourceFileTypeFeedBack(path);
                // }
                return givaAll(givenFileType, path, givenDeclareType, demandDeclareType ?? givenDeclareType);
            }
        }

    }
    static Convert: (path: string, pathDeclare: DirDeclarationTypes, givenFileType: FileDeclarationTypes, demandPathtype?: DirDeclarationTypes) => ConvertedPathRow;

    static changeExt = (path: string, from: FileDeclarationTypes, to: FileDeclarationTypes): string => {
        return ucUtil.changeExtension(path, from, to);
    }
    static GetFullPath: (path: string, basePath: string) => string;
}
