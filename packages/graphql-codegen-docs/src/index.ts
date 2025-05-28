import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Biome, Distribution } from "@biomejs/js-api";
import type { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import {
	type GraphQLSchema,
	Kind,
	type OperationDefinitionNode,
	concatAST,
	visit,
} from "graphql";
import { generateExampleInput } from "./input";

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

	visit(allAst, {
		OperationDefinition: (node) => {
			operations.push(node);
		},
	});

	rmSync(BASE_OUTPUT_PATH, { recursive: true, force: true });

	const groupedOperations: Record<string, string[]> = {};

	for (const operation of operations) {
		writeOperation(operation, biome, schema, groupedOperations);
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
) {
	const doc = formatOperation(value, biome, schema);
	const existingFileName = value.loc?.source.name;
	const operationName = value.name?.value;
	if (!operationName) throw Error("Operation name missing");
	if (!existingFileName) throw Error("Existing file name missing");
	const [, inner] = existingFileName.split("packages/api/graphql/operations/");
	if (!inner) throw Error("Inner file name missing");

	const pathBits = inner.split("/").filter((s) => s.length > 0);

	const fileNameWithoutExtension = pathBits.at(-1)?.split(".").at(0);
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
	writeFileSync(path, doc, {
		encoding: "utf-8",
	});
}

function formatOperation(
	value: OperationDefinitionNode,
	biome: Biome,
	schema: GraphQLSchema,
) {
	const inputCode = value.variableDefinitions
		? generateExampleInput(schema, value)
		: undefined;

	const description = getFieldDescription(schema, value) ?? "";

	const codeExample = `
	import { whopApi } from "@/lib/whop-api";

	const result = await whopApi.${value.name?.value}(${inputCode ?? ""});
	`;

	const formatted = formatCode(codeExample, biome);

	const file = `---
title: ${camelCaseToTitleCase(value.name?.value ?? "")}${description}
---

\`\`\`typescript
${formatted}
\`\`\`
`;

	return file;
}

function getFieldDescription(
	schema: GraphQLSchema,
	operation: OperationDefinitionNode,
) {
	const firstSelection = operation.selectionSet.selections.at(0);
	if (firstSelection?.kind === Kind.FIELD) {
		const field = schema.getQueryType()?.getFields()[firstSelection.name.value];
		if (field?.description) {
			return `\ndescription: ${field.description}`;
		}
	}
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
	return value !== null && value !== undefined;
}

function formatCode(code: string, biome: Biome, extension = "ts") {
	const formatted = biome.formatContent(code, {
		filePath: `file.${extension}`,
	});

	const result = biome.lintContent(formatted.content, {
		filePath: `file.${extension}`,
		fixFileMode: "SafeAndUnsafeFixes",
	});

	return result.content;
}

function camelCaseToSnakeCase(value: string) {
	return splitCamelCase(value).join("_").toLowerCase();
}

function camelCaseToTitleCase(value: string) {
	return splitCamelCase(value)
		.join(" ")
		.replace(/^./, (str) => str.toUpperCase());
}

function camelCaseToKebabCase(value: string) {
	return splitCamelCase(value).join("-").toLowerCase();
}

function splitCamelCase(value: string) {
	const split = value.split(/([A-Z])/g);
	const output: string[] = [];

	for (let i = 0; i < split.length; i++) {
		const j = output.length - 1;
		if (i === 0 || output[j].length > 1) {
			output.push(split[i]);
		} else {
			output[j] += split[i];
		}
	}

	return output;
}

function updateMintJson(
	groupedOperations: Record<string, string[]>,
	biome: Biome,
) {
	const mintJsonPath = `${BASE_OUTPUT_PATH}/../../mint.json`;
	const mintJson = readFileSync(mintJsonPath, "utf-8");
	const mintJsonObject = JSON.parse(mintJson);
	const navigation = mintJsonObject.navigation.find(
		(o: { group: string }) => o.group === "Resources",
	);
	navigation.pages = reformatMintJson(groupedOperations);
	const formattedJson = formatCode(
		JSON.stringify(mintJsonObject, null, 2),
		biome,
		"json",
	);
	writeFileSync(mintJsonPath, formattedJson);
}

function kebabCaseToTitleCase(value: string) {
	return value
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function reformatMintJson(groupedOperations: Record<string, string[]>) {
	return Object.entries(groupedOperations).map(([group, pages]) => ({
		group: kebabCaseToTitleCase(group),
		pages,
	}));
}
