// @ts-check

const {
  copy,
  readdir,
  readFile,
  outputFile,
  remove,
  unlink,
} = require("fs-extra");
const { join } = require("path");

const servicesDir = "src/base/services";
const servicesDist = ["src/node/services", "src/browser/services"];

const moduleTypes = ["node", "browser"];

const coreDir = "src/base/core";
const coreDist = [
  ["src/node/core", "request/node/core"],
  ["src/browser/core", "request/browser/core"],
];

const copyShared = async () => {
  return Promise.all([
    copy("src/base/models", "src/models", {
      recursive: true,
      dereference: true,
    }),
    copy("src/base/core", "src/core", {
      recursive: true,
      dereference: true,
    }),
  ]);
};

const copyServices = async () => {
  const serviceFiles = await readdir(servicesDir);
  return Promise.all(
    serviceFiles.map(async (serviceFile) => {
      const code = await readFile(join(servicesDir, serviceFile), {
        encoding: "utf8",
      });
      const fixed = code.replace(
        /^import .* from '(\.\.\/(?:models|core)\/.*)';$/gm,
        (match, value) => {
          return match.replace(value, `../${value}`);
        }
      );
      return Promise.all(
        servicesDist.map(async (dist) => {
          return outputFile(join(dist, serviceFile), fixed);
        })
      );
    })
  );
};

const copyCore = async () => {
  await Promise.all(
    moduleTypes.map(async (moduleType) => {
      const coreDist = join("src", moduleType, "core");
      const coreSrc = join("request", moduleType, "core");
      await remove(coreDist);
      return Promise.all([
        copy(join(coreSrc, "request.ts"), join(coreDist, "request.ts")),
        copy(
          join(coreSrc, "FetchHttpRequest.ts"),
          join(coreDist, "FetchHttpRequest.ts")
        ),
      ]);
    })
  );
};

/**
 *
 * @param {string} file
 */
const copyIndexFile = async (file) => {
  const indexCode = await readFile(join("src/base", file), {
    encoding: "utf8",
  });
  const fixedIndex = indexCode.replace(
    /^(?:export|import) .* from '\.\/((?:models|core)\/.*)';$/gm,
    (match, value) => {
      if (value === "core/FetchHttpRequest") return match;
      return match.replace(`./${value}`, `../${value}`);
    }
  );
  return Promise.all(
    moduleTypes.map(async (moduleType) => {
      return Promise.all([
        outputFile(join("src", moduleType, file), fixedIndex),
      ]);
    })
  );
};

const copyIndexFiles = async () => {
  return Promise.all([copyIndexFile("index.ts"), copyIndexFile("WhopSDK.ts")]);
};

const main = async () => {
  await Promise.all([
    copyShared(),
    copyServices(),
    copyCore(),
    copyIndexFiles(),
  ]);
  await Promise.all([
    await unlink("src/core/request.ts"),
    await unlink("src/core/FetchHttpRequest.ts"),
    await remove("src/base"),
  ]);
};

main();
