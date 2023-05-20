"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const debug_1 = __importDefault(require("debug"));
const vite_1 = require("vite");
const plugins_1 = require("./util/plugins");
const d = (0, debug_1.default)('electron-forge:plugin:vite:viteconfig');
class ViteConfigGenerator {
    constructor(pluginConfig, projectDir, isProd) {
        this.pluginConfig = pluginConfig;
        this.projectDir = projectDir;
        this.isProd = isProd;
        this.baseDir = node_path_1.default.join(projectDir, '.vite');
        d('Config mode:', this.mode);
    }
    resolveConfig(config, configEnv = {}) {
        var _a, _b;
        // `command` is to be passed as an arguments when the user export a function in `vite.config.js`.
        // @see - https://vitejs.dev/config/#conditional-config
        (_a = configEnv.command) !== null && _a !== void 0 ? _a : (configEnv.command = this.isProd ? 'build' : 'serve');
        // `mode` affects `.env.[mode]` file loading.
        (_b = configEnv.mode) !== null && _b !== void 0 ? _b : (configEnv.mode = this.mode);
        return (0, vite_1.loadConfigFromFile)(configEnv, config);
    }
    get mode() {
        // Vite's `mode` can be passed in via command.
        // Since we are currently using the JavaScript API, we are opinionated defining two default values for mode here.
        // The `mode` set by the end user in `vite.config.js` has a higher priority.
        return this.isProd ? 'production' : 'development';
    }
    async getDefines() {
        var _a;
        const defines = {};
        const rendererConfigs = await this.getRendererConfig();
        for (const [index, userConfig] of rendererConfigs.entries()) {
            const name = this.pluginConfig.renderer[index].name;
            if (!name) {
                continue;
            }
            const NAME = name.toUpperCase().replace(/ /g, '_');
            // `server.port` is set in `launchRendererDevServers` in `VitePlugin.ts`.
            defines[`${NAME}_VITE_DEV_SERVER_URL`] = this.isProd ? undefined : JSON.stringify(`http://localhost:${(_a = userConfig === null || userConfig === void 0 ? void 0 : userConfig.server) === null || _a === void 0 ? void 0 : _a.port}`);
            defines[`${NAME}_VITE_NAME`] = JSON.stringify(name);
        }
        return defines;
    }
    async getBuildConfig(watch = false) {
        if (!Array.isArray(this.pluginConfig.build)) {
            throw new Error('"config.build" must be an Array');
        }
        const define = await this.getDefines();
        const plugins = [(0, plugins_1.externalBuiltins)()];
        const configs = this.pluginConfig.build
            .filter(({ entry, config }) => entry || config)
            .map(async ({ entry, config }) => {
            var _a;
            const defaultConfig = {
                // Ensure that each build config loads the .env file correctly.
                mode: this.mode,
                build: {
                    lib: entry
                        ? {
                            entry,
                            // Electron can only support cjs.
                            formats: ['cjs'],
                            fileName: () => '[name].js',
                        }
                        : undefined,
                    // Prevent multiple builds from interfering with each other.
                    emptyOutDir: false,
                    // 🚧 Multiple builds may conflict.
                    outDir: node_path_1.default.join(this.baseDir, 'build'),
                    watch: watch ? {} : undefined,
                },
                clearScreen: false,
                define,
                plugins,
            };
            if (config) {
                const loadResult = await this.resolveConfig(config);
                return (0, vite_1.mergeConfig)(defaultConfig, (_a = loadResult === null || loadResult === void 0 ? void 0 : loadResult.config) !== null && _a !== void 0 ? _a : {});
            }
            return defaultConfig;
        });
        return await Promise.all(configs);
    }
    async getRendererConfig() {
        var _a;
        if (!Array.isArray(this.pluginConfig.renderer)) {
            throw new Error('"config.renderer" must be an Array');
        }
        const configs = ((_a = this.rendererConfigCache) !== null && _a !== void 0 ? _a : (this.rendererConfigCache = this.pluginConfig.renderer.map(async ({ name, config }) => {
            var _a;
            const defaultConfig = {
                // Ensure that each build config loads the .env file correctly.
                mode: this.mode,
                // Make sure that Electron can be loaded into the local file using `loadFile` after packaging.
                base: './',
                build: {
                    outDir: node_path_1.default.join(this.baseDir, 'renderer', name),
                },
                clearScreen: false,
            };
            const loadResult = (_a = (await this.resolveConfig(config))) !== null && _a !== void 0 ? _a : { path: '', config: {}, dependencies: [] };
            return (0, vite_1.mergeConfig)(defaultConfig, loadResult.config);
        })));
        return await Promise.all(configs);
    }
}
exports.default = ViteConfigGenerator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVml0ZUNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9WaXRlQ29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTZCO0FBRTdCLGtEQUEwQjtBQUMxQiwrQkFBOEU7QUFHOUUsNENBQWtEO0FBRWxELE1BQU0sQ0FBQyxHQUFHLElBQUEsZUFBSyxFQUFDLHVDQUF1QyxDQUFDLENBQUM7QUFRekQsTUFBcUIsbUJBQW1CO0lBS3RDLFlBQTZCLFlBQThCLEVBQW1CLFVBQWtCLEVBQW1CLE1BQWU7UUFBckcsaUJBQVksR0FBWixZQUFZLENBQWtCO1FBQW1CLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBbUIsV0FBTSxHQUFOLE1BQU0sQ0FBUztRQUNoSSxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsYUFBYSxDQUFDLE1BQWMsRUFBRSxZQUFnQyxFQUFFOztRQUM5RCxpR0FBaUc7UUFDakcsdURBQXVEO1FBQ3ZELE1BQUEsU0FBUyxDQUFDLE9BQU8sb0NBQWpCLFNBQVMsQ0FBQyxPQUFPLEdBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUM7UUFDdEQsNkNBQTZDO1FBQzdDLE1BQUEsU0FBUyxDQUFDLElBQUksb0NBQWQsU0FBUyxDQUFDLElBQUksR0FBSyxJQUFJLENBQUMsSUFBSSxFQUFDO1FBQzdCLE9BQU8sSUFBQSx5QkFBa0IsRUFBQyxTQUFzQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTiw4Q0FBOEM7UUFDOUMsaUhBQWlIO1FBQ2pILDRFQUE0RTtRQUM1RSxPQUFPLElBQUksQ0FBQyxNQUFNLENB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