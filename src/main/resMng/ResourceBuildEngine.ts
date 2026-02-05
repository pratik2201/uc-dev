
import { ImportMapResolver } from "ap-shared-core/out/ucbuilder-devtools/ImportMapResolver.js";
import { ResourceManage } from "ucbuilder/out/renderer/ResourceManage.js";
import { nodeFn } from "ucbuilder/out/renderer/nodeFn.js";
import { ProjectManage } from "../../renderer/ProjectManage.js";
import { buildTimeFn } from "../../renderer/buildTimeFn.js";
import { minifyCss } from "./minify.js";
import { correctpath } from "ap-shared-core/out/pathUtils.js";
import { UserUCConfig, GuidSequenceType, ProjectRowBase, BuildTimeGuidMeta } from "ap-shared-core/out/ucbuilder/configResources.js";
import { UserResource, ResourceKeyBridge, BuildResourceType } from "ap-shared-core/out/ucbuilder/resources/enums.js";
import { ucUtil } from "ap-shared-core/out/ucbuilder/ucUtil.js";

/* ------------------ types ------------------ */


/* ------------------ helpers ------------------ */

const SCSS_IMPORT_RE =
  /@(use|import)\s+(?:url\()?["']([^"')]+)["']\)?\s*;/gi;

const CSS_URL_RE =
  /url\(\s*["']?([^"')]+)["']?\s*\)/gi;

