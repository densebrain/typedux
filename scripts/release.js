#!/usr/bin/env node

const Sh = require("shelljs")
const Path = require("path")
const assert = require("assert")

const rootDir = Path.resolve(__dirname, "..")

Sh.echo("Starting release")

const result = Sh.exec(`git describe --dirty`, {
  cwd: rootDir
})

if (
  result.code !== 0 ||
  [result.stdout, result.stderr].some(it => it.includes("dirty"))
) {
  console.error(`ERROR: Git is not clean ${rootDir}`)
  process.exit(1)
}

const cmds = [
  `yarn version --patch --non-interactive`,
  `git push --tags`,
  `yarn publish`
]

cmds.forEach(cmd => {
  Sh.echo(`Executing: ${cmd}`)
  assert(
    Sh.exec(cmd, {
      cwd: rootDir
    }).code === 0,
    `Failed to execute: ${cmd}`
  )
})
