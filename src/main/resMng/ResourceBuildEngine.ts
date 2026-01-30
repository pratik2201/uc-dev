import { BuildResourceType, ResourceKeyBridge, UserResource } from "ucbuilder/out/common/enumAndMore.js";
import { ucUtil } from "ucbuilder/out/global/ucUtil.js";
import { nodeFn } from "ucbuilder/out/renderer/nodeFn.js";
import { ResourceManage } from "ucbuilder/out/renderer/ResourceManage.js";
import { minifyCss } from "./minify.js";
import { buildTimeFn } from "../../renderer/buildTimeFn.js";
import { BuildTimeGuidMeta, GuidSequenceType, ProjectRowBase, UserUCConfig } from "ucbuilder/out/common/ipc/enumAndMore.js";
import { ProjectManage } from "ucbuilder/out/renderer/ipc/ProjectManage.js";

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

// function detectUnit(p: string): string | null {
//   if (p.endsWith(".uc.scss") || p.endsWith(".uc.html"))
//     return p.replace(/\.uc\.(scss|html)$/i, ".uc");

//   if (p.endsWith(".tpt.scss") || p.endsWith(".tpt.html"))
//     return p.replace(/\.tpt\.(scss|html)$/i, ".tpt");

//   return null;
// }

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
    projectName: string,
    projectPath: string,
    projectGuid: string,
    styleResourceGuid: string,
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
  config: UserUCConfig;
  constructor(public ucCfg: UserUCConfig) {
    const gOpt = ucCfg.preference.build.guidOptions ?? new BuildTimeGuidMeta();
    this.guidResolver = new GuidResolver(
      ucCfg.projectName,
      ucCfg.guid,
      gOpt.guidType, gOpt.sequencePadSize);
  }

  get resources() {
    return this.resourceMap;
  }
  registerProject = (s: ProjectRowBase) => {
    let stylePath = nodeFn.path.join(s.projectPath, s.config.projectBaseCssPath);
    let resourcePath = nodeFn.path.join(s.projectPath, s.config.projectBaseCssPath);
    const globalStyleguid = this.build(stylePath, {});
    const pref = s.config.preference;
    const resFilePath = 
      ucUtil.changeExtension(
        nodeFn.path.normalize(
          nodeFn.path.join(s.projectPath, pref.dirDeclaration[pref.outDir].dirPath, pref.build.ResourceDeclarationFile)), '.ts', '.js');
    this.projectList.push({
      projectName: JSON.stringify(s.projectName),
      projectPath: JSON.stringify(s.projectPath),
      projectGuid: s.config.guid,
      styleResourceGuid: globalStyleguid,
      importResource: s != ProjectManage.MAIN_PROJECT,
      resourceRelativePath: resFilePath
    });
  }
  /* ========== PUBLIC ENTRY ========== */

  build(path: string, _blueprint?: Partial<UserResource>): string {
    const absPath = nodeFn.path.resolve(path);
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
    res.name = JSON.stringify(res.name);

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
      const childAbs = nodeFn.path.resolve(nodeFn.path.dirname(absPath), rel);
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
    res.name = JSON.stringify(res.name);
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
    res.name = JSON.stringify(res.name);

    this.resourceMap.set(absPath, res);

    return ResourceKeyBridge.makeKey(guid);
  }

  /* ========== url()/data handler ========== */

  private resolveAsset(rel: string, owner: string, _blueprint?: Partial<UserResource>): string {

    if (isDataOrBlob(rel)) {

      if (this.resourceMap.has(rel))
        return ResourceKeyBridge.makeKey(this.resourceMap.get(rel)!.guid);

      const guid = this.guidResolver.getBaseGuid(rel);




      const res = new UserResource();
      Object.assign(res, _blueprint, {
        guid,
        type: "data",
        content: ResourceManage.x1(rel)
      });
      res.name = JSON.stringify(res.name);

      this.resourceMap.set(rel, res);
      return ResourceKeyBridge.makeKey(guid);
    }

    const abs = nodeFn.path.resolve(nodeFn.path.dirname(owner), rel);

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
