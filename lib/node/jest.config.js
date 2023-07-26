const preset = require("ts-jest/presets");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...preset.defaults,
  globals: {
    "ts-jest": {
      tsconfig: "../../tsconfig.node.json",
    },
  },
};
