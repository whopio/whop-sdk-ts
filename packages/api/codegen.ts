import type { CodegenConfig } from "@graphql-codegen/cli";

import { config as dotenvConfig } from "dotenv";

import { Biome, Distribution } from "@biomejs/js-api";

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

const graphqlCodegenConfig = {
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
};

const config: CodegenConfig = {
	schema: {
		[schemaUrl.href]: {
			headers: {
				"x-whop-introspection": "1",
			},
		},
	},
	// documents: "./graphql/**/*.graphql",
	generates: {
		"src/codegen/graphql/client.ts": {
			documents: [
				"./graphql/operations/**/*.shared.graphql",
				"./graphql/operations/**/*.client.graphql",
				"./graphql/fragments/**/*.graphql",
			],
			plugins: [
				"typescript",
				"typescript-operations",
				"typescript-generic-sdk",
			],
			config: graphqlCodegenConfig,
		},
		"src/codegen/graphql/server.ts": {
			documents: [
				"./graphql/operations/**/*.shared.graphql",
				"./graphql/operations/**/*.server.graphql",
				"./graphql/fragments/**/*.graphql",
			],
			plugins: [
				"typescript",
				"typescript-operations",
				"typescript-generic-sdk",
			],
			config: graphqlCodegenConfig,
		},
	},
	hooks: {
		beforeOneFileWrite: async (filePath: string, content: string) => {
			const biome = await Biome.create({
				distribution: Distribution.NODE,
			});
			const formatted = biome.formatContent(content, {
				filePath,
			});

			const result = biome.lintContent(formatted.content, {
				filePath,
				fixFileMode: "SafeAndUnsafeFixes",
			});

			return result.content;
		},
	},
};

export default config;
