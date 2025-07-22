import { defineConfig } from "tsup";

export default defineConfig({
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
});
