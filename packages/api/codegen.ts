import crypto from "node:crypto";
import type { CodegenConfig } from "@graphql-codegen/cli";

import { config as dotenvConfig } from "dotenv";

import { Biome, Distribution } from "@biomejs/js-api";

import { sync } from "graphql-ruby-client";
import type { ClientOperation } from "graphql-ruby-client/sync/generateClient";

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
			plugins: ["typescript", "typescript-operations"],
			config: graphqlCodegenConfig,
		},
		"src/codegen/graphql/server.ts": {
			documents: [
				"./graphql/operations/**/*.shared.graphql",
				"./graphql/operations/**/*.server.graphql",
				"./graphql/fragments/**/*.graphql",
			],
			plugins: ["typescript", "typescript-operations"],
			config: graphqlCodegenConfig,
		},
	},
	hooks: {
		beforeOneFileWrite: async (filePath: string, content: string) => {
			const biome = await Biome.create({
				distribution: Distribution.NODE,
			});

			const mode = filePath.split("/").pop()?.split(".")[0];
			let sdkCode = "";
			if (mode === "server" || mode === "client") {
				sdkCode = await makeSdk(mode);
			}
			const contentWithSdk = content + sdkCode;

			const formatted = biome.formatContent(contentWithSdk, {
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

async function makeSdk(mode: "server" | "client") {
	// 1. Generate the operations JSON
	const clientName = `whop-sdk-ts-${mode}`;
	const operations = await sync({
		client: clientName,
		outfile: "/dev/null",
		addTypename: true,
		hash: hashFunction,
		path: `{./graphql/operations/**/*.shared.graphql,./graphql/operations/**/*.${mode}.graphql,./graphql/fragments/**/*.graphql}`,
	});

	const sdkCode = generateSdk(operations.operations, clientName);

	return sdkCode;
}

function generateSdk(operations: ClientOperation[], clientName: string) {
	const functions = operations.map((operation) =>
		generateSingleFunction(operation, clientName),
	);

	const requesterType = `
	export type Requester<C = {}> = <R, V>(
		operationId: string,
		vars?: V,
		options?: C,
	) => Promise<R>;`;

	const getSdkFunction = `export function getSdk<C>(requester: Requester<C>) {
		return {
			${functions.join(",\n\t")}
		}
	}`;

	const sdkType = "export type Sdk = ReturnType<typeof getSdk>";

	const code = `${requesterType}\n\n${getSdkFunction}\n\n${sdkType}`;
	return code;
}

function generateSingleFunction(
	operation: ClientOperation,
	clientName: string,
) {
	const { name, alias: operationId, body } = operation;
	if (!name || !operationId || !body) {
		throw new Error(`Invalid operation: ${JSON.stringify(operation)}`);
	}
	const isMutation = body.includes(`mutation ${name}(`);
	const operationType = isMutation ? "Mutation" : "Query";
	const inputType = `${capitalize(name)}${operationType}Variables`;
	const outputType = `${capitalize(name)}${operationType}`;
	const functionArgs = `variables: ${inputType}, options?: C`;
	const functionBody = `return requester<${outputType}, ${inputType}>("${clientName}/${operationId}", variables, options);`;
	const code = `${name}(${functionArgs}): Promise<${outputType}> { ${functionBody} }`;
	return code;
}

function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function hashFunction(str: string) {
	const hashed = crypto.createHash("sha256").update(str).digest("hex");
	return `sha256:${hashed}`;
}

export default config;
