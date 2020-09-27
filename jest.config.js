const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  verbose: true,
  
  testRegex: "/dist/.*\\.spec\\.js$",
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/dist/test/test-setup.js"],
  moduleFileExtensions: [
    "//ts",
    "//tsx",
    "js"
  ]
}
