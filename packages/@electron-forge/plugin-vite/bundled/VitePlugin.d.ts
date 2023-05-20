import { PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
import { VitePluginConfig } from './Config';
export default class VitePlugin extends PluginBase<VitePluginConfig> {
    private static alreadyStarted;
    name: string;
    private isProd;
    private projectDir;
    private baseDir;
    private configGeneratorCache;
    private watchers;
    private servers;
    init: (dir: string) => void;
    private setDirectories;
    private get configGenerator();
    getHooks: () => ForgeMultiHookMap;
    startLogic: () => Promise<StartResult>;
    build: (watch?: boolean) => Promise<void>;
    buildRenderer: () => Promise<void>;
    launchRendererDevServers: () => Promise<void>;
    exitHandler: (options: {
        cleanup?: boolean;
        exit?: boolean;
    }, err?: Error | undefined) => void;
}
export { VitePlugin };
//# sourceMappingURL=VitePlugin.d.ts.map