import type { BuildOptions } from "repo-utils";

const config: BuildOptions = {
  src: "src",
  dist: "dist",
  swc: {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: false,
        dynamicImport: true,
        decorators: false,
      },
      target: "es5",
      loose: false,
      externalHelpers: false,
    },
    sourceMaps: true,
    minify: false,
  },
};

export default config;
