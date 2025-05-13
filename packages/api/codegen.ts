import type { CodegenConfig } from "@graphql-codegen/cli";

import { config as dotenvConfig } from "dotenv";

dotenvConfig({
	path: [".env.local", ".env.development"],
});

const graphBase = process.env.BUILD_GRAPHQL_ORIGIN;

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
	documents: "./graphql/**/*.graphql",
	generates: {
		"src/codegen/generated-api.ts": {
			plugins: [
				"typescript",
				"typescript-operations",
				"typescript-generic-sdk",
			],
			config: {
				constEnums: true,
				enumsAsTypes: true,
				enumsAsConst: true,
				onlyOperationTypes: true,
				strictScalars: true,
				preResolveTypes: true,
				declarationKind: "interface",
				scalars: {
					BigInt: "string",
					File: "string",
					JSON: "{ [key: string]: any }",
					Number: "number",
					Timestamp: "number",
					SanitizedString: "string",
					UrlString: "string",
					StringFloat: "string | number",
					Requirements: "Record<string, unknown>",
				},
			},
		},
	},
};

export default config;