const INSIDE_ATTR_RE =
  /\[inside=(["'`])((?:\\.|(?!\1)[^\\])*)\1\]([^{]*)/gi;

function isDataOrBlob(p: string) {
  return p.startsWith("data:") || p.startsWith("blob:");
}


/* ------------------ guid resolver ------------------ */

class GuidResolver {
  config: UserUCConfig;
  clear() { this.seq = 0; this.fileMap.clear(); }
  //private unitMap = new Map<string, string>();
  private fileMap = new Map<string, string>();
  private seq = 0;
  constructor(
    private projectName: string,
    private projectGuid: string,
    private mode: GuidSequenceType = "sequenceAndSameGuid",
    private padSize = 6
  ) { projectGuid = projectGuid ?? buildTimeFn.crypto.guid(); }

  private nextId(): string {
    if (this.mode === "randomGuidAndNoSequence") {
      return buildTimeFn.crypto.guid(); // uuid
    }
    const n = (this.seq++).toString().padStart(this.padSize, "0");
    return n;
  }

  private makeBase(id: string) {
    return `${this.projectName}:${this.projectGuid}:${id}`;
  }

  getBaseGuid(absPath: string): string {

    /*const unit = detectUnit(absPath);

    if (unit) {
      if (!this.unitMap.has(unit)) {
        this.unitMap.set(unit, this.makeBase(this.nextId()));
      }
      return this.unitMap.get(unit)!;
    }*/

    if (!this.fileMap.has(absPath)) {
      this.fileMap.set(absPath, this.makeBase(this.nextId()));
    }

    return this.fileMap.get(absPath)!;
  }
}


/* ------------------ engine ------------------ */

export class ResourceBuildEngine {
  projectList = new Array<{
    project: ProjectRowBase,
    resourceFilefullPath: string,
    projectGuid: string,
    importResource: boolean,
    resourceRelativePath: string
  }>();
  private resourceMap = new Map<string, UserResource>();
  private guidResolver: GuidResolver;
  clear() {
    this.resourceMap.clear();
    this.guidResolver.clear();
    this.projectList.length = 0;
  }
  ucCfg: UserUCConfig;
  constructor(rb: ProjectRowBase) {
    this.ucCfg = rb.config;
    const gOpt = this.ucCfg.preference.build.guidOptions ?? new BuildTimeGuidMeta();
    this.guidResolver = new GuidResolver(
      rb.projectName,
      this.ucCfg.guid,
      gOpt.guidType, gOpt.sequencePadSize);
  }

  get resources() {
    return this.resourceMap;
  }
  get = (guid: string) => {
    return this.resources.get(guid);
  }
  static MAIN_PROJECT = {
    cssGuid: undefined as string,
    ucConfigGuid: undefined as string,
    name: undefined as string,
    guid: undefined as string
  }
  registerProject = (s: ProjectRowBase) => {
    let stylePath = nodeFn.path.join(s.projectPath, s.config.projectBaseCssPath);
    let resourcePath = nodeFn.path.join(s.projectPath, s.config.projectBaseCssPath);


    const pref = s.config.preference;
    const resFilePath = correctpath(ucUtil.changeExtension(nodeFn.path.normalize(nodeFn.path.join(s.projectName, pref.dirDeclaration[pref.outDir].dirPath, pref.build.ResourceDeclarationFile)), '.ts', '.js'));
    this.projectList.push({
      /*projectName: JSON.stringify(s.projectName),
      projectPath: JSON.stringify(s.projectPath),
      ucConfig: configStr,
      configGuid: configGuid,
      projectGuid: s.config.guid,
      cssGuid: globalStyleguid,*/
      resourceFilefullPath:
        ucUtil.changeExtension(
          nodeFn.path.normalize(
            nodeFn.path.join(s.projectPath, pref.dirDeclaration[pref.outDir].dirPath, pref.build.ResourceDeclarationFile)), '.ts', '.js'),
      project: s,
      projectGuid: s.config.guid,
      importResource: s != ProjectManage.MAIN_PROJECT,
      resourceRelativePath: resFilePath
    });
    //console.log(resFilePath);

  }
  isVirtualResource(key: string): boolean {
    // no file extension + not an absolute/relative path
    return (
      !key.includes(nodeFn.path.sep) &&
      !nodeFn.path.extname(key)
    );
  }

  /* ========== PUBLIC ENTRY ========== */

  build(path: string, _blueprint?: Partial<UserResource>): string {
    // ---- STRING / KEY RESOURCE ----
    // ---- CONTENT-ONLY RESOURCE ----
    if (
      (!path || path.trim() === "") &&
      typeof _blueprint?.content === "string"
    ) {
      return this.buildContentOnly(_blueprint);
    }

    const absPath = /*GetProject(path)*/ nodeFn.path.resolve(nodeFn.url.fileURLToPath(path));
    const blueprint = new UserResource();
    Object.assign(blueprint, _blueprint);
    if (this.resourceMap.has(absPath)) {
      const res = this.resourceMap.get(absPath);
      if (blueprint?.name != undefined && blueprint.name != '') {
        if (res.name == undefined || res.name == '') res.name = JSON.stringify(blueprint.name);
      }
      return ResourceKeyBridge.makeKey(res!.guid);
    }

    if (!nodeFn.fs.existsSync(absPath)) {
      console.log("Missing resource:", absPath);
      return undefined;
    }

    const ext = nodeFn.path.extname(absPath).toLowerCase();

    if (ext === ".scss" || ext === ".css") return this.buildCss(absPath, _blueprint);
    if (ext === ".html" || ext === ".htm") return this.buildHtml(absPath, _blueprint);

    return this.buildAsset(absPath, _blueprint);
  }
  private buildContentOnly(
    _blueprint: Partial<UserResource>
  ): string {
    //const guid = this.guidResolver.getBaseGuid(absPath);
    const guid = this.guidResolver.getBaseGuid(
      buildTimeFn.crypto.guid()
    );

    const res = new UserResource();
    Object.assign(res, _blueprint, {
      guid,
      type: _blueprint.type ?? "string",
      content: ResourceManage.x1(_blueprint.content),
      source: ""
    });

    res.name = JSON.stringify(res.name);

    // use guid as key since no path exists
    this.resourceMap.set(guid, res);

    return ResourceKeyBridge.makeKey(guid);
  }


  /* ========== CSS HANDLER ========== */

  private buildCss(absPath: string, _blueprint?: Partial<UserResource>): string {

    const guid = this.guidResolver.getBaseGuid(absPath);
    const res = new UserResource();
    Object.assign(res, _blueprint, {
      guid,
      type: "css",
      content: "",
      source: absPath
    });
    res.name = res.name ? JSON.stringify(res.name) : undefined;

    // allocate first (circular safe)
    this.resourceMap.set(absPath, res);

    let css = nodeFn.fs.readFileSync(absPath, "utf8");

    css = stripCssComments(css);
    css = ucUtil.devEsc(css);

    // ---- inside selector ----
    css = css.replace(INSIDE_ATTR_RE, (_m, _q, rel, rest) => {
      const targetAbs = nodeFn.path.resolve(nodeFn.path.dirname(absPath), rel);
      const key = this.build(targetAbs);
      return key ? `[inside="${key}"]${rest}` : _m;
    });

    // ---- @use / @import ----
    css = css.replace(SCSS_IMPORT_RE, (_m, _t, rel) => {
      if (isDataOrBlob(rel)) return _m;
      const childAbs = ImportMapResolver.resolve(rel, absPath);//nodeFn.path.resolve(nodeFn.path.dirname(absPath), rel);
      const key = this.build(childAbs);
      return key ? `@use "${key}";` : _m;
    });

    // ---- url(...) ----
    css = css.replace(CSS_URL_RE, (_m, rel) => {
      return `url("${this.resolveAsset(rel, absPath)}")`;
    });

    res.content = ResourceManage.x1(minifyCss(css));
    return ResourceKeyBridge.makeKey(guid);
  }

  /* ========== HTML PLACEHOLDER (future) ========== */

  private buildHtml(absPath: string, _blueprint?: Partial<UserResource>): string {

    const guid = this.guidResolver.getBaseGuid(absPath);

    const html = nodeFn.fs.readFileSync(absPath, "utf8");

    const res = new UserResource();
    Object.assign(res, _blueprint, {
      guid,
      type: "html",
      content: ResourceManage.x1(html),
      source: absPath
    });

    res.name = res.name ? JSON.stringify(res.name) : undefined;
    this.resourceMap.set(absPath, res);
    return ResourceKeyBridge.makeKey(guid);
  }

  /* ========== ASSET HANDLER ========== */

  private buildAsset(absPath: string, _blueprint?: Partial<UserResource>): string {

    const guid = this.guidResolver.getBaseGuid(absPath);

    const buf = nodeFn.fs.readFileBufferSync(absPath);
    const ext = nodeFn.path.extname(absPath).slice(1).toLowerCase();

    let type: BuildResourceType = "raw";
    let content = "";

    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(ext)) {
      type = "image";
      content = `data:image/${ext};base64,${ucUtil.bufferToString(buf, "base64")}`;
    } else {
      type = "text";
      content = ResourceManage.x1(ucUtil.bufferToString(buf, "utf8"));
    }

    const res = new UserResource();
    Object.assign(res, _blueprint, {
      guid,
      type,
      content,
      source: absPath
    });

    res.name = res.name ? JSON.stringify(res.name) : undefined;

    this.resourceMap.set(absPath, res);

    return ResourceKeyBridge.makeKey(guid);
  }

  /* ========== url()/data handler ========== */

  private resolveAsset(rel: string, importerPath: string, _blueprint?: Partial<UserResource>): string {

    if (isDataOrBlob(rel)) {
      ImportMapResolver
      if (this.resourceMap.has(rel))
        return ResourceKeyBridge.makeKey(this.resourceMap.get(rel)!.guid);

      const guid = this.guidResolver.getBaseGuid(rel);




      const res = new UserResource();
      Object.assign(res, _blueprint, {
        guid,
        type: "data",
        content: ResourceManage.x1(rel)
      });

      res.name = res.name ? JSON.stringify(res.name) : undefined;

      this.resourceMap.set(rel, res);
      return ResourceKeyBridge.makeKey(guid);
    }

    const abs = nodeFn.path.resolve(nodeFn.path.dirname(importerPath), rel);

    if (!nodeFn.fs.existsSync(abs)) return rel;

    return this.build(abs, _blueprint);
  }
}

/* ------------------ comment stripper ------------------ */

function stripCssComments(input: string): string {

  let out = "";
  let i = 0;
  let inStr: string | null = null;

  while (i < input.length) {

    const c = input[i];
    const n = input[i + 1];

    if (inStr) {
      out += c;
      if (c === inStr && input[i - 1] !== "\\") inStr = null;
      i++; continue;
    }

    if (c === '"' || c === "'") {
      inStr = c; out += c; i++; continue;
    }

    if (c === "/" && n === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i++;
      i += 2; continue;
    }

    if (c === "/" && n === "/") {
      i += 2;
      while (i < input.length && input[i] !== "\n") i++;
      continue;
    }

    out += c; i++;
  }

  return out;
}
