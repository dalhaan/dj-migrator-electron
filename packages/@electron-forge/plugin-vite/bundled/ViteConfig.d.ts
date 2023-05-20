import { ConfigEnv, loadConfigFromFile, UserConfig } from 'vite';
import { VitePluginConfig } from './Config';
/**
 * Vite allows zero-config runs, if the user does not provide `vite.config.js`,
 * then the value of `LoadResult` will become `null`.
 */
export declare type LoadResult = Awaited<ReturnType<typeof loadConfigFromFile>>;
export default class ViteConfigGenerator {
    private readonly pluginConfig;
    private readonly projectDir;
    private readonly isProd;
    private readonly baseDir;
    private rendererConfigCache;
    constructor(pluginConfig: VitePluginConfig, projectDir: string, isProd: boolean);
    resolveConfig(config: string, configEnv?: Partial<ConfigEnv>): Promise<{
        path: string;
        config: UserConfig;
        dependencies: string[];
    } | null>;
    get mode(): string;
    getDefines(): Promise<Record<string, string>>;
    getBuildConfig(watch?: boolean): Promise<UserConfig[]>;
    getRendererConfig(): Promise<UserConfig[]>;
}
//# sourceMappingURL=ViteConfig.d.ts.map