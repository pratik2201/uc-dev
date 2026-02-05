import { UserUCConfig, IDirDeclarations } from "ap-shared-core/out/ucbuilder/configResources.js";
export declare function GetUcConfig(projectdir: string): Promise<UserUCConfig>;
export default function UcDefaultConfig<K = IDirDeclarations>(...cfg: Partial<UserUCConfig<K>>[]): UserUCConfig<K>;
export declare function ImportUserConfig(fpath: string): Promise<UserUCConfig>;
