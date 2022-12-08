// @ts-check

const { copy, readdir, readFile, outputFile, remove } = require("fs-extra");
const { join } = require("path");

const servicesDir = "src/base/services";
const servicesDist = ["src/node/services", "src/browser/services"];

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
        /^import .* from '(\.\.\/models\/.*)';$/gm,
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
  await remove("src/base");
};

main();
