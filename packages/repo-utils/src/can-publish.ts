import fse from "fs-extra";
const { readJson } = fse;
import { promisify } from "util";
import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { gt } from "semver";
import { setOutput } from "@actions/core";
import isCanary from "./util/is-canary";

const versionParserRegexp = /^@whop-sdk\/core@(\d+\.\d+\.\d+(?:-canary\.\d)?)/;

/**
 * this script checks the version of the root package.json against
 * the latest or latest canary version of @whop-sdk/core and then
 * uses semver to determine if a new version can be published.
 * It sets the results as github actions output as this script is
 * inteded to be ran as part of a workflow
 */
const main = async () => {
  const { version } = await readJson("./package.json");
  console.log("version:", version, "is canary:", isCanary(version));
  try {
    const res = await exec(
      `pnpm view @whop-sdk/core@${isCanary(version) ? "canary" : "latest"}`
    );
    const [, currentVersion] =
      versionParserRegexp.exec(res.stdout.trim()) || [];
    console.log(
      "version:",
      currentVersion,
      "can publish:",
      gt(version, currentVersion)
    );
    setOutput("can-publish", gt(version, currentVersion));
    setOutput("version", version);
  } catch {
    console.log("version:", version, "can publish:", true);
    setOutput("can-publish", true);
    setOutput("version", version);
  }
};

main();
