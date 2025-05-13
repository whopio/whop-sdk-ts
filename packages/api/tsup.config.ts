import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	splitting: false,
	sourcemap: true,
	clean: true,
	dts: true,
	format: ["cjs", "esm"],
	target: "es2022",
	outDir: "dist",
	outExtension: ({ format }) => ({ js: format === "esm" ? ".mjs" : ".cjs" }),
});
