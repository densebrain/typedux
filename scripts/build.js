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

if (Sh.test("-d",distDir)) {
  Sh.echo("Removing `dist` build directory")
  Sh.rm("-Rf",distDir)
}

Sh.echo("Starting build")
Array(["es2016","commonjs"], ["es6","es2015", "esm"], ["es5","umd"])
  .map(([target,mod,suffix = mod]) => [target,mod, suffix, Path.join(distDir, suffix.toString())])
  .forEach(([target,mod, suffix, outDir]) => {
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
            outDir: `./dist/${suffix}`
          }
        }))
        .getOrThrow(),
      outTsConfigFilename = `tsconfig-${suffix}.json`,
      outTsConfigFile = Path.join(rootDir, outTsConfigFilename)

    
    Sh.echo(`Writing tsconfig for (${suffix}) to ${outTsConfigFile}`)
    Fs.writeFileSync(outTsConfigFile, JSON.stringify(outTsConfig, null, 2))

    Sh.echo(`Building for module system: ${suffix}`)
    // Sh.cp("-R", `${srcDir}/*`, outDir)

    const result = Sh.exec(`./node_modules/.bin/tsc -p ${outTsConfigFilename}`, {
      cwd: rootDir
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
