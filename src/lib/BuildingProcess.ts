import path from "path";
import url from "url";
import { BuildDesigner } from "./processes/BuildDesigner.js";
import { ConfigHandler } from "./processes/ConfigHandler.js";
import { ResourceCopy } from "./processes/ResourceCopy.js";
import { collectFiles } from "./processes/findHtmlFiles.js";
import { CommonRow } from "ap-shared-core/out/ucbuilder-devtools/buildRow.js";
import { PathBridge } from "ap-shared-core/out/ucbuilder-devtools/pathBridge.js";
export class BuildingProcess {
    static configHandler = new ConfigHandler();
    static resourceCopy = new ResourceCopy();
    static buildDesigner: BuildDesigner;
    static Event = {
        onSelect_xName: (ele: Element, row: CommonRow) => { } // new CommonEvent<(ele: HTMLElement, row: CommonRow) => void>()
    }
    static async start(pth: string) {

        PathBridge.init(path, url, this.configHandler.allConfig);

        await this.configHandler.fillConfig(pth);

        // console.log(this.configHandler.allConfig);
        this.buildDesigner = new BuildDesigner();
        this.resourceCopy.fillFiles();
        this.configHandler.allConfig
            .forEach(s => this.buildDesigner.gen.cssBulder.registerProject(s));

        await this.resourceCopy.copyAssets();
        await this.resourceCopy.registerResource();
        await collectFiles();

    }
}