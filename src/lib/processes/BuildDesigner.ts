import { ATTR_OF, Control, correctpath, DesignerOptionsBase, IFileDeclaration, IUCConfigPreference, ProjectRowBase, ResourceKeyBridge, ScopeType, TemplateMaker, UserUCConfig } from "ap-shared-core/core-common.js";
import { codeFileInfo, codeOptionsBase, CommonRow, ImportMapResolver, relativeFilePath } from "ap-shared-core/core-main.js";
import { ICoupleNode, ucUtil } from "ap-shared-core/core.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, normalize, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { BuildingProcess } from "../BuildingProcess.js";
import { commonGeneratorX } from "./commonGeneratorX.js";
import { EModify, GetTemplateMetaByContent$main } from "./jsToHtml.js";
import { ResourceBuildEngine } from "./ResourceBuildEngine.js";
export class BuildDesigner {
    gen: commonGeneratorX;
    bldr: BuildingProcess;

    cInfoToBuild: codeFileInfo[] = [];
    rows: CommonRow[] = [];
    reset() {
        this.gen.cssBulder.clear();
        this.rows.length = 0;
    }
    SRC_DEC: Partial<{
        code: IFileDeclaration;
        designer: IFileDeclaration;
        html: IFileDeclaration;
        scss: IFileDeclaration;
    }> = {};
    OUT_DEC: Partial<{
        code: IFileDeclaration;
        designer: IFileDeclaration;
        html: IFileDeclaration;
        scss: IFileDeclaration;
    }> = {};
    SRC_CODE_EXT: string;
    OUT_CODE_EXT: string;
    dynamicTemplate: Function;
    constructor() {
        this.bldr = BuildingProcess;
        this.gen = new commonGeneratorX();
        this.project = BuildingProcess.configHandler.MAIN_CONFIG;

        this.gen.cssBulder = new ResourceBuildEngine(this.project);
        this.CONFIG = this.project?.config;
        this.gen.cssBulder.doEncrypt = this.CONFIG.encryptResource;
        this.PREFERENCE = this.CONFIG?.preference;
        this.SRC_DEC = this.PREFERENCE?.dirDeclaration[this.PREFERENCE?.srcDec]?.fileDeclaration as any;
        this.OUT_DEC = this.PREFERENCE?.dirDeclaration[this.PREFERENCE?.outDec]?.fileDeclaration as any;
        this.SRC_CODE_EXT = this.SRC_DEC.code.extension;
        this.OUT_CODE_EXT = this.OUT_DEC.code.extension;
        this.PROJECT_PATH_LENGTH = this.project.projectPath.length;
    }
    CONFIG: UserUCConfig;
    PREFERENCE: IUCConfigPreference;
    project: ProjectRowBase;
    PROJECT_PATH_LENGTH = 0;
    async init(cinfo: codeFileInfo) {
        let row = await this.fill(cinfo);
        if (row != undefined)
            this.rows.push(row);
    }

    tmaker = new TemplateMaker();
    //codeHT: HTMLElement;
    async fill(cinfo: codeFileInfo): Promise<CommonRow> {
        let _row = new CommonRow();
        let _this = this;

        switch (cinfo.extCode) {
            case '.uc': return (await this.fillUc(cinfo, _row)) != undefined ? _row : undefined;
            case '.tpt': return (await this.fillTpt(cinfo, _row)) != undefined ? _row : undefined;
            default: return undefined;
        }
    }
    common0 = (_row: CommonRow) => {
        const finfo = _row.src;
        const filePref = finfo?.projectInfo?.config?.preference;
        const srcDec = filePref.srcDec;
        const code = readFileSync(finfo.allPathOf[srcDec].html, 'utf-8');
        return code;
    }
    fillUc = async (finfo: codeFileInfo, _row: CommonRow) => {
        let row = _row.sources['ts_uc'];
        let _this = this;
        _row.src = finfo;
        let onSelect_xName = BuildingProcess.Event.onSelect_xName;
        const pref = _row.src?.projectInfo.config.preference;
        const srcPathOf = _row.src.allPathOf[pref.srcDec];
        const outPathOf = _row.src.allPathOf[pref.outDec];
        let htmlCode: string;
        const pathOf = finfo.pathOf;
        htmlCode = this.common0(_row);
        if (htmlCode == undefined) return undefined;
        else if (htmlCode.trim() == '') {
            htmlCode = `<WRAPPER x-caption="${finfo.name}"></WRAPPER>`;
            writeFileSync(finfo.allPathOf[pref.srcDec].html, htmlCode, 'utf8');
        }
        if (!existsSync(finfo.allPathOf[pref.srcDec].scss)) {
            writeFileSync(finfo.allPathOf[pref.srcDec].scss, `&{
    position: relative; 
    display:block;  width: 800px; height: 500px;
    background-color: #aeaeae;  
}`, 'utf8');
        }
        htmlCode = ucUtil.devEsc(htmlCode);
        htmlCode = ucUtil.PHP_REMOVE(ucUtil.devEsc(htmlCode));

        // try {
        //     if (compileedCode.trim() != '') {
        //         compileedCode = ucUtil.PHP_REMOVE(compileedCode);
        //         /*try {
        //            let cccodeCallback = this.tmaker.compileTemplate(compileedCode);
        //            compileedCode = ucUtil.PHP_REMOVE(cccodeCallback({}));
        //        } catch {
        //            console.error(`error at 'BuildDesigner.fillUc' in template ;\n error file '${srcPathOf.html} ' `)
        //        }*/
        //         // _row.htmlFileContent = code;
        //         //row.designer.material.htmlContents = JSON.stringify(code);
        //     } else {
        //         console.log(`no content in '${srcPathOf.html}'`);
        //         return;
        //         // htmlCode = `<WRAPPER  x-caption="Form" ></WRAPPER>`;
        //         // this.codeHT = EModify.GetHtmlElement(htmlCode) as HTMLElement;
        //         //_row.dynamicFileContent = commonGenerator.readTemplate('ts.uc.dynamic');
        //     }
        // } catch (ex) {
        //     console.log(ex);
        //     return undefined;
        // }

        let codeHT = EModify.GetHtmlElement(htmlCode);

        row.designer.baseClassName = 'Usercontrol';//.name;
        this.common1(row.designer, row.code, _row.src);

        const elements = Array.from(EModify.querySelectorAll(codeHT, `[${ATTR_OF.X_NAME}]`));
        let accessKeys = `"` + ucUtil.distinct(Array.from(EModify.querySelectorAll(codeHT, `[${ATTR_OF.ACCESSIBLE_KEY}]`))
            .map(s => EModify.getAttribute(s, ATTR_OF.ACCESSIBLE_KEY))).join(`" | "`) + `"`;

        /*let cssCode = '';
        if (existsSync(srcPathOf.scss)) cssCode = this.gen.cssBulder.treeShakeCss(srcPathOf.scss);

        let ucMeta: IUsercontrolContent = {
            htmlContents: htmlCode,
            cssContents: cssCode,
        }*/
        // if (existsSync()) {
        // }
        let cnt: ICoupleNode = {
            htmlGuid: ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathOf.html, { source: srcPathOf.html })),
            cssGuid: ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathOf.scss, { source: srcPathOf.scss })),
        }
        row.designer.htmlGuid = cnt.htmlGuid;
        row.designer.cssGuid =
            row.designer.guid = cnt.cssGuid;




        row.designer.getterFunk = accessKeys;

        //let im = row.designer.importClasses;
        const _importer = row.designer.importer;
        const imppath = _row.src?.projectInfo.projectName == 'uc-runtime' ?
            relativeFilePath(_row.src.allPathOf.out.designer, join(_row.src.projectInfo.projectPath, 'out/core.js'))
            : 'uc-runtime/core.js';
        _importer.addImport(['Usercontrol', 'intenseGenerator', 'IUcOptions', 'ResourceManage'], imppath);


        this.common2(row.designer, finfo);


        const _exists = existsSync;
        for (let i = 0, iObj = elements, len = iObj.length; i < len; i++) {
            const element = iObj[i];
            onSelect_xName(element as any, _row);
            const ctr = new Control();
            ctr.name = EModify.getAttribute(element, ATTR_OF.X_NAME);
            ctr.nodeName = element.tagName;
            ctr.scope = EModify.getAttribute(element, ATTR_OF.SCOPE_KEY) ?? 'public' as any;
            ctr.proto = EModify.nodeType(element);  //Object.getPrototypeOf(element).constructor.name;
            ctr.generic = EModify.getAttribute(element, 'x-generic');
            ctr.generic = ctr.generic == null ? undefined : `<${ctr.generic}>`;
            ctr.type = 'none';
            if (EModify.hasAttribute(element, "x-from")) {
                let _sspath = ucUtil.devEsc(EModify.getAttribute(element, "x-from"));
                let _subpath = ImportMapResolver.resolve(_sspath, outPathOf.html);// resolveFilePath(outPathOf.html, _sspath);
                _subpath = fileURLToPath(_subpath);
                let uFInf = new codeFileInfo();
                uFInf.parseUrl(_subpath, pref.outDec as any, outPathOf.html);
                if (uFInf.pathOf == undefined) debugger;
                if (_exists(uFInf.pathOf.code) ||
                    _exists(uFInf.pathOf.scss) || _exists(uFInf.pathOf.html)) {
                    ctr.type = uFInf.extCode;
                    ctr.nodeName = uFInf.name;
                    ctr.src = uFInf;
                    const uFpref = uFInf.projectInfo.config.preference;
                    const uFprefOutdir = uFInf.allPathOf[uFpref.outDec];
                    ctr.codeFilePath = relativeFilePath(outPathOf.designer, uFprefOutdir['code']);
                    ctr.importedClassName = row.designer.importer.addImport([uFInf.name], ctr.codeFilePath)[0];
                    row.designer.controls.push(ctr);
                }
            } else row.designer.controls.push(ctr);

        }
        return _row;
    }

    fillTpt = async (finfo: codeFileInfo, _row: CommonRow) => {
        let row = _row.sources['ts_tpt'];
        let _this = this;
        _row.src = finfo;
        const pref = _row.src?.projectInfo.config.preference;
        const srcPathof = _row.src.allPathOf[pref.srcDec];
        const outPathof = _row.src.allPathOf[pref.outDec];
        let onSelect_xName = BuildingProcess.Event.onSelect_xName;
        let projectPath = resolve();

        let htmlcode = this.common0(_row);
        if (htmlcode == undefined) return undefined;
        htmlcode = ucUtil.devEsc(htmlcode);

        let compileedCode = ucUtil.PHP_REMOVE(htmlcode);
        /*try {
            let cccodeCallback = this.tmaker.compileTemplate(htmlcode);
            compileedCode = ucUtil.PHP_REMOVE(cccodeCallback({}));
        } catch (ex) {
            console.error(`error at 'BuildDesigner.fillTpt' in template ;\n error file '${srcPathof.html} ' `);
            return undefined;
        }*/
        //const codeHT = EModify.GetHtmlElement(compileedCode);


        let rootpath = relative(projectPath, srcPathof.html);

        try {
            if (compileedCode.trim() != '') {
                compileedCode = ucUtil.PHP_REMOVE(htmlcode);
                //this.codeHT = EModify.GetHtmlElement(compileedCode);

            } else {
                console.log(`NO CONTENT FOUND INSIDE '${srcPathof.html}'`);
                return;
                //             htmlcode = `
                // <X:TEMPLATE>
                //     <WRAPPER id="header"></WRAPPER>
                //     <WRAPPER id="primary"></WRAPPER>
                //     <WRAPPER id="footer"></WRAPPER>
                // </X:TEMPLATE>`;
                //             this.codeHT = GetHtmlElement(htmlcode);

            }
        } catch (ex) {
            console.log(ex);
            return undefined;
        }
        this.common1(row.designer, row.code, _row.src);
        row.designer.importer.addImport(['TemplateNode', 'Template', 'intenseGenerator', 'ITptOptions', 'ResourceManage'],
            'uc-runtime/core.js');


        this.common2(row.designer, finfo);
        let cssContent: string = '';
        if (existsSync(srcPathof.scss)) cssContent =
            this.gen.cssBulder.
                treeShakeCss(srcPathof.scss);

        //const guid = JSON.stringify(ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.html))); 
        // if (cssContent.includes(`dgv-group[isActive="true"]`)) debugger;
        let cnt: ICoupleNode = {
            htmlGuid: ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.html, { source: srcPathof.html })),
            cssGuid: ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.scss, { source: srcPathof.scss })),
        }

        row.designer.htmlGuid = cnt.htmlGuid;
        row.designer.cssGuid =
            row.designer.guid = cnt.cssGuid;
        // row.designer.guid = JSON.stringify(
        //     ResourceKeyBridge.extractKey(
        //         this.gen.cssBulder.build(undefined, {
        //             source: srcPathof.html,
        //             content: JSON.stringify(cnt)
        //         })
        //     )
        // );
        let s =



            // data.outerCssContents =
            //const cssGuid = JSON.stringify(ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.scss)));        
            //const htmlGuid = JSON.stringify(ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.html)));
            //const guid = JSON.stringify(ResourceKeyBridge.extractKey(this.gen.cssBulder.build(srcPathof.html)));
            row.designer.baseClassName = 'Template';
        /* if (_row.htmlFileContent == undefined) {
             subTemplates =   Template.GetObjectOfTemplate(
                 row.designer.cssGuid,
                 this.gen.cssBulder.get(row.designer.htmlGuid).content,
                 this.gen.cssBulder.get(row.designer.cssGuid).content
             );
         } else {
             let tob = Template.GetOptionsByContent(_row.htmlFileContent,
                 commonGenerator.readTemplate('ts.tpt.style'));
             subTemplates = Object.values(tob.tptObj);
         }*/
        let tpts = row.designer.templetes;



        let subTemplates = GetTemplateMetaByContent$main(compileedCode, cssContent);
        for (const [accessKey, template] of Object.entries(subTemplates.templates)) {
            let rolelwr = accessKey;  //template.accessKey;
            if (tpts.findIndex(s => ucUtil.equalIgnoreCase(s.name, rolelwr)) != -1) return;
            let controls: Control[] = [];
            if (template.htmlContents == '' || template.htmlContents == undefined) {
                continue;
            }
            let cntHT = EModify.GetHtmlElement(ucUtil.PHP_REMOVE(template.htmlContents));
            if (cntHT['length'] != undefined) cntHT = cntHT[0];
            const elements = Array.from(EModify.querySelectorAll(cntHT, `[${ATTR_OF.X_NAME}]`));
            for (let i = 0, iObj = elements, len = iObj.length; i < len; i++) {
                const element = iObj[i];
                onSelect_xName(element as any, _row);
                let scope = EModify.getAttribute(element, ATTR_OF.SCOPE_KEY) as ScopeType;
                if (scope == undefined)
                    scope = 'public';
                let _generic = EModify.getAttribute(element, 'x-generic');
                _generic = _generic == null ? '' : '<' + _generic + '>';
                let ctr = Object.assign(new Control(), {
                    name: EModify.getAttribute(element, "x-name"),
                    nodeName: element.tagName,
                    generic: _generic,
                    proto: EModify.nodeType(element),//ucUtil.GetType(element),
                    scope: scope,
                });
            }
            tpts.push({
                name: accessKey,
                scope: "public",
                controls: controls
            });
        };















        //}
        return _row;
    }

    guidList = new Map<string, string>();
    getGuid = (_path: string): string => {
        _path = normalize(_path);
        let guid = this.guidList.get(_path);
        if (guid != undefined) return guid;
        else {
            guid = crypto.randomUUID();
            this.guidList.set(_path, guid);
            return guid;
        }
    }
    common2 = (des: DesignerOptionsBase, finfo: codeFileInfo) => {
        des.importer.addImport([finfo.name], des.codeFilePath);

        const pref = finfo?.projectInfo.config.preference;
        const srcPathOf = finfo.allPathOf[pref.srcDec];
        const outPathOf = finfo.allPathOf[pref.outDec];
        const guid = crypto.randomUUID();
        des.rootPath = JSON.stringify(normalize(relativeFilePath(finfo.projectInfo.projectPath, outPathOf.scss)));


    }
    common1 = (des: DesignerOptionsBase, code: codeOptionsBase, finfo: codeFileInfo) => {
        const pathOf = finfo.pathOf;

        code.className = finfo.name;
        des.className =
            code.designerClassName = `${finfo.name}$Designer`;
        /*if (pathOf.tsLayout != undefined) {
            let dsTodyn = ucUtil.resolveSubNode(relativeFilePath(pathOf.designer, pathOf.tsLayout));
            des.dynamicFilePath = ucUtil.changeExtension(dsTodyn, this.SRC_CODE_EXT, this.OUT_CODE_EXT);
        }*/
        if (pathOf.html != undefined) {
            let dsToht = ucUtil.resolveSubNode(relativeFilePath(pathOf.designer, pathOf.html));
            des.htmlFilePath = dsToht;
        }
        if (pathOf.code != undefined) {
            let dsTocd = ucUtil.resolveSubNode('./' + relativeFilePath(pathOf.designer, pathOf.code));
            des.codeFilePath = ucUtil.changeExtension(dsTocd, this.SRC_CODE_EXT, this.OUT_CODE_EXT);
            let tsToDes = ucUtil.resolveSubNode('./' + relativeFilePath(pathOf.code, pathOf.designer));
            code.designerFilePath = ucUtil.changeExtension(tsToDes, this.SRC_CODE_EXT, this.OUT_CODE_EXT);
        }

    }
    nc(_path: string, fromFilePath: string) {
        let fpath = join(resolve(), _path);
        return correctpath(ucUtil.resolveSubNode(relativeFilePath(fromFilePath, fpath)));
    }

} 