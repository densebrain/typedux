import * as Sh from "shelljs"
import Path from "path"
import Fs from "fs"
import { map, flow, tap, thru } from "lodash/fp"

const rootDir = Path.resolve(__dirname, ".."),
  srcDir = Path.join(rootDir, "src"),
  tsConfigFile = Path.join(rootDir, "tsconfig.json"),
  distDir = Path.join(rootDir, "dist"),
  workflow = flow(
    tap(([mod, outDir]) => {
      const outTsConfig = Option.of(require(tsConfigFile))
          .map(pkg => ({
            ...pkg,
            compilerOptions: {
              ...pkg.compilerOptions,
              module: mod,
              outDir: "./"
            }
          }))
          .getOrThrow(),
        outTsConfigFile = Path.join(outDir, "tsconfig.json")

      Sh.echo(`Writing tsconfig for (${mod}) to ${outTsConfigFile}`)
      Fs.writeFileSync(outTsConfigFile, outTsConfig)

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
    }),
    tap(([, path]) => Sh.mkdir("-p", path)),
    tap(([, path]) => {
      Sh.echo(`Cleaning: ${path}`)
      //Sh.rm("-p",path)
    }),
    map(mods => mods.map(mod => [mod, Path.join(distDir, mod)]))
  )

Sh.echo("Starting build")
workflow(Array("commonjs", "esnext", "umd"))

// .forEach(moduleTarget => {
//   Sh.exec(``)
// })
