#!/usr/bin/env node

const { Option } = require("@3fv/prelude-ts")
const Sh = require("shelljs")
const Path = require("path")
const Fs = require("fs")
const assert = require("assert")

const rootDir = Path.resolve(__dirname, ".."),
  srcDir = Path.join(rootDir, "src"),
  tsConfigFile = Path.join(rootDir, "tsconfig.json"),
  distDir = Path.join(rootDir, "dist")

if (Sh.test("-d")) {
  Sh.echo("Removing `dist` build directory")
  Sh.rm("-Rf",distDir)
}

Sh.echo("Starting build")
Array(["es2016","commonjs"], ["es2018","esnext"], ["es5","umd"])
  .map(([target,mod]) => [target,mod, Path.join(distDir, mod.toString())])
  .forEach(([target,mod, outDir]) => {
    if (Sh.test("-d", outDir)) {
      Sh.echo(`Cleaning: ${outDir}`)
      Sh.rm("-Rf",outDir)
    }
    
    Sh.echo(`Preparing: ${outDir}`)
    Sh.mkdir("-p", outDir)
    
    const outTsConfig = Option.of(require(tsConfigFile))
        .map(pkg => ({
          ...pkg,
          compilerOptions: {
            ...pkg.compilerOptions,
            target,
            module: mod,
            outDir: "./"
          }
        }))
        .getOrThrow(),
      outTsConfigFile = Path.join(outDir, "tsconfig.json")

    
    Sh.echo(`Writing tsconfig for (${mod}) to ${outTsConfigFile}`)
    Fs.writeFileSync(outTsConfigFile, JSON.stringify(outTsConfig, null, 2))

    Sh.echo(`Building for module system: ${mod}`)
    Sh.cp("-R", `${srcDir}/*`, outDir)

    const result = Sh.exec(`../../node_modules/.bin/tsc -p tsconfig.json`, {
      cwd: outDir
    })

    assert(
      result.code === 0,
      `Compilation failed (${mod}): ${result.stderr?.toString()}`
    )
    //Sh.cp(, outTsConfigFile)
  })

// .forEach(moduleTarget => {
//   Sh.exec(``)
// })
