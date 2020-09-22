const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  verbose: true,
  
  //testRegex: "/src/.*\\.spec\\.(ts|tsx)$",
  testRegex: "/dist/.*\\.spec\\.js$",
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/dist/test/test-setup.js"],
  // transform: {
  //   "src/.*\\.ts": "ts-jest"
  //   //...tsjPreset.transform,
  //
  // },
  moduleFileExtensions: [
    "//ts",
    "//tsx",
    "js"
  ]
}
