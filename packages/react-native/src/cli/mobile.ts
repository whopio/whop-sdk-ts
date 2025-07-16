import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDefaultConfig } from "@react-native/metro-config";
import JSZip from "jszip";
import { type ReportableEvent, type Reporter, runBuild } from "metro";
import { getChecksum, uploadFile } from "./file";
import { APP_ID, COMPANY_ID, whopSdk } from "./sdk";
import { VALID_VIEW_TYPES } from "./valid-view-type";

export async function buildAndPublish(
	root: string,
	platform: "ios" | "android",
	{
		shouldBuild = true,
		shouldUpload = true,
	}: { shouldBuild: boolean; shouldUpload: boolean } = {
		shouldBuild: true,
		shouldUpload: true,
	},
) {
	if (shouldBuild) {
		await bundle(root, platform);
	}
	if (shouldUpload) {
		await createMobileBuild(root, platform);
	}
}

export async function bundle(root: string, platform: "ios" | "android") {
	await makeEntrypoint(root, platform);

	const outputFile = path.join(
		root,
		"build",
		"output",
		platform,
		"main_js_bundle",
	);
	await mkdir(path.dirname(outputFile), { recursive: true });

	const defaultConfig = getDefaultConfig(root);

	const babelLocation = require.resolve("@babel/runtime/package");
	const extraNodeModules = path.resolve(
		babelLocation,
		"..",
		"..",
		"..",
		"..",
		"node_modules",
	);

	await runBuild(
		{
			...defaultConfig,
			projectRoot: root,
			transformer: {
				...defaultConfig.transformer,
				babelTransformerPath: require.resolve(
					"./whop-react-native-babel-transformer.js",
				),
			},
			watchFolders: [
				root,
				path.resolve(root, "node_modules"),
				extraNodeModules,
			],
			reporter: new CustomReporter(),
			resolver: {
				...defaultConfig.resolver,
				nodeModulesPaths: [
					...(defaultConfig.resolver?.nodeModulesPaths ?? []),
					extraNodeModules,
				],
			},
		},
		{
			dev: false,
			entry: `build/entrypoints/${platform}/index.js`,
			minify: false,
			platform: platform,
			sourceMap: false,
			out: outputFile,
		},
	);

	await rename(
		`${outputFile}.js`,
		path.join(root, "build", "output", platform, "main_js_bundle.hbc"),
	);

	console.log(` ✔︎ [${platform}] bundle created`);
}

async function getSupportedAppViewTypes(
	root: string,
): Promise<(typeof VALID_VIEW_TYPES)[number][]> {
	const views = await readdir(path.join(root, "src", "views"), {
		withFileTypes: true,
		recursive: false,
	});
	const files = views
		.filter((file) => file.isFile())
		.map((file) => file.name.split(".")[0])
		.filter((file) => !!file);

	const validViews = files.filter((file) =>
		VALID_VIEW_TYPES.includes(file as (typeof VALID_VIEW_TYPES)[number]),
	) as (typeof VALID_VIEW_TYPES)[number][];

	if (validViews.length === 0) {
		throw new Error(
			`No valid views found, please create a view in the src/views folder and name it with a valid view type: ${VALID_VIEW_TYPES.join(", ")}`,
		);
	}

	return validViews;
}

async function makeEntrypoint(
	root: string,
	platform: "ios" | "android",
): Promise<string> {
	const entrypoint = path.join(
		root,
		"build",
		"entrypoints",
		platform,
		"index.js",
	);

	const files = await getSupportedAppViewTypes(root);

	const pascalCase = (str: string) =>
		str
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join("");

	const imports = files.map(
		(file) =>
			`import { ${pascalCase(file)} } from "../../../src/views/${file}";`,
	);
	const registry = files.map(
		(file) =>
			`AppRegistry.registerComponent("${pascalCase(file)}", () => ${pascalCase(file)});`,
	);

	const entrypointContent = `import { AppRegistry } from "react-native";
${imports.join("\n")}

${registry.join("\n")}
`;

	const entrypointDir = path.dirname(entrypoint);
	await mkdir(entrypointDir, { recursive: true });
	await writeFile(entrypoint, entrypointContent, "utf-8");

	console.log(` ✔︎ [${platform}] entrypoint created`);

	return entrypoint;
}

export async function createMobileBuild(
	root: string,
	platform: "ios" | "android",
) {
	const viewTypes = await getSupportedAppViewTypes(root);

	const fullDirectory = path.join(root, "build", "output", platform);

	// Check if the directory contains a file called `main_js_bundle.hbc`
	const mainJsBundle = path.join(fullDirectory, "main_js_bundle.hbc");

	if (!existsSync(mainJsBundle)) {
		throw new Error(`main_js_bundle.hbc not found in ${fullDirectory}`);
	}

	// check that that folder only contains the main_js_bundle.hbc file and an optional `assets` folder
	const files = readdirSync(fullDirectory);
	if (
		files.length > 2 ||
		files.length < 1 ||
		!files.includes("main_js_bundle.hbc")
	) {
		throw new Error(
			"Directory must contain only the main_js_bundle.hbc file and an optional `assets` folder",
		);
	}
	if (files.length === 2 && !files.includes("assets")) {
		throw new Error(
			"Directory must contain only the main_js_bundle.hbc file and an optional `assets` folder",
		);
	}

	// Zip the directory
	const zipData = await zipDirectory(fullDirectory);

	const checksum = await getChecksum(zipData);

	console.log(` ✔︎ [${platform}] build zipped with checksum: ${checksum}`);

	const fileName = `app_build_${platform}.zip`;
	const uploadedFile = await uploadFile(zipData, fileName, "application/zip");

	console.log(
		` ✔︎ [${platform}] uploaded build: ${fileName} (${(zipData.length / 1024).toFixed(0)} KB)`,
	);

	const build = await whopSdk.apps.createAppBuild({
		attachment: { directUploadId: uploadedFile.directUploadId },
		checksum,
		platform,
		supportedAppViewTypes: viewTypes.map(
			(view) =>
				({
					"experience-view": "hub" as const,
					"discover-view": "discover" as const,
				})[view],
		),
	});

	if (!build) {
		throw new Error("Failed to create app build");
	}

	const dashboardUrl = `https://whop.com/dashboard/${COMPANY_ID}/developer/apps/${APP_ID}/builds/`;

	console.log(`\n ✔︎ [${platform}] deployed as development build ✔︎
   - build id: ${build.id}
   - view types: ${viewTypes.join(", ")}
   - promote to production here: ${dashboardUrl}\n`);

	return build;
}

async function zipDirectory(
	directory: string,
): Promise<Buffer<ArrayBufferLike>> {
	const zip = new JSZip();

	// Recursively add files to zip
	function addFilesToZip(currentPath: string, relativePath = "") {
		const items = readdirSync(currentPath);

		for (const item of items) {
			const fullPath = path.join(currentPath, item);
			const zipPath = relativePath ? path.join(relativePath, item) : item;
			const stats = statSync(fullPath);

			if (stats.isDirectory()) {
				addFilesToZip(fullPath, zipPath);
			} else {
				const fileContent = readFileSync(fullPath);
				zip.file(zipPath, fileContent);
			}
		}
	}

	addFilesToZip(directory);

	// Generate zip file
	const zipData = await zip.generateAsync({ type: "nodebuffer" });

	return zipData;
}

class CustomReporter implements Reporter {
	update(event: ReportableEvent) {
		// Do nothing.
	}
}
