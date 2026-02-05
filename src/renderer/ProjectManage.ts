
import { nodeFn } from "ucbuilder/out/renderer/nodeFn.js";
import { IpcRendererHelper } from "ucbuilder/out/renderer/ipc/IpcRendererHelper.js"; 
import { ProjectRowBase } from "ap-shared-core/out/ucbuilder/configResources.js";
import { ucUtil } from "ap-shared-core/out/ucbuilder/ucUtil.js";
import { PreloadFullFill, IPC_API_KEY } from "ucbuilder/out/common/ipc/enumAndMore.js";


export class ProjectManage {
    static projects: ProjectRowBase[] = [];
    static PROJECT_COUNTER = 0;
    static PROJECT_PATH = "";
    static MAIN_PROJECT: ProjectRowBase;
    static wu: PreloadFullFill;
    static init() {
        const prj = IpcRendererHelper.ucConfig;
        this.PROJECT_PATH = prj.projectPath;
        this.wu = window[IPC_API_KEY].fullFill;
        this.FILL_PROJECTS(prj as any);
    }

    static FILL_PROJECTS(_project: ProjectRowBase): ProjectRowBase {
        // console.log(_project);
        //return;
        let newProject = Object.assign(new ProjectRowBase(), _project);
        //newProject.id = ProjectManage.PROJECT_COUNTER++;
        if (nodeFn.path.isSamePath(_project.projectPath, nodeFn.path.resolve())) {
            this.MAIN_PROJECT = _project;
        }
        ProjectManage.projects.push(newProject);
        ProjectManage.projects.sort((a, b) => b.importMetaURL.length - a.importMetaURL.length);
        let childs: ProjectRowBase[] = [];
        for (let i = 0, iObj = _project.children, ilen = iObj.length; i < ilen; i++) {
            childs.push(ProjectManage.FILL_PROJECTS(iObj[i]));
        }
        newProject.children = childs;
        return newProject;
    }
    /*static getMetaUrl(fullPath: string) {
        fullPath = correctpath(fullPath);
        return this.projects.find(row => fullPath.startsWith(row.projectPath))?.importMetaURL;
    }*/
    static getInfoByProjectPath(path: string): ProjectRowBase | undefined {
        let findex = this.projects.findIndex(s => nodeFn.path.isSamePath(path, s.projectPath));
        if (findex == -1) return undefined;
        return this.projects[findex];
    }
    static getInfoByAlices(alices: string): ProjectRowBase | undefined {

        let findex = this.projects.findIndex(s => ucUtil.equalIgnoreCase(alices, s.projectPrimaryAlice));
        if (findex == -1) return undefined;
        return this.projects[findex];
    }
    // static getInfo(_path: string, callerMetaUrl: string): IResolvePathResult | undefined {
    //     return resolvePathObject(_path, callerMetaUrl, ProjectManage.projects,undefined, nodeExp.path as any, nodeExp.url as any);
    // }
    // static resolve(filePath: string, importMetaUrl: string): string {
    //     importMetaUrl = importMetaUrl ?? getMetaUrl<ProjectRowBase>(filePath, this.projects);
    //     return resolvePathObject(filePath, importMetaUrl, ProjectManage.projects,undefined, nodeExp.path as any, nodeExp.url as any)?.result;
    // }

}
