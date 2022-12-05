import { setOutput } from "@actions/core";
import { exec as _exec } from "child_process";
import fse from "fs-extra";
import _glob from "glob";
import { gt } from "semver";
import { promisify } from "util";
import isCanary from "./util/is-canary";
const { readJson } = fse;
const glob = promisify(_glob);
const exec = promisify(_exec);

const versionParserRegexp =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*@(\d+\.\d+\.\d+(?:-canary\.\d)?)/;

const checkPackage = async (pkg: string, rootVersion: string) => {
  const packageJson = await readJson(pkg);
  const log = (...args: any[]) => {
    console.log(`${packageJson.name}:`, ...args);
  };
  if (packageJson.private) {
    log("Skipping private package");
    return;
  }
  try {
    const res = await exec(
      `pnpm view ${packageJson.name}@${
        isCanary(rootVersion) ? "canary" : "latest"
      }`
    );
    const [, , currentVersion] =
      versionParserRegexp.exec(res.stdout.trim()) || [];
    if (!currentVersion)
      throw new Error("Could not parse version from npm view response");
    if (gt(rootVersion, currentVersion)) {
      log(`Version ${rootVersion} can be published.`);
      return packageJson.name;
    } else {
      log(`Already up to date.`);
    }
  } catch (_e) {
    log(`Not found in registry.`);
    return packageJson.name;
  }
};

const checkPackages = async (rootVersion: string) => {
  const packages = await glob("packages/*/package.json");
  return (
    await Promise.all(
      packages.map(async (pkg) => checkPackage(pkg, rootVersion))
    )
  ).filter(Boolean) as string[];
};

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
  const publishable = await checkPackages(version);
  setOutput("can-publish", Boolean(publishable.length));
  setOutput("filter", publishable.map((pkg) => `--filter=${pkg}`).join(" "));
  setOutput("version", version);
};

main();
