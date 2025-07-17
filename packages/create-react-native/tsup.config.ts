import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	sourcemap: true,
	clean: true,
	dts: true,
	format: ["cjs"],
	target: "node18",
	outDir: "dist",
	banner: {
		js: "#!/usr/bin/env node",
	},
	outExtension: () => ({ js: ".js" }),
});
