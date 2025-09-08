import crypto from "node:crypto";
import type { CodegenConfig } from "@graphql-codegen/cli";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import {
	type LoadTypedefsOptions,
	loadDocuments,
	loadSchema,
} from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";

import { config as dotenvConfig } from "dotenv";

import { Biome, Distribution } from "@biomejs/js-api";

import {
	type FragmentDefinitionNode,
	type GraphQLSchema,
	Kind,
	type OperationDefinitionNode,
	concatAST,
	visit,
} from "graphql";
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
		Decimal: "string",
	},
};

const schemaPointer = {
	[schemaUrl.href]: {
		headers: {
			"x-whop-introspection": "1",
		},
	},
} as const;

const operationPointers = {
	client: [
		"./graphql/operations/**/*.shared.graphql",
		"./graphql/operations/**/*.client.graphql",
		"./graphql/fragments/**/*.graphql",
	],
	server: [
		"./graphql/operations/**/*.shared.graphql",
		"./graphql/operations/**/*.server.graphql",
		"./graphql/fragments/**/*.graphql",
	],
};

const config: CodegenConfig = {
	schema: schemaPointer,
	// documents: "./graphql/**/*.graphql",
	generates: {
		"src/codegen/graphql/client.ts": {
			documents: operationPointers.client,
			plugins: ["typescript", "typescript-operations"],
			config: graphqlCodegenConfig,
		},
		"src/codegen/graphql/server.ts": {
			documents: operationPointers.server,
			plugins: ["typescript", "typescript-operations"],
			config: graphqlCodegenConfig,
		},
	},
	hooks: {
		beforeOneFileWrite: async (filePath: string, content: string) => {
			const biome = await Biome.create({
				distribution: Distribution.NODE,
			});

			const schema = await loadSchema(schemaPointer, {
				loaders: [new UrlLoader()],
			});

			const documents = {
				client: await loadOperationDocuments(operationPointers.client),
				server: await loadOperationDocuments(operationPointers.server),
			};

			const mode = filePath.split("/").pop()?.split(".")[0];
			let sdkCode = "";
			if (mode === "server" || mode === "client") {
				sdkCode = await makeSdk(
					mode,
					schema,
					documents[mode].operations,
					documents[mode].fragments,
				);
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

async function loadOperationDocuments(pointers: string[]) {
	const loadDocumentsOptions: LoadTypedefsOptions = {
		loaders: [new GraphQLFileLoader()],
	};
	const sources = await loadDocuments(pointers, loadDocumentsOptions);
	const allAst = concatAST(sources.map((v) => v.document).filter(notEmpty));

	const operations: Record<string, OperationDefinitionNode> = {};
	const fragments: Record<string, FragmentDefinitionNode> = {};

	visit(allAst, {
		OperationDefinition: (node) => {
			const name = node.name?.value;
			if (!name) throw new Error("Expected operation to have a name");
			operations[name] = node;
		},
		FragmentDefinition: (node) => {
			const name = node.name?.value;
			if (!name) throw new Error("Expected fragment to have a name");
			fragments[name] = node;
		},
	});

	return {
		operations,
		fragments,
	};
}

async function makeSdk(
	mode: "server" | "client",
	schema: GraphQLSchema,
	operations: Record<string, OperationDefinitionNode>,
	fragments: Record<string, FragmentDefinitionNode>,
) {
	// 1. Generate the operations JSON
	const clientName = `whop-sdk-ts-${mode}`;
	const generatedOperations = await sync({
		client: clientName,
		outfile: "/dev/null",
		addTypename: true,
		hash: hashFunction,
		path: `{./graphql/operations/**/*.shared.graphql,./graphql/operations/**/*.${mode}.graphql,./graphql/fragments/**/*.graphql}`,
	});

	console.log(
		"GENERATED HASHES FOR",
		generatedOperations.operations.length,
		"operations. ParsedOperations",
		Object.keys(operations).length,
	);

	const sdkCode = generateSdk(
		generatedOperations.operations,
		clientName,
		schema,
		operations,
		fragments,
	);

	return sdkCode;
}

function getGroupingForOperation(
	operation: ClientOperation,
	operations: Record<string, OperationDefinitionNode>,
) {
	if (!operation.name) {
		throw new Error(`Operation ${JSON.stringify(operation)} has no name`);
	}
	const operationDef = operations[operation.name];
	if (!operationDef) {
		throw new Error(`Operation ${operation.name} not found`);
	}
	const filename = operationDef.loc?.source.name;
	if (!filename) {
		throw new Error(`Operation ${operation.name} has no filename`);
	}

	const pathBits = filename.split("/");
	pathBits.pop();
	const group = pathBits.pop();
	if (!group) {
		throw new Error(`Operation ${operation.name} has no group`);
	}
	return kebabCaseToCamelCase(group);
}

function generateSdk(
	clientOperations: ClientOperation[],
	clientName: string,
	schema: GraphQLSchema,
	operations: Record<string, OperationDefinitionNode>,
	fragments: Record<string, FragmentDefinitionNode>,
) {
	const groups: Record<string, ClientOperation[]> = {};
	for (const operation of clientOperations) {
		const grouping = getGroupingForOperation(operation, operations);
		if (!groups[grouping]) {
			groups[grouping] = [];
		}
		groups[grouping].push(operation);
	}
	const groupedSdkObjects = Object.entries(groups)
		.map(([group, clientOperations]) => {
			const sdkObject = generateFunctionGrouping(
				clientOperations,
				clientName,
				schema,
				operations,
				fragments,
			);
			return `${group}: ${sdkObject},`;
		})
		.join("\n");

	const requesterType = `
	export type Requester<C = {}> = <R, V>(
		operationId: string,
		operationName: string,
		operationType: "query" | "mutation",
		vars?: V,
		options?: C,
	) => Promise<R>;`;

	const carryErrorsFunction = `
	export type WithError<T> = T extends object ? T & { _error?: Error } : T;
	export function carryErrors<Full, Extracted>(res: Full, data: Extracted): WithError<Extracted> {
		if (typeof res === "object" && res && "_error" in res && res._error && res._error instanceof Error && typeof data === "object" && data) {
			(data as any)._error = res._error;
		}
		return data as WithError<Extracted>;
	}`;

	const getSdkFunction = `export function getSdk<C>(requester: Requester<C>) {
		return { ${groupedSdkObjects} };
	}`;

	const sdkType = "export type Sdk = ReturnType<typeof getSdk>";

	const code = `${requesterType}\n\n${carryErrorsFunction}\n\n${getSdkFunction}\n\n${sdkType}`;
	return code;
}

function generateFunctionGrouping(
	clientOperations: ClientOperation[],
	clientName: string,
	schema: GraphQLSchema,
	operations: Record<string, OperationDefinitionNode>,
	fragments: Record<string, FragmentDefinitionNode>,
) {
	const functions = clientOperations.map((operation) => {
		if (!operation.name) {
			throw new Error(`Operation ${JSON.stringify(operation)} has no name`);
		}
		const operationDef = operations[operation.name];
		if (!operationDef) {
			throw new Error(`Operation ${operation.name} not found`);
		}
		return generateSingleFunction(
			operation,
			clientName,
			schema,
			operationDef,
			fragments,
		);
	});

	return `{
			${functions.join(",\n\t")}
}`;
}

function generateSingleFunction(
	operation: ClientOperation,
	clientName: string,
	schema: GraphQLSchema,
	operationDef: OperationDefinitionNode,
	fragments: Record<string, FragmentDefinitionNode>,
) {
	const { name, alias: operationId, body } = operation;
	if (!name || !operationId || !body) {
		throw new Error(`Invalid operation: ${JSON.stringify(operation)}`);
	}

	const hasInputObject =
		operationDef.variableDefinitions?.length === 1 &&
		operationDef.variableDefinitions[0].variable.name.value === "input";

	const hasInputs = operationDef.variableDefinitions?.some(
		(v) => !v.defaultValue && v.type.kind === Kind.NON_NULL_TYPE,
	);

	const inputTypeSuffix = hasInputObject ? "['input']" : "";

	const isMutation = body.includes(`mutation ${name}(`);
	const operationType = isMutation ? "Mutation" : "Query";
	const hasInputsQuestionMark = hasInputs ? "" : "?";
	const baseInputType = `${capitalize(name)}${operationType}Variables`;
	const inputType = `${baseInputType}${inputTypeSuffix}`;
	const baseOutputType = `${capitalize(name)}${operationType}`;
	const outputType = getOutputType(operationDef, baseOutputType);
	const functionArgs = `variables${hasInputsQuestionMark}: ${inputType}, options?: C`;
	const variables = hasInputObject ? "{ input: variables }" : "variables";
	const thenChain = getThenChain(operationDef);
	const functionBody = `return requester<${baseOutputType}, ${baseInputType}>("${clientName}/${operationId}", "${name}", "${operationType.toLowerCase()}", ${variables}, options)${thenChain};`;
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

function getThenChain(operationDef: OperationDefinitionNode): string {
	const name = getSelectionName(operationDef);
	if (!name) return "";
	return `.then((res) => carryErrors(res, res.${name}))`;
}

function getOutputType(
	operationDef: OperationDefinitionNode,
	base: string,
): string {
	const name = getSelectionName(operationDef);
	if (!name) return `WithError<${base}>`;
	return `WithError<${base}["${name}"]>`;
}

function getSelectionName(
	operationDef: OperationDefinitionNode,
): string | null {
	const selectionSet = operationDef.selectionSet;
	if (selectionSet.selections.length !== 1) return null;
	const selection = selectionSet.selections[0];
	if (selection.kind !== Kind.FIELD) return null;
	return selection.alias?.value ?? selection.name.value;
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
	return value !== null && value !== undefined;
}

function kebabCaseToCamelCase(str: string) {
	return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export default config;
