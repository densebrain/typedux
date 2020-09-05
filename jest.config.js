const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  verbose: true,
  
  testRegex: "/src/.*\\.spec\\.(ts|tsx)$",
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/test-setup.ts"],
  transform: {
    "src/.*\\.ts": "ts-jest"
    //...tsjPreset.transform,
    
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ]
}