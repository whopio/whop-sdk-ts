// @ts-check
import _glob from "glob";
import fse from "fs-extra";
import { promisify } from "util";
const glob = promisify(_glob);
const { copy, remove, rename } = fse;

/**
 * @param {string} pattern
 * @param {(name: string) => string} replacer
 */
const renameAll = async (pattern, replacer) => {
  const files = await glob(pattern);
  await Promise.all(
    files.map(async (file) => {
      rename(file, replacer(file));
    })
  );
};

/**
 * @param {string} dir
 * @param {string} ext
 */
const renameCopyAndDelete = async (dir, ext) => {
  await renameAll(dir + "/**/*.js?(.map)", (file) =>
    file.replace(/\.js$/, ext).replace(/\.js\.map$/, ext + ".map")
  );
  await copy(dir, "dist", { recursive: true });
  await remove(dir);
};

(async () => {
  await Promise.all([
    renameCopyAndDelete("dist/esm", ".mjs"),
    renameCopyAndDelete("dist/cjs", ".cjs"),
  ]);
})();
