import { CommonRow } from "ap-shared-core/out/uc-dev/buildRow.js";
import { PathBridge } from "ap-shared-core/out/uc-dev/pathBridge.js";
import path from "path";
import url from "url";
import { BuildDesigner } from "./processes/BuildDesigner.js";
import { ConfigHandler } from "ap-shared-core/out/uc-dev/ConfigHandler.js";
import { ResourceCopy } from "./processes/ResourceCopy.js";
import { collectFiles } from "./processes/findHtmlFiles.js";
export class BuildingProcess {
    static configHandler = new ConfigHandler();
    static resourceCopy = new ResourceCopy();
    static buildDesigner: BuildDesigner;
    
    static FILE_COUNT_OF_PREV_BUILD = 0;
    static Event = {
        onSelect_xName: (ele: Element, row: CommonRow) => { }
    }

    static async startBuild(pth: string) {
        console.log(`Build Started`);
        PathBridge.init(path, url, this.configHandler.allConfig);
        await this.configHandler.fillConfig(pth);
        this.buildDesigner = new BuildDesigner();
        this.resourceCopy.fillFiles();

        this.configHandler.allConfig
            .forEach(s => this.buildDesigner.gen.cssBulder.registerProject(s));

        await this.resourceCopy.copyAssets();
        await this.resourceCopy.registerResource();
        await collectFiles();
    }
}