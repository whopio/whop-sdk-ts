// @ts-check

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { humanId } from "human-id";
import { parse } from "yaml";

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
const lockfileJson = parse(lockfile);
const changesets = readdirSync(".changeset").filter((file) =>
	file.endsWith(".md"),
);

/**
 * @type {Map<string, string>}
 */
const packageMap = new Map(
	Object.keys(lockfileJson.importers).map((key) => {
		const packageJson = readFileSync(`${key}/package.json`, "utf8");
		const packageJsonJson = JSON.parse(packageJson);
		return [key, packageJsonJson.name];
	}),
);

const interestingImporters = Object.fromEntries(
	Object.entries(lockfileJson.importers).filter(([key]) =>
		packageMap.get(key)?.startsWith("@whop/"),
	),
);

// check out the main branch
execSync("git checkout main");

const mainLockfile = readFileSync("pnpm-lock.yaml", "utf8");
const mainLockfileJson = parse(mainLockfile);
const mainChangesets = readdirSync(".changeset").filter((file) =>
	file.endsWith(".md"),
);

// go back to previous branch
execSync("git checkout -");

if (changesets.length > mainChangesets.length) {
	// delete previously generated changeset
	const changesetToDelete = changesets.filter(
		(file) => !mainChangesets.includes(file),
	);

	for (const file of changesetToDelete) {
		unlinkSync(`.changeset/${file}`);
	}
}

// compare the two lockfiles
const changedImporters = Object.keys(interestingImporters).filter((key) => {
	const importsOnHead = interestingImporters[key];
	const importsOnBase = mainLockfileJson.importers[key];

	const importsOnHeadString = JSON.stringify(importsOnHead);
	const importsOnBaseString = JSON.stringify(importsOnBase);

	return importsOnHeadString !== importsOnBaseString;
});

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isString(value) {
	return typeof value === "string";
}

const changedPackages = changedImporters
	.map((key) => {
		const packageName = packageMap.get(key);
		return packageName;
	})
	.filter(isString);

if (!changedPackages.length) {
	process.exit(0);
}

const changesetName = humanId({
	separator: "-",
	capitalize: false,
});

const changesetContent = `---
${changedPackages.map((pkg) => `"${pkg}": patch`).join("\n")}
---

${process.env.PR_TITLE ?? "bump dependency"}
`;

writeFileSync(`.changeset/${changesetName}.md`, changesetContent);
