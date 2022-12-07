#!/usr/bin/env node

import { Output, transform, transformFile } from "@swc/core";
import {
  exec as _exec,
  spawn,
  ChildProcessWithoutNullStreams,
} from "child_process";
import { outputFile, readFile } from "fs-extra";
import _glob from "glob";
import Module from "module";
import { dirname, join, relative } from "path";
import { promisify } from "util";
import { runInNewContext } from "vm";
import { BuildOptions } from "../types";
import { FSWatcher, watch } from "chokidar";
const glob = promisify(_glob);
const exec = promisify(_exec);

const isWatching =
  process.argv.includes("--watch") || process.argv.includes("-w");

type WrappedModule<T = unknown> = (
  exports: any,
  req: typeof require,
  module: any,
  __filename: string,
  __dirnaname: string
) => T;

const runScript = <T = unknown>(src: string, location: string): T => {
  const wrapped = Module.wrap(src);
  const mod = { exports: {} };
  const script: WrappedModule = runInNewContext(wrapped, global);
  script(mod.exports, require, mod, location, dirname(location));
  return mod.exports as T;
};

const readConfig = async () => {
  const configPath = join(process.cwd(), "package.ts");
  const config = await readFile(configPath, {
    encoding: "utf-8",
  });
  const { code } = await transform(config, {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: false,
      },
      target: "es5",
    },
    module: {
      type: "commonjs",
    },
  });
  const { default: options } = runScript<{ default: BuildOptions }>(
    code,
    configPath.replace(/\.ts$/, ".js")
  );
  return options;
};

class Buildr {
  private destroyed = false;
  private typeCompiler?: ChildProcessWithoutNullStreams;
  private watcher?: FSWatcher;
  private srcPattern: string;

  public constructor(private config: Required<BuildOptions>) {
    this.srcPattern = join(this.config.src, "/**/*.ts?(x)");
  }

  public build = async () => {
    const typesPromise = exec(`tsc --emitDeclarationOnly`);
    const files = await glob(this.srcPattern);
    await Promise.all(files.map(this.buildFile.bind(this)));
    await typesPromise;
  };

  private buildFile = async (file: string) => {
    const outBase = join(
      this.config.dist,
      relative(this.config.src, file)
    ).replace(/\.tsx?$/, "");
    await Promise.all([
      this.buildESM(file, outBase),
      this.buildCJS(file, outBase),
    ]);
  };

  private fixESM = (code: string) => {
    return code.replace(
      /(?:(?:^|\s)import\("(\.\.?\/.*)"\)|(?:import|export) (?:[a-zA-Z0-9]|\n|{|}|\s|,)* from "(\.\.?\/.*)";)/gm,
      (match, dynamicImport, staticImport) => {
        return match.replace(
          `"${staticImport || dynamicImport}"`,
          `"${staticImport || dynamicImport}.mjs"`
        );
      }
    );
  };

  private fixCJS = (code: string) => {
    return code.replace(
      /(?:^|\s)require\("(\.\.?\/.*)"\)/gm,
      (match, required) => {
        return match.replace(`"${required}"`, `"${required}.cjs"`);
      }
    );
  };

  private buildESM = async (file: string, outBase: string) => {
    await this.writeOutput(
      await transformFile(file, {
        ...this.config.swc,
        module: {
          type: "es6",
        },
      }),
      outBase,
      ".mjs",
      this.fixESM
    );
  };

  private buildCJS = async (file: string, outBase: string) => {
    await this.writeOutput(
      await transformFile(file, {
        ...this.config.swc,
        module: {
          type: "commonjs",
        },
      }),
      outBase,
      ".cjs",
      this.fixCJS
    );
  };

  private writeOutput = async (
    { code, map }: Output,
    outBase: string,
    extension: string,
    fix: (code: string) => string = (code) => code
  ) => {
    if (this.destroyed) return;
    const promises: Promise<any>[] = [
      outputFile(outBase + extension, fix(code)),
    ];
    if (map) promises.push(outputFile(outBase + extension + ".map", map));
    await Promise.all(promises);
  };

  public watch = async () => {
    this.typeCompiler = spawn("tsc", ["--emitDeclarationOnly", "-w"]);
    this.watcher = watch(this.srcPattern);
    this.watcher.on("change", this.buildFile.bind(this));
    this.watcher.on("add", this.buildFile.bind(this));
  };

  public dispose = () => {
    this.destroyed = true;
    this.typeCompiler?.kill();
    this.watcher?.close();
  };
}

const defaultConfig = (config: BuildOptions): Required<BuildOptions> => {
  return {
    ...config,
    src: config.src || "src",
    dist: config.dist || "dist",
  };
};

const build = async () => {
  if (isWatching) {
    const config = await readConfig();
    let buildr = new Buildr(defaultConfig(config));
    buildr.watch();
    const watcher = watch("package.ts");
    watcher.on("change", async () => {
      console.log("Detected change in package.ts, reloading...");
      if (buildr) buildr.dispose();
      const config = await readConfig();
      buildr = new Buildr(defaultConfig(config));
      buildr.watch();
    });
  } else {
    const config = await readConfig();
    const buildr = new Buildr(defaultConfig(config));
    await buildr.build();
  }
};

build();
