import { GetProject, correctpath, subtractPath } from "ucbuilder/out/common/ipc/enumAndMore.js";
import { ucUtil } from "ucbuilder/out/global/ucUtil.js";
export class PathBridge {
    static path;
    static url;
    static source;
    static CheckAndSetDefault = () => {
        const _this = this;
        if (_this.GetFullPath == undefined && PathBridge.path != undefined) {
            _this.GetFullPath = (path, basePath) => {
                if (PathBridge.path.isAbsolute(path))
                    return path;
                return _this.path.resolveFilePath(basePath, path);
            };
        }
        if (_this.Convert == undefined && PathBridge.path != undefined && PathBridge.url != undefined) {
            function givaAll(givenType, path, fromSrcType = 'src', toSrcType = 'src') {
                let rtrn = {
                    paths: {},
                    project: undefined,
                };
                rtrn.project = GetProject(path, PathBridge.source, PathBridge.url);
                if (givenType == undefined || rtrn.project == undefined) {
                    console.log(path);
                    return undefined;
                }
                const pref = rtrn.project.config.preference;
                const rootDir = rtrn.project.projectPath;
                const dirDeclaration = pref.dirDeclaration;
                let right = '';
                const givenDirectoryDeclaration = dirDeclaration[fromSrcType];
                const givenFileWisePath = givenDirectoryDeclaration.fileDeclaration;
                const givenFileDeclaration = givenFileWisePath[givenType];
                const demandDeclaration = dirDeclaration[toSrcType];
                const demandFileWisePath = demandDeclaration.fileDeclaration;
                right = subtractPath(correctpath(`${rootDir}/${givenDirectoryDeclaration.dirPath}/${givenFileDeclaration.subDirPath}`), path, _this.path);
                for (const [key, typeDec] of Object.entries(dirDeclaration)) {
                    rtrn.paths[key] = {};
                    const fWisePath = rtrn.paths[key];
                    for (const [fileType, fileDec] of Object.entries(typeDec.fileDeclaration)) {
                        fWisePath[fileType] = PathBridge.changeExt(PathBridge.path.join(rootDir, typeDec.dirPath, fileDec.subDirPath, right), `${givenFileDeclaration.extension}`, `${fileDec.extension}`);
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
            };
        }
    };
    static Convert;
    static changeExt = (path, from, to) => {
        return ucUtil.changeExtension(path, from, to);
    };
    static GetFullPath;
}
//# sourceMappingURL=pathBridge.js.map