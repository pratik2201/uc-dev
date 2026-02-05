import { ucUtil } from "ucbuilder/out/global/ucUtil.js";
import { nodeFn } from "ucbuilder/out/renderer/nodeFn.js";
import { IPC_API_KEY, ProjectRowR } from "ucbuilder/out/common/ipc/enumAndMore.js";
import { IpcRendererHelper } from "ucbuilder/out/renderer/ipc/IpcRendererHelper.js";
export class ProjectManage {
    static projects = [];
    static PROJECT_COUNTER = 0;
    static PROJECT_PATH = "";
    static MAIN_PROJECT;
    static wu;
    static init() {
        const prj = IpcRendererHelper.ucConfig;
        this.PROJECT_PATH = prj.projectPath;
        this.wu = window[IPC_API_KEY].fullFill;
        this.FILL_PROJECTS(prj);
    }
    static FILL_PROJECTS(_project) {
        // console.log(_project);
        //return;
        let newProject = Object.assign(new ProjectRowR(), _project);
        newProject.id = ProjectManage.PROJECT_COUNTER++;
        if (nodeFn.path.isSamePath(_project.projectPath, nodeFn.path.resolve())) {
            this.MAIN_PROJECT = _project;
        }
        ProjectManage.projects.push(newProject);
        ProjectManage.projects.sort((a, b) => b.importMetaURL.length - a.importMetaURL.length);
        let childs = [];
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
    static getInfoByProjectPath(path) {
        let findex = this.projects.findIndex(s => nodeFn.path.isSamePath(path, s.projectPath));
        if (findex == -1)
            return undefined;
        return this.projects[findex];
    }
    static getInfoByAlices(alices) {
        let findex = this.projects.findIndex(s => ucUtil.equalIgnoreCase(alices, s.projectPrimaryAlice));
        if (findex == -1)
            return undefined;
        return this.projects[findex];
    }
}
//# sourceMappingURL=ProjectManage.js.map