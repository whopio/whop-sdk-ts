import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { findUp } from "find-up";
import { rimraf } from "rimraf";
import { buildAndPublish } from "./mobile";

async function main() {
	const args = parseArgs({
		options: {
			ios: {
				type: "boolean",
			},
			android: {
				type: "boolean",
			},
			web: {
				type: "boolean",
			},
		},
		strict: true,
		allowPositionals: true,
		args: process.argv.slice(2),
	});

	const [command] = args.positionals;

	let dryRun = true;
	if (command === "build") {
		dryRun = true;
	} else if (["deploy", "publish", "ship"].includes(command)) {
		dryRun = false;
	} else {
		console.error(
			"Usage: whop-react-native build [--ios] [--android] [--web] [--dry-run]",
		);
		process.exit(1);
	}

	const root = await getRootProjectDirectory();

	await cleanBuildDirectory(root);

	const didProvidePlatform =
		args.values.ios || args.values.android || args.values.web;

	const opts = { dryRun };
	const promises: Promise<void>[] = [];

	if (args.values.ios || !didProvidePlatform) {
		promises.push(buildAndPublish(root, "ios", opts));
	}
	if (args.values.android || !didProvidePlatform) {
		promises.push(buildAndPublish(root, "android", opts));
	}
	if (args.values.web || !didProvidePlatform) {
		console.warn(" - [web] builds for web are not supported yet - coming soon");
	}

	await Promise.all(promises);
}

async function cleanBuildDirectory(root: string) {
	const buildDirectory = path.join(root, "build");
	if (existsSync(buildDirectory)) {
		await rimraf(buildDirectory);
	}
}

async function getRootProjectDirectory() {
	const file = await findUp("package.json", { cwd: process.cwd() });
	if (!file) {
		throw new Error(
			"please run this command inside a whop react native project",
		);
	}
	const root = path.dirname(file);
	return root;
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.then(() => {
		process.exit(0);
	});
