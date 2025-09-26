import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Biome, Distribution } from "@biomejs/js-api";
import type { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import {
	type FragmentDefinitionNode,
	type GraphQLSchema,
	type OperationDefinitionNode,
	concatAST,
	visit,
} from "graphql";
import { operationToMdx } from "./operation-to-mdx";
import {
	camelCaseToKebabCase,
	formatCode,
	kebabCaseToCamelCase,
	kebabCaseToTitleCase,
	notEmpty,
} from "./utils";

const BASE_OUTPUT_PATH = "../../apps/docs/sdk/api";

export const plugin: PluginFunction<object, Types.ComplexPluginOutput> = async (
	inputSchema,
	rawDocuments,
	config,
) => {
	const biome = await Biome.create({
		distribution: Distribution.NODE,
	});

	const schema = inputSchema;

	const allAst = concatAST(
		rawDocuments.map((v) => v.document).filter(notEmpty),
	);

	const operations: OperationDefinitionNode[] = [];
	const fragments: FragmentDefinitionNode[] = [];

	visit(allAst, {
		OperationDefinition: (node) => {
			operations.push(node);
		},
		FragmentDefinition: (node) => {
			fragments.push(node);
		},
	});

	rmSync(BASE_OUTPUT_PATH, { recursive: true, force: true });

	const groupedOperations: Record<string, string[]> = {};

	for (const operation of operations) {
		writeOperation(operation, biome, schema, groupedOperations, fragments);
	}

	updateMintJson(groupedOperations, biome);

	return {
		content: "// not used",
	};
};

function writeOperation(
	value: OperationDefinitionNode,
	biome: Biome,
	schema: GraphQLSchema,
	groupedOperations: Record<string, string[]>,
	fragments: FragmentDefinitionNode[],
) {
	const existingFileName = value.loc?.source.name;
	const operationName = value.name?.value;
	if (!operationName) throw Error("Operation name missing");
	if (!existingFileName) throw Error("Existing file name missing");
	const [, inner] = existingFileName.split("packages/api/graphql/operations/");
	if (!inner) throw Error("Inner file name missing");

	const pathBits = inner.split("/").filter((s) => s.length > 0);

	const fileNameOnly = pathBits.at(-1);
	if (!fileNameOnly) throw Error("File name missing");

	const [fileNameWithoutExtension, mode, extension] = fileNameOnly.split(".");
	if (!fileNameWithoutExtension) throw Error("File name missing");
	if (!mode) throw Error("Mode missing");
	if (extension !== "graphql") throw Error("Extension should be .graphql");

	if (!["server", "shared", "client"].includes(mode)) {
		throw Error(
			`Mode should be one of: server, shared, client. Current mode: ${mode}`,
		);
	}

	if (fileNameWithoutExtension !== camelCaseToKebabCase(operationName)) {
		throw Error(
			`Operation name mismatch: ${fileNameWithoutExtension} != ${camelCaseToKebabCase(operationName)}`,
		);
	}

	if (pathBits.length !== 2) {
		throw Error(`Cannot nest graphql 2 levels deep: ${pathBits.join("/")}`);
	}

	const group = pathBits[0];
	const name = camelCaseToKebabCase(operationName);

	if (!groupedOperations[group]) {
		groupedOperations[group] = [];
	}
	groupedOperations[group].push(`sdk/api/${group}/${name}`);

	const path = `${BASE_OUTPUT_PATH}/${group}/${name}.mdx`;
	const outputPathBits = path.split("/");
	const folder = outputPathBits.slice(0, -1).join("/");
	mkdirSync(folder, { recursive: true });

	const doc = operationToMdx(
		value,
		biome,
		schema,
		{
			client: mode === "client" || mode === "shared",
			server: mode === "server" || mode === "shared",
		},
		fragments,
		kebabCaseToCamelCase(group),
	);

	writeFileSync(path, doc, {
		encoding: "utf-8",
	});
}

function updateMintJson(
	groupedOperations: Record<string, string[]>,
	biome: Biome,
) {
	const mintJsonPath = `${BASE_OUTPUT_PATH}/../../docs.json`;
	const mintJson = readFileSync(mintJsonPath, "utf-8");
	const mintJsonObject = JSON.parse(mintJson);
	const navigation = mintJsonObject.navigation.versions[0].tabs
		.find((t: { tab: string }) => t.tab === "SDK Reference")
		.groups.find((o: { group: string }) => o.group === "Resources");
	navigation.pages = reformatMintJson(groupedOperations);
	const formattedJson = formatCode(
		JSON.stringify(mintJsonObject, null, 2),
		biome,
		"json",
	);
	writeFileSync(mintJsonPath, formattedJson);
}

function reformatMintJson(groupedOperations: Record<string, string[]>) {
	return Object.entries(groupedOperations).map(([group, pages]) => ({
		group: kebabCaseToTitleCase(group),
		pages,
	}));
}
