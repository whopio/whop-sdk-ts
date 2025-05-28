import type { CodegenConfig } from "@graphql-codegen/cli";

const graphBase = "https://api.whop.com";

if (!graphBase) throw new Error("Expected `BUILD_GRAPHQL_ORIGIN` to be set");

const schemaUrl = new URL(
	"/graphql/public/configured_schema.graphql",
	graphBase,
);

console.debug("CURRENT SCHEMA URL", schemaUrl.href);

const config: CodegenConfig = {
	schema: {
		[schemaUrl.href]: {
			headers: {
				"x-whop-introspection": "1",
			},
		},
	},
	documents: "../../packages/api/graphql/**/*.graphql",
	generates: {
		"node_modules/not-used.txt": {
			plugins: ["@local/graphql-codegen-docs"],
			config: {},
		},
	},
};

export default config;
