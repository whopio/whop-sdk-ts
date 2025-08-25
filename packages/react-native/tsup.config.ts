import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/lib/web.ts"],
		format: ["esm"], // <- ESM ONLY for browser
		target: "es2022",
		outDir: "dist/lib",
		dts: true,
		sourcemap: true,
		clean: true,
		splitting: false,
		esbuildOptions(opts) {
			opts.mainFields = ["browser", "module", "main"];
			opts.conditions = ["browser", "import", "default"];
		},
		// Force these to be external so you never bundle your own copy:
		external: [
			"react",
			"react-dom",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-native",
			"react-native-web",
		],
	},
	{
		entry: ["src/lib/index.ts", "src/cli/index.ts"],
		sourcemap: true,
		clean: true,
		dts: true,
		format: ["cjs", "esm"],
		target: "es2022",
		outDir: "dist",
		external: ["./whop-react-native-babel-transformer.js"],
		banner: {
			js: "#!/usr/bin/env node",
		},
		outExtension: ({ format }) =>
			format === "cjs"
				? { js: ".js", dts: ".d.ts" }
				: { js: ".mjs", dts: ".d.mts" },
	},
]);
