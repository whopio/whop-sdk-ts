// @ts-check
import { OpenAPI } from "../dist/core/OpenAPI.mjs";
import fse from "fs-extra";
const { writeJson, readJson } = fse;

(async () => {
  const packageJson = await readJson("./package.json");
  const { version } = packageJson;
  if (version !== OpenAPI.VERSION) {
    packageJson.version = OpenAPI.VERSION;
    await writeJson("./package.json", packageJson, {
      encoding: "utf-8",
      spaces: 2,
    });
  }
})();
