import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { findUp } from "find-up";
import qrcode from "qrcode-terminal";
import { rimraf } from "rimraf";
import { buildAndPublish } from "./mobile";
import { env } from "./sdk";

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

	if (command === "install") {
		await handleInstall();
		return;
	}

	let shouldBuild = true;
	let shouldUpload = true;
	let shouldClean = true;
	if (command === "build") {
		shouldUpload = false;
	} else if (command === "ship") {
		shouldBuild = true;
		shouldUpload = true;
	} else if (command === "upload") {
		shouldBuild = false;
		shouldClean = false;
	} else if (command === "clean") {
		shouldBuild = false;
		shouldUpload = false;
	} else {
		console.error(
			`Usage:
	whop-react-native ship   [--ios] [--android] [--web]   # runs build and then publishes it as a dev build to whop.
	whop-react-native build  [--ios] [--android] [--web]   # builds your app into a distributable bundle in the build/ directory.
	whop-react-native upload [--ios] [--android] [--web]   # uploads the existing build directory to whop.
	whop-react-native clean                                # cleans the build directory.`,
		);
		process.exit(1);
	}

	const root = await getRootProjectDirectory();

	if (shouldClean) {
		await cleanBuildDirectory(root);
	}

	const didProvidePlatform =
		args.values.ios || args.values.android || args.values.web;

	const opts = { shouldBuild, shouldUpload };
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
	console.log(" ✔︎ cleaned build directory");
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

async function handleInstall() {
	const appId = env("NEXT_PUBLIC_WHOP_APP_ID");
	const installLink = `https://whop.com/apps/${appId}/install`;

	console.log(`
Open this link in your browser to install the app into your whop.
${installLink}

Or scan the QR code with your iPhone:
	`);

	qrcode.generate(installLink, { small: true });
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.then(() => {
		process.exit(0);
	});
