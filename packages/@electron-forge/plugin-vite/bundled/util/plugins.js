"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalBuiltins = void 0;
const node_module_1 = require("node:module");
/**
 * `electron` and Node.js built-in modules should always be externalize.
 */
function externalBuiltins() {
    return {
        name: '@electron-forge/plugin-vite:external-builtins',
        config(config) {
            var _a, _b;
            var _c;
            const nativeModules = node_module_1.builtinModules.filter((e) => !e.startsWith('_'));
            const builtins = ['electron', ...nativeModules, ...nativeModules.map((m) => `node:${m}`)];
            (_a = config.build) !== null && _a !== void 0 ? _a : (config.build = {});
            (_b = (_c = config.build).rollupOptions) !== null && _b !== void 0 ? _b : (_c.rollupOptions = {});
            let external = config.build.rollupOptions.external;
            if (Array.isArray(external) || typeof external === 'string' || external instanceof RegExp) {
                external = builtins.concat(external);
            }
            else if (typeof external === 'function') {
                const original = external;
                external = function (source, importer, isResolved) {
                    if (builtins.includes(source)) {
                        return true;
                    }
                    return original(source, importer, isResolved);
                };
            }
            else {
                external = builtins;
            }
            config.build.rollupOptions.external = external;
        },
    };
}
exports.externalBuiltins = externalBuiltins;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3BsdWdpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTZDO0FBSTdDOztHQUVHO0FBQ0gsU0FBZ0IsZ0JBQWdCO0lBQzlCLE9BQWU7UUFDYixJQUFJLEVBQUUsK0NBQStDO1FBQ3JELE1BQU0sQ0FBQyxNQUFNOzs7WUFDWCxNQUFNLGFBQWEsR0FBRyw0QkFBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxhQUFhLEVBQUUsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxRixNQUFBLE1BQU0sQ0FBQyxLQUFLLG9DQUFaLE1BQU0sQ0FBQyxLQUFLLEdBQUssRUFBRSxFQUFDO1lBQ3BCLFlBQUEsTUFBTSxDQUFDLEtBQUssRUFBQyxhQUFhLHVDQUFiLGFBQWEsR0FBSyxFQUFFLEVBQUM7WUFFbEMsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO1lBQ25ELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxZQUFZLE1BQU0sRUFBRTtnQkFDekYsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBb0IsQ0FBQyxDQUFDO2FBQ2xEO2lCQUFNLElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO2dCQUN6QyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQzFCLFFBQVEsR0FBRyxVQUFVLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVTtvQkFDL0MsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUM3QixPQUFPLElBQUksQ0FBQztxQkFDYjtvQkFDRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxRQUFRLEdBQUcsUUFBUSxDQUFDO2FBQ3JCO1lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUNqRCxDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUEzQkQsNENBMkJDIn0=