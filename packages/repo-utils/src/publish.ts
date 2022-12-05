#!/usr/bin/env node

import fse from "fs-extra";
const { readJson, outputJson } = fse;
import { promisify } from "util";
import { exec as _exec } from "child_process";
import isCanary from "./util/is-canary";
const exec = promisify(_exec);

/**
 * this script will get the root package.json to determine what
 * version should be publsied. It then opens the cwd packlage.json
 * replaces the package version with the root package version and
 * replaces all dependencies at version `workspace:0.0.0` with the
 * root package version too before updating the package.json on disk
 * and unning `pnpm publish`
 */
const main = async () => {
  const rootPackageJson = await readJson("../../package.json");
  const nextVersion = rootPackageJson.version;
  const packageJson = await readJson("package.json");
  packageJson.version = nextVersion;
  if (packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([dep, version]) => {
      if (version === "workspace:0.0.0")
        packageJson.dependencies[dep] = nextVersion;
    });
  }
  await outputJson("package.json", packageJson, { spaces: 2 });
  const command = [
    "pnpm publish",
    "--access public",
    isCanary(nextVersion) ? "--tag canary" : "",
    "--no-git-checks",
  ].join(" ");
  console.log("running", command);
  await exec(command);
  console.log(`${packageJson.name}@${nextVersion}: released`);
};

main();
