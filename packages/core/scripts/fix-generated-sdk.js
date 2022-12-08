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

const main = async () => {
  // copy models from src/base to /src
  await copy("src/base/models", "src/models", {
    recursive: true,
    dereference: true,
  });
  // copy src/base/services into all sdks and fix the model imports
  const serviceFiles = await readdir(servicesDir);
  await Promise.all(
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
      await Promise.all(
        servicesDist.map(async (dist) => {
          return outputFile(join(dist, serviceFile), fixed);
        })
      );
    })
  );
  await copy(coreDir, "src/core");
  await Promise.all(
    coreDist.map(async ([dist, request]) => {
      await remove(dist);
      return Promise.all([
        copy(join(request, "request.ts"), join(dist, "request.ts")),
        copy(
          join(request, "FetchHttpRequest.ts"),
          join(dist, "FetchHttpRequest.ts")
        ),
      ]);
    })
  );
  const indexCode = await readFile("src/base/index.ts", { encoding: "utf8" });
  const fixedIndex = indexCode.replace(
    /^(?:export|import) .* from '\.\/((?:models|core)\/.*)';$/gm,
    (match, value) => {
      if (value === "core/FetchHttpRequest") return match;
      return match.replace(`./${value}`, `../${value}`);
    }
  );
  const whopSdkCode = await readFile("src/base/WhopSDK.ts", {
    encoding: "utf8",
  });
  const fixedWhopSDK = whopSdkCode.replace(
    /^(?:export|import) .* from '\.\/((?:models|core)\/.*)';$/gm,
    (match, value) => {
      if (value === "core/FetchHttpRequest") return match;
      return match.replace(`./${value}`, `../${value}`);
    }
  );
  await Promise.all(
    moduleTypes.map(async (moduleType) => {
      return Promise.all([
        outputFile(join("src", moduleType, "index.ts"), fixedIndex),
        outputFile(join("src", moduleType, "WhopSDK.ts"), fixedWhopSDK),
      ]);
    })
  );
  await unlink("src/core/request.ts");
  await unlink("src/core/FetchHttpRequest.ts");
  await remove("src/base");
};

main();
