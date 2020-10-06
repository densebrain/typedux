const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  verbose: true,
  testRegex: "/dist/commonjs/.*\\.spec\\.js$",
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/dist/commonjs/test/test-setup.js"],
  moduleFileExtensions: [
    "//ts",
    "//tsx",
    "js"
  ]
}
