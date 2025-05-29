import { defineConfig } from "tsup";

const extensions = {
	cjs: {
		js: ".cjs",
		dts: ".d.cts",
	},
	esm: {
		js: ".mjs",
		dts: ".d.mts",
	},
	iife: {
		js: ".js",
		dts: ".d.ts",
	},
} as const;

export default defineConfig({
	entry: ["src/index.ts", "src/loader.ts"],
	sourcemap: false,
	clean: true,
	dts: true,
	bundle: true,
	shims: true,
	format: ["cjs", "esm", "iife"],
	target: "es5",
	outDir: "dist",
	minify: true,
	outExtension: ({ format }) => extensions[format],
	publicDir: "./public",
});
