"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitePlugin = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const plugin_base_1 = require("@electron-forge/plugin-base");
const debug_1 = __importDefault(require("debug"));
const vite_1 = __importDefault(require("vite"));
const ViteConfig_1 = __importDefault(require("./ViteConfig"));
const d = (0, debug_1.default)('electron-forge:plugin:vite');
class VitePlugin extends plugin_base_1.PluginBase {
    constructor() {
        super(...arguments);
        this.name = 'vite';
        this.isProd = false;
        this.watchers = [];
        this.servers = [];
        this.init = (dir) => {
            this.setDirectories(dir);
            d('hooking process events');
            process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
            process.on('SIGINT', (_signal) => this.exitHandler({ exit: true }));
        };
        this.getHooks = () => {
            return {
                prePackage: [
                    (0, plugin_base_1.namedHookWithTaskFn)(async () => {
                        this.isProd = true;
                        await promises_1.default.rm(this.baseDir, { recursive: true, force: true });
                        await Promise.all([this.build(), this.buildRenderer()]);
                    }, 'Building vite bundles'),
                ],
            };
        };
        this.startLogic = async () => {
            if (VitePlugin.alreadyStarted)
                return false;
            VitePlugin.alreadyStarted = true;
            await promises_1.default.rm(this.baseDir, { recursive: true, force: true });
            return {
                tasks: [
                    {
                        title: 'Launching dev servers for renderer process code',
                        task: async () => {
                            await this.launchRendererDevServers();
                        },
                        options: {
                            persistentOutput: true,
                            showTimer: true,
                        },
                    },
                    // The main process depends on the `server.port` of the renderer process, so the renderer process is run first.
                    {
                        title: 'Compiling main process code',
                        task: async () => {
                            await this.build(true);
                        },
                        options: {
                            showTimer: true,
                        },
                    },
                ],
                result: false,
            };
        };
        // Main process, Preload scripts and Worker process, etc.
        this.build = async (watch = false) => {
            await Promise.all((await this.configGenerator.getBuildConfig(watch)).map((userConfig) => {
                return new Promise((resolve, reject) => {
                    var _a;
                    vite_1.default
                        .build({
                        // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
                        configFile: false,
                        ...userConfig,
                        plugins: [
                            {
                                name: '@electron-forge/plugin-vite:start',
                                closeBundle() {
                                    resolve();
                                    // TODO: implement hot-restart here
                                },
                            },
                            ...((_a = userConfig.plugins) !== null && _a !== void 0 ? _a : []),
                        ],
                    })
                        .then((result) => {
                        const isWatcher = (x) => typeof (x === null || x === void 0 ? void 0 : x.close) === 'function';
                        if (isWatcher(result)) {
                            this.watchers.push(result);
                        }
                        return result;
                    })
                        .catch(reject);
                });
            }));
        };
        // Renderer process
        this.buildRenderer = async () => {
            for (const userConfig of await this.configGenerator.getRendererConfig()) {
                await vite_1.default.build({
                    configFile: false,
                    ...userConfig,
                });
            }
        };
        this.launchRendererDevServers = async () => {
            var _a;
            for (const userConfig of await this.configGenerator.getRendererConfig()) {
                const viteDevServer = await vite_1.default.createServer({
                    configFile: false,
                    ...userConfig,
                });
                await viteDevServer.listen();
                viteDevServer.printUrls();
                this.servers.push(viteDevServer);
                if (viteDevServer.httpServer) {
                    // Make suee that `getDefines` in VitePlugin.ts gets the correct `server.port`. (#3198)
                    const addressInfo = viteDevServer.httpServer.address();
                    const isAddressInfo = (x) => x === null || x === void 0 ? void 0 : x.address;
                    if (isAddressInfo(addressInfo)) {
                        (_a = userConfig.server) !== null && _a !== void 0 ? _a : (userConfig.server = {});
                        userConfig.server.port = addressInfo.port;
                    }
                }
            }
        };
        this.exitHandler = (options, err) => {
            d('handling process exit with:', options);
            if (options.cleanup) {
                for (const watcher of this.watchers) {
                    d('cleaning vite watcher');
                    watcher.close();
                }
                this.watchers = [];
                for (const server of this.servers) {
                    d('cleaning http server');
                    server.close();
                }
                this.servers = [];
            }
            if (err)
                console.error(err.stack);
            // Why: This is literally what the option says to do.
            // eslint-disable-next-line no-process-exit
            if (options.exit)
                process.exit();
        };
    }
    setDirectories(dir) {
        this.projectDir = dir;
        this.baseDir = node_path_1.default.join(dir, '.vite');
    }
    get configGenerator() {
        var _a;
        return ((_a = this.configGeneratorCache) !== null && _a !== void 0 ? _a : (this.configGeneratorCache = new ViteConfig_1.default(this.config, this.projectDir, this.isProd)));
    }
}
exports.default = VitePlugin;
exports.VitePlugin = VitePlugin;
VitePlugin.alreadyStarted = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVml0ZVBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WaXRlUGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdFQUFrQztBQUVsQywwREFBNkI7QUFFN0IsNkRBQThFO0FBRTlFLGtEQUEwQjtBQUcxQixnREFBdUM7QUFHdkMsOERBQStDO0FBRS9DLE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLDRCQUE0QixDQUFDLENBQUM7QUFFOUMsTUFBcUIsVUFBVyxTQUFRLHdCQUE0QjtJQUFwRTs7UUFHUyxTQUFJLEdBQUcsTUFBTSxDQUFDO1FBRWIsV0FBTSxHQUFHLEtBQUssQ0FBQztRQVVmLGFBQVEsR0FBb0IsRUFBRSxDQUFDO1FBRS9CLFlBQU8sR0FBeUIsRUFBRSxDQUFDO1FBRTNDLFNBQUksR0FBRyxDQUFDLEdBQVcsRUFBUSxFQUFFO1lBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFekIsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBMEIsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDO1FBV0YsYUFBUSxHQUFHLEdBQXNCLEVBQUU7WUFDakMsT0FBTztnQkFDTCxVQUFVLEVBQUU7b0JBQ1YsSUFBQSxpQ0FBbUIsRUFBZSxLQUFLLElBQUksRUFBRTt3QkFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ25CLE1BQU0sa0JBQUUs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