const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  verbose: true,
  
  testRegex: "/tests/.*\\.spec\\.(ts|tsx)$",
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/test-setup.ts"],
  transform: {
    "(src|tests)/.*\\.ts": "ts-jest"
    //...tsjPreset.transform,
    
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ]
}