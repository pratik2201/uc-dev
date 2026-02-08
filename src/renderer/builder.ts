import { getCloneableObject } from "ap-shared-core/out/objectUtil.js";
import { ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
import { PathBridge } from "ap-shared-core/out/ucbuilder-devtools/pathBridge.js";
import { IHTMLxSource } from "ucbuilder/out/lib/WrapperHelper.js";
import { nodeFn } from "ucbuilder/out/renderer/nodeFn.js";
import { ResourceBuildEngine } from "../main/resMng/ResourceBuildEngine.js";
import { buildTimeFn } from "./buildTimeFn.js";
import { commonGenerator } from "./commonGenerator.js";
import { commonParser } from "./commonParser.js";
import { fileWatcher } from "./fileWatcher.js";
import { ProjectManage } from "./ProjectManage.js";
import { CommonRow, dynamicDesignerElementTree } from "ap-shared-core/out/ucbuilder-devtools/buildRow.js";
import { codeFileInfo } from "ap-shared-core/out/ucbuilder-devtools/codeFileInfo.js"; 
import { ResourceKeyBridge, UserResource } from "ucbuilder/out/common/resources/enums.js";
export interface SourceCodeNode {
    designerCode?: string,
    jsFileCode?: string,
    htmlCode?: string,
}

export class builder {
    private ignoreDirs: string[] = [];
    project: ProjectRowBase;
    ROOT_DIR = '';
    private static INSTANCE: builder;
    static GetInstance() {
        return this.INSTANCE ?? new builder();
    }
    constructor() {
        if (builder.INSTANCE != undefined) { throw new Error(`SINGLE INSTANCE ONLY use instead builder`); }
        this.ROOT_DIR = nodeFn.path.resolve('');
        this.project = ProjectManage.getInfoByProjectPath(this.ROOT_DIR);
        this.commonMng = new commonParser(this);

        this.commonMng.gen.cssBulder = new ResourceBuildEngine(this.project);
        this.filewatcher = new fileWatcher(this);
        this.filewatcher.init();
        const _this = this;
        this.project.config.preference.build.ignorePath.forEach(pth => {
            _this.addToIgnore(pth);
        });
    }
    projectDir: string = '';
    addToIgnore = (...pathlist: string[]) => {
        pathlist.forEach(p =>
            this.ignoreDirs.push(nodeFn.path.normalize(nodeFn.path.join(this.ROOT_DIR, p)))
        );
    }
    commonMng: commonParser;
    filewatcher: fileWatcher;
    Event = {
        onSelect_xName: (_ele: HTMLElement, _row: CommonRow) => { } // new CommonEvent<(ele: HTMLElement, row: CommonRow) => void>()
    }
    async getAllDesignerXfiles() {
        const rtrn = {
            cinfo: [] as codeFileInfo[]
        };
        let results = [];
        const rootPath = nodeFn.path.resolve();
        const ign = [nodeFn.path.join(rootPath, 'node_modules')];
        const pref = this.project.config.preference;
        const srcDec = pref.dirDeclaration[pref.srcDir];
        const srcFileDec = srcDec?.fileDeclaration;
        // const srcDynamicExt = srcFileDec?.tsLayout?.extension;
        const srcHtmlExt = srcFileDec?.html?.extension;
        // if (srcDynamicExt == undefined) { console.log("!!! no dynamic design file (.html.js) "); }

        await this.recursive(nodeFn.path.join(this.project.projectPath, srcDec.dirPath),
            (_pth) => false,
            async (fullpath) => {

                const extCode = codeFileInfo.getExtType(fullpath);
                if (extCode != 'none') {
                    const cInfo = new codeFileInfo();
                    // const isDynamicFile = fullpath.endsWith(srcDynamicExt);
                    const isHtmlFile = fullpath.endsWith(srcHtmlExt);
                    if (/*isDynamicFile ||*/ isHtmlFile) {
                        if (cInfo.parseUrl(fullpath, pref.srcDir as any) == false) return;
                        if (cInfo.pathOf == undefined) return;
                        if (rtrn.cinfo.findIndex(s => (
                            (isHtmlFile && s.pathOf.html == cInfo.pathOf.html) /*||
                            (isDynamicFile && s.pathOf.tsLayout == cInfo.pathOf.tsLayout)*/
                        )
                        ) == -1)
                            rtrn.cinfo.push(cInfo);
                    }
                }
            });

        return rtrn;
        /*const outExt = pref.dirDeclaration[pref.outDir]?.fileWisePath?.tsLayout?.extension;
        if (outExt == undefined) { throw new Error("!!!cant find output dynamic design file (.html.js) extension"); }
        await this.recursive(pref.outDir,
            (pth) => ign.findIndex(s => nodeExp.path.isSamePath(s, pth)) >= 0,
            async (fullpath) => {
                if (fullpath.endsWith(outExt))
                    results.push(fullpath);
            });
        return results;*/
    }
    async buildDynamic() {
        /*const rtrn = {
            cinfo: [] as codeFileInfo[]
        };
        let results = [];
        const rootPath = nodeFn.path.resolve();
        const ign = [nodeFn.path.join(rootPath, 'node_modules')];
        const pref = this.project.config.preference;
        const srcDec = pref.dirDeclaration[pref.srcDir];
        const outDec = pref.dirDeclaration[pref.outDir];
        const srcFileDec = srcDec?.fileDeclaration;
        const srcDynamicExt = srcFileDec?.tsLayout?.extension;
        const srcHtmlExt = srcFileDec?.html?.extension;
        if (srcDynamicExt == undefined) { console.log("!!! no dynamic design file (.html.js) "); }
        const fileToBuild = [] as string[];
        await this.recursive(nodeFn.path.join(this.project.projectPath, srcDec.dirPath),
            (_pth) => false,
            async (fullpath) => {
                if (fullpath.endsWith(srcDynamicExt)) fileToBuild.push(fullpath);
            });
        // console.log(['IN = ',fileToBuild]);
        // console.log(['OUT = ',nodeFn.path.join(this.project.projectPath, outDec.dirPath)]);


        buildTimeFn.buildDesignerTS(fileToBuild, nodeFn.path.join(this.project.projectPath, outDec.dirPath));
        // console.log(fileToBuild);

        for (let index = 0; index < fileToBuild.length; index++) {
            const dynamicHtmlPath = fileToBuild[index];
            const decBase = PathBridge.Convert(dynamicHtmlPath, 'src', 'tsLayout', 'out').paths;
            const outDec = decBase[pref.outDir];
            const srcDec = decBase[pref.srcDir];
            const mdl = (await import(outDec.tsLayout)).default as IHTMLxSource;
            const data = mdl.htmlSource();

            commonGenerator.ensureDirectoryExistence(srcDec.html);
            buildTimeFn.fs.writeFileSync(srcDec.html, data, 'utf-8');
            //console.log(dynamicHtmlPath);
            //console.log(data.htmlSource());            
        };
        return rtrn;
        */
    }
    nodex = {
        dynamicFiles: [] as string[],
        htmlFiles: [] as string[],
    }
    htmlToDynamic(htmlFilePath: string): string {
        if (htmlFilePath == undefined) return undefined;
        const htContent: string = nodeFn.fs.readFileSync(htmlFilePath);
        let rtrn = '';
        const source = new dynamicDesignerElementTree();
        function walk(node: HTMLElement, src: dynamicDesignerElementTree, depth = 0) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                src.nodeName = node.tagName;
                src.type = 'element';
                for (let attr of node.attributes)
                    src.props[attr.name] = attr.value;
                for (let child of node.childNodes) {
                    let childTree = new dynamicDesignerElementTree();
                    if (walk(child as HTMLElement, childTree, depth + 1) == true)
                        src.children.push(childTree);
                }
                return true;
            }
            else if (node.nodeType === Node.TEXT_NODE) {
                let text = node.nodeValue?.trim() ?? '';
                src.type = 'text';
                src.value = text;
                return text.length > 0;
            } else if (node.nodeType === Node.COMMENT_NODE) {
                let comment = node.nodeValue.trim();
                // console.log("Comment:", comment);
                src.type = 'text';
                if (comment.endsWith('?')) {
                    src.value = (comment.startsWith('? ') || comment.startsWith('?= ') || comment.startsWith("?php ")) ?
                        `<${comment}>` : `<!--${comment}-->`;
                } else src.value = `<!--${comment}-->`;
                return true;
            }

            return false;
        }
        let mainele = htContent["#$"]();
        walk(mainele, source);
        let c = this.commonMng.gen.filex('ts.uc.dynamicByHtml')(source);
        return c;
    }
    private registerMain = () => {
        const _mainProj = ProjectManage.MAIN_PROJECT;
        const _cssbuilder = this.commonMng.gen.cssBulder;
        const cfg = getCloneableObject(_mainProj.config);
        const prf = cfg.preference;
        const srcdir = prf.dirDeclaration[prf.srcDir].dirPath;
        let stylePath = nodeFn.path.join(_mainProj.projectPath, _mainProj.config.projectBaseCssPath);
        //let resourcePath = nodeFn.path.join(_mainProj.projectPath, srcdir, _mainProj.config.preference.build.ResourceDeclarationFile);
        const mp = ResourceBuildEngine.MAIN_PROJECT;
        mp.cssGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(stylePath, {})));
        mp.ucConfigGuid = JSON.stringify(ResourceKeyBridge.extractKey(_cssbuilder.build(undefined, {
            content: JSON.stringify(_mainProj.config)
        })));
        mp.name = JSON.stringify(_mainProj.projectName);
        mp.guid = _mainProj.config.guid;
    }
    counter = 0;
    async buildALL(onComplete = () => { }, _fillReplacerPath = true) {
        let _this = this;
        this.commonMng.reset();
        let prj = this.project;
        if (prj.config.env == 'release') return;
        const pref = this.project.config.preference;
        const srcdirDeclaration = pref.dirDeclaration[pref.srcDir];
        const fileWisePath = srcdirDeclaration.fileDeclaration;
        const srcDeclareKey = pref.srcDir;
        const outDeclareKey = pref.outDir;
        const outDec = pref.dirDeclaration[outDeclareKey];
        const designerFileDeclaration = fileWisePath.designer;
        // this.commonMng.gen.cssBulder.config
        let designerPath = nodeFn.path.join(prj.projectPath, srcdirDeclaration.dirPath ?? '', designerFileDeclaration?.subDirPath ?? '');
        this.registerMain();


        PathBridge.source.forEach(s => this.commonMng.gen.cssBulder.registerProject(s));
        //const runtimeSrc: BuildResource[] = [];
        //await this.buildDynamic();
        await this.recursive(nodeFn.path.join(this.project.projectPath, outDec.dirPath),
            (_pth) => false,
            async (fullpath) => {
                if (fullpath.endsWith('.resx.js')) {
                    const filwRes: UserResource[] = [];
                    const _default = (await import(fullpath)).default;
                    if (typeof _default === 'function')
                        filwRes.push(..._default());
                    else if (typeof _default === 'object')
                        filwRes.push(..._default);
                    filwRes.forEach(r => {
                        if (r.source != undefined) {

                            this.commonMng.gen.cssBulder.build(nodeFn.path.resolveFilePath(fullpath, r.source), r);
                        }
                    });
                    //runtimeSrc.push(...filwRes);
                }

                /*
                const extCode = codeFileInfo.getExtType(fullpath);
                if (extCode != 'none') {
                    const cInfo = new codeFileInfo();
                    const isDynamicFile = fullpath.endsWith(srcDynamicExt);
                    const isHtmlFile = fullpath.endsWith(srcHtmlExt);
                    if (isDynamicFile || isHtmlFile) {
                        cInfo.parseUrl(fullpath, pref.srcDir as any);
                        if (cInfo.pathOf == undefined  ) return;
                        if (rtrn.cinfo.findIndex(s => (
                            (isHtmlFile && s.pathOf.html == cInfo.pathOf.html) ||
                            (isDynamicFile && s.pathOf.tsLayout == cInfo.pathOf.tsLayout)
                        )
                        ) == -1)
                            rtrn.cinfo.push(cInfo);
                    }
                }
                */
            });


        let cInfos = ((await _this.getAllDesignerXfiles())).cinfo;

        //console.log(Resources.all());

        // const messages = {
        //     generateOutputAndRetry: false
        // }

        //debugger;
        for (let index = 0; index < cInfos.length; index++) {
            const cinfo = cInfos[index];
            //if (cinfo.pathOf.html.includes('ledger$form')) debugger;
            const srcDec = cinfo.allPathOf[pref.srcDir];
            /* const outDec = cinfo.allPathOf[pref.outDir];
             let dynamicOutputPath = outDec.tsLayout;
             let dynamicOutputData = undefined as string;
             let hasDynamicOutput = nodeFn.fs.existsSync(dynamicOutputPath);
             if (hasDynamicOutput) {
                // console.log(`====>${dynamicOutputPath}`);
                 const dtodata = (await DynamicToHtml(dynamicOutputPath));
                 dynamicOutputData = dtodata?.htmlSource();
                 //console.log(dynamicOutputData);
                 dynamicOutputData = dynamicOutputData?.trim() ?? '';
                 if (dynamicOutputData.length > 0) {
                     const htnode = dynamicOutputData["#$"]();
                     if (htnode?.nodeName != undefined && htnode?.nodeType != undefined) {
                         commonGenerator.ensureDirectoryExistence(cinfo.pathOf.html);
                         try {
                             buildTimeFn.fs.writeFileSync(cinfo.pathOf.html, dynamicOutputData);
                         } catch (eee) {
                             console.warn(eee);
                         }
                     }
                 } else {
                     if (nodeFn.fs.existsSync(srcDec.tsLayout)) {
                         const dynamicContent = nodeFn.fs.readFileSync(srcDec.tsLayout);
                         if (dynamicContent?.trim().length == 0) {
                             buildTimeFn.fs.writeFileSync(srcDec.tsLayout,
                                 this.commonMng.gen.filex('ts.uc.dynamic')({}), 'utf-8');
                             console.log('GENERATE `output` AND REBUILD DESINGER..');
                         }
                     }
                 }
 
                 await this.commonMng.init(cinfo);
             } else {
                 if (nodeFn.fs.existsSync(srcDec.tsLayout)) {
                     console.log('GENERATE `output` AND REBUILD DESINGER..');
                 } else */
            /*
            if (nodeFn.fs.existsSync(srcDec.htmlLayout)) {
                buildTimeFn.fs.writeFileSync(srcDec.html, nodeFn.fs.readFileSync(srcDec.htmlLayout), 'utf-8');
                console.log(`${srcDec.htmlLayout} HTML generated by htmllayout`);
            }
            if (nodeFn.fs.existsSync(srcDec.html))
                await this.commonMng.init(cinfo);
                */
            // }
        }
        /*
        if (nodeFn.fs.existsSync(designerPath)) {
            let codeExt = fileWisePath.code.extension;
            let designerExt = fileWisePath.designer.extension;

            await this.recursive(designerPath, undefined, async (pth) => {
                if (pth.endsWith(designerExt)) {
                    let _pthObj = PathBridge.Convert(pth, pref.srcDir as any, 'designer').paths[pref.srcDir];
                    let bothExist =   (nodeFn.fs.existsSync(_pthObj.html) || nodeFn.fs.existsSync(_pthObj.tsLayout));
                    if (!bothExist) {
                        console.log(`${_pthObj.designer} file deleted...`);
                        buildTimeFn.fs.rmSync(_pthObj.designer)
                    }
                }
            });
        }*/
        this.commonMng.gen.generateFiles(this.commonMng.rows);
        onComplete();
        /*if (nodeFn.fs.existsSync(designerPath)) {
            let codeExt = fileWisePath.code.extension;
            let designerExt = fileWisePath.designer.extension;
 
            await this.recursive(designerPath, undefined, async (pth) => {
                if (pth.endsWith(designerExt)) {
                    let _pthObj = PathBridge.Convert(pth, pref.srcDir as any, 'designer').paths[pref.srcDir];
                    let bothExist = nodeFn.fs.existsSync(_pthObj.code) && (nodeFn.fs.existsSync(_pthObj.html) || nodeFn.fs.existsSync(_pthObj.tsLayout));
                    if (!bothExist) {
                        console.log(`${_pthObj.designer} file deleted...`);
                        nodeFn.fs.rmSync(_pthObj.designer)
                    }
                }
            });
        }
 
 
 
 
        const outCodeExt = pref.dirDeclaration[pref.outDir].fileWisePath.tsLayout.extension;
        let demandFiles = await _this.getAllDesignerXfiles();
        for (let i = 0; i < demandFiles.length; i++) {
            let dfile = demandFiles[i];
            let outDynamicDesignFile = nodeExp.path.resolve(dfile);
            if (nodeFn.fs.existsSync(outDynamicDesignFile)) {
                try {
                    let content = await DynamiccToHtml(outDynamicDesignFile);// new WrapperHelper(importUrl)
                    if (content != undefined) {
                        let cinfo = PathBridge.Convert(outDynamicDesignFile, outDeclareKey as any, 'tsLayout', srcDeclareKey as any).paths[srcDeclareKey];
                        commonGenerator.ensureDirectoryExistence(cinfo["html"]);
                        nodeFn.fs.writeFileSync(cinfo["html"], content, 'binary');
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
 
            }
        }
 
 
 
        let bpath = nodeExp.path.join(this.project.projectPath, this.project.config.developer.build.buildPath);
        await this.recursive(bpath, undefined, async (pth) => {
            await _this.checkFileState(pth);
        });
        this.commonMng.gen.generateFiles(this.commonMng.rows);
        onComplete();*/
        //if (this.filewatcher != undefined) this.filewatcher.startWatch();
    }
    _ignoreThis = (pth: string) => {
        return this.ignoreDirs.findIndex(s => {
            return nodeFn.path.isSamePath(s, pth)
        }) != -1;
    }
    /** @private */
    recursive = async (parentDir: string, /*ignoreDir = this.ignoreDirs,*/
        ignoreThis = this._ignoreThis,
        callback: (path: string) => Promise<void>) => {
        const _this = this;
        let DirectoryContents = buildTimeFn.fs.readdirSync(parentDir + '/');
        for (let i = 0, ilen = DirectoryContents.length; i < ilen; i++) {
            const file = DirectoryContents[i];
            let _path = nodeFn.path.join(parentDir, file);//["#toFilePath"]();
            if (nodeFn.fs.isDirectory(_path)) {
                if (ignoreThis(_path) == false)
                    await this.recursive(_path, ignoreThis, callback);
            } else {
                await callback(_path);
            }
        }
    }

    /** @param {codeFileInfo} fInfo */
    // async buildFiles(fInfos: codeFileInfo[], onComplete = () => { }) {

    //     if (this.project.config.env == 'release') return;
    //     setTimeout(async () => {
    //         this.commonMng.reset();
    //         for (let i = 0, ilen = fInfos.length; i < ilen; i++) {
    //             const fInfo = fInfos[i];
    //             if (nodeFn.fs.existsSync(fInfo.pathOf.html)) {
    //                 await this.checkFileState(fInfo.pathOf.html);
    //                 this.commonMng.gen.generateFiles(this.commonMng.rows);
    //             }
    //         }
    //         onComplete();
    //     }, 1);
    // }

    // async getOutputCode(fInfo: codeFileInfo, htmlContents: string): Promise<SourceCodeNode> {
    //     await this.checkFileState(fInfo.pathOf.html, htmlContents);
    //     let row = this.commonMng.rows[0];
    //     return {
    //         designerCode: this.commonMng.gen.getDesignerCode(row),
    //         jsFileCode: this.commonMng.gen.getJsFileCode(row)
    //     };
    // }

    async checkFileState(_filePath: string, _htmlContents?: string) {
        // if (filePath.endsWith('uc.html')) { //  IF USER CONTROL
        //     await this.commonMng.init(filePath, htmlContents);
        // } else if (filePath.endsWith('tpt.html')) { //  IF TEMPLATE
        //     await this.commonMng.init(filePath, htmlContents);
        // }
    }
}

