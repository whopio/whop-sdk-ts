import * as fs from "node:fs/promises";
import * as path from "node:path";
// build/plugins/reanimatedBabel.ts
import * as babel from "@babel/core";

const JS_RE = /\.(m|c)?(t|j)sx?$/;

export function reanimatedBabelPlugin() {
	// Transform only: your app source (outside node_modules) and reanimated itself.
	const shouldTransform = (p: string) => {
		if (!JS_RE.test(p)) return false;
		// Always run on reanimated’s files
		if (p.includes(`${path.sep}react-native-reanimated${path.sep}`))
			return true;
		// Never touch third-party deps
		if (p.includes(`${path.sep}node_modules${path.sep}`)) return false;
		// Run on app code under src/
		return p.includes(`${path.sep}src${path.sep}`);
	};

	return {
		name: "reanimated-babel",
		setup(b: import("esbuild").PluginBuild) {
			b.onLoad({ filter: JS_RE }, async (args) => {
				if (!shouldTransform(args.path)) {
					// Skip non-target files so other plugins (and esbuild) can process them
					return null;
				}

				const code = await fs.readFile(args.path, "utf8");
				const result = await babel.transformAsync(code, {
					filename: args.path,
					sourceMaps: false,
					babelrc: false,
					configFile: false,
					// ORDER MATTERS: Reanimated plugin MUST BE LAST
					plugins: [
						// Needed by Reanimated on web per docs
						"@babel/plugin-transform-export-namespace-from",
						// Handle Flow types present in some RN libs
						[
							"@babel/plugin-transform-flow-strip-types",
							{ allowDeclareFields: true },
						],
						// MUST be last
						[
							"react-native-reanimated/plugin",
							{ relativeSourceLocation: true },
						],
					],
					presets: [], // esbuild handles TS/JSX syntax; no preset-env/preset-react
					caller: { name: "esbuild" },
					// Let Babel parse TS/JSX/Flow; keep it broad
					parserOpts: { plugins: ["jsx", "typescript"] },
					generatorOpts: { decoratorsBeforeExport: true },
				});

				return {
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					contents: result!.code!,
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					loader: pickLoader(args.path) as any,
				};
			});
		},
	};
}

function pickLoader(file: string) {
	const ext = path.extname(file).toLowerCase();
	if (ext === ".tsx") return "tsx";
	if (ext === ".ts") return "ts";
	if (ext === ".jsx") return "jsx";
	// For .js: many RN libs contain JSX; be permissive
	return "jsx";
}
