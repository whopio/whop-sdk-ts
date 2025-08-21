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
	entry: ["src/index.ts", "src/loader.ts", "src/util.ts", "src/react/index.ts"],
	sourcemap: false,
	clean: true,
	dts: true,
	bundle: true,
	shims: true,
	format: ["iife", "cjs", "esm"],
	target: "es5",
	outDir: "dist/static/checkout",
	minify: true,
	publicDir: "public",
	outExtension: ({ format }) => extensions[format],
	esbuildOptions: (options) => {
		// Configure JSX for broad React compatibility (classic transform works across all versions)
		options.jsx = "transform";
		options.jsxFactory = "React.createElement";
		options.jsxFragment = "React.Fragment";
		options.external = options.external || [];
		if (Array.isArray(options.external)) {
			options.external.push("react", "react-dom");
		}
	},
});
