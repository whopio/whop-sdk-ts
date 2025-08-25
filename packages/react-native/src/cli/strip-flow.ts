import * as fs from "node:fs/promises";
// stripFlowWithBabel.ts
import * as babel from "@babel/core";

export function stripFlowWithBabel() {
	const filter = /\.(m|c)?jsx?$/;
	return {
		name: "strip-flow-with-babel",
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		setup(b: any) {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			b.onLoad({ filter }, async (args: any) => {
				const code = await fs.readFile(args.path, "utf8");
				const out = await babel.transformAsync(code, {
					filename: args.path,
					babelrc: false,
					configFile: false,
					plugins: [
						[
							"@babel/plugin-transform-flow-strip-types",
							{ allowDeclareFields: true },
						],
					],
					parserOpts: { plugins: ["jsx", "flow"] },
					sourceMaps: false,
				});
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				return { contents: out!.code!, loader: "jsx" };
			});
		},
	};
}
