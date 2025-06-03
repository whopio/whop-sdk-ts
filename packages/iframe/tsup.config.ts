import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/host.ts"],
	sourcemap: true,
	clean: true,
	dts: true,
	format: ["cjs", "esm"],
	target: "es2022",
	outDir: "dist",
	outExtension: ({ format }) =>
		format === "cjs"
			? { js: ".js", dts: ".d.ts" }
			: { js: ".mjs", dts: ".d.mts" },
});
