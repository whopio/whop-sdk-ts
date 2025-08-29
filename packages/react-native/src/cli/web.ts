import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { getChecksum, uploadFile } from "./file";
import { reanimatedBabelPlugin } from "./reanimated-bable";
import { APP_ID, COMPANY_ID, whopSdk } from "./sdk";
import { stripFlowWithBabel } from "./strip-flow";
import { getSupportedAppViewTypes } from "./valid-view-type";

function aliasReactNativePlugin() {
	return {
		name: "alias-react-native",
		setup(b: import("esbuild").PluginBuild) {
			b.onResolve({ filter: /^react-native$/ }, () => ({
				path: require.resolve("react-native-web"),
			}));
		},
	} satisfies import("esbuild").Plugin;
}

function forceSingleReact() {
	const map = new Map<string, string>([
		["react", require.resolve("react")],
		["react/jsx-runtime", require.resolve("react/jsx-runtime")],
		["react/jsx-dev-runtime", require.resolve("react/jsx-dev-runtime")],
		["react-dom", require.resolve("react-dom")],
		["react-dom/client", require.resolve("react-dom/client")],
	]);

	const rx = /^(react(?:\/jsx-(?:dev-)?runtime)?|react-dom(?:\/client)?)$/;

	return {
		name: "force-single-react",
		setup(b: import("esbuild").PluginBuild) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			b.onResolve({ filter: rx }, (args) => ({ path: map.get(args.path)! }));
		},
	} satisfies import("esbuild").Plugin;
}

function toPascalCase(str: string) {
	return str
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("");
}

async function makeWebEntrypoint(root: string) {
	const files = await getSupportedAppViewTypes(root);

	const packageJsonPath = path.join(root, "package.json");
	const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
	const hasReactNativeReanimated =
		packageJson.dependencies?.["react-native-reanimated"];

	const imports = files.map(
		(file) =>
			`import { ${toPascalCase(file)} } from "../../../src/views/${file}";`,
	);
	const registry = files.map(
		(file) =>
			`AppRegistry.registerComponent("${toPascalCase(file)}", () => WhopNavigationWrapper(React, "${toPascalCase(file)}", ${toPascalCase(file)}));`,
	);

	const defaultKey = toPascalCase(files[0] ?? "experience-view");
	const reanimatedImport = hasReactNativeReanimated
		? `import "react-native-reanimated";`
		: "";

	const entry = `import { AppRegistry } from "react-native";
import * as React from "react";
import { WhopNavigationWrapper } from "@whop/react-native/web";
${reanimatedImport}

${imports.join("\n")} 

${registry.join("\n")} 

const viewType = new URLSearchParams(window.location.search).get("app_view") ?? "${defaultKey}"; 

const root = document.getElementById("root") || (() => {
	const d = document.createElement("div");
	d.id = "root";
	document.body.appendChild(d);
	return d;
})();
AppRegistry.runApplication(viewType, { rootTag: root });
`;

	const entryFile = path.join(root, "build", "entrypoints", "web", "index.tsx");
	await mkdir(path.dirname(entryFile), { recursive: true });
	await writeFile(entryFile, entry, "utf-8");

	return entryFile;
}

export async function bundleWeb(root: string) {
	const entry = await makeWebEntrypoint(root);

	const outDir = path.join(root, "build", "output", "web");
	await mkdir(outDir, { recursive: true });

	await build({
		entryPoints: [entry],
		outfile: path.join(outDir, "main.js"),
		bundle: true,
		minify: false,
		format: "esm",
		platform: "browser",
		sourcemap: false,
		jsx: "automatic",
		mainFields: ["browser", "module", "main"],
		conditions: ["browser", "import", "default"],
		define: {
			process: "{}",
			"process.env": "{}",
			"process.env.NODE_ENV": '"production"',
			__DEV__: "false",
			"process.env.NEXT_PUBLIC_WHOP_APP_ID": `"${APP_ID}"`,
			// Some RN libraries (e.g., RNGH) expect a Node-like global in the browser
			global: "globalThis",
		},
		resolveExtensions: [
			".web.tsx",
			".web.ts",
			".web.js",
			".tsx",
			".ts",
			".jsx",
			".js",
		],
		loader: {
			".png": "dataurl",
			".jpg": "dataurl",
			".jpeg": "dataurl",
			".svg": "dataurl",
			".ttf": "dataurl",
			".woff": "dataurl",
			".woff2": "dataurl",
			".js": "jsx",
			".jsx": "jsx",
		},
		plugins: [
			forceSingleReact(),
			aliasReactNativePlugin(),
			reanimatedBabelPlugin(),
			stripFlowWithBabel(),
			{
				name: "force-native-web-stub",
				setup(b) {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					b.onResolve({ filter: /^\.\/native-whop-core$/ }, (args: any) => {
						// Always resolve the local source file so extension resolution (.web.ts) applies
						return {
							path: path.join(args.resolveDir, "native-whop-core"),
							namespace: "file",
						};
					});
				},
			},
		],
	});

	const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Whop App (Web)</title>
		<style>
			#root {
				width: 100vw;
				height: 100vh;
				margin: 0;
				padding: 0;
				overflow: hidden;
				display: flex;
				flex-direction: column;
				align-items: stretch;
				justify-content: start;
			}
		</style>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="./main.js"></script>
	</body>
</html>`;
	await writeFile(path.join(outDir, "index.html"), html, "utf-8");

	console.log(" ✔︎ [web] bundle created at build/output/web/main.js");
}

export async function buildAndPublish(
	root: string,
	{
		shouldBuild = true,
		shouldUpload = true,
	}: { shouldBuild: boolean; shouldUpload: boolean } = {
		shouldBuild: true,
		shouldUpload: true,
	},
) {
	if (shouldBuild) {
		await bundleWeb(root);
	}
	if (shouldUpload) {
		await createWebBuild(root);
	}
}

export async function createWebBuild(root: string) {
	const fullDirectory = path.join(root, "build", "output", "web");
	const mainJsFile = path.join(fullDirectory, "main.js");

	// Verify bundle exists
	try {
		await readFile(mainJsFile);
	} catch {
		throw new Error(`main.js not found in ${fullDirectory}`);
	}

	const buf = await readFile(mainJsFile);
	const checksum = await getChecksum(buf);

	console.log(` ✔︎ [web] build checksummed: ${checksum}`);

	const fileName = `rnweb_${checksum}.js`;
	const uploadedFile = await uploadFile(
		buf,
		fileName,
		"application/javascript",
	);

	console.log(
		` ✔︎ [web] uploaded build: ${fileName} (${(buf.length / 1024).toFixed(0)} KB)`,
	);

	const build = await whopSdk.apps.createAppBuild({
		attachment: { directUploadId: uploadedFile.directUploadId },
		checksum,
		platform: "web",
		supportedAppViewTypes: ["hub"],
	});

	if (!build) {
		throw new Error("Failed to create app build");
	}

	const dashboardUrl = `https://whop.com/dashboard/${COMPANY_ID}/developer/apps/${APP_ID}/builds/?platform=web`;

	console.log(
		`\n ✔︎ [web] deployed as development build ✔︎\n   - build id: ${build.id}\n   - view types: hub\n   - promote to production here: ${dashboardUrl}\n`,
	);

	return build;
}
