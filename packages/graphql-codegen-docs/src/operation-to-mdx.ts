import type { Biome } from "@biomejs/js-api";
import {
	type FragmentDefinitionNode,
	type GraphQLSchema,
	Kind,
	type OperationDefinitionNode,
} from "graphql";
import { parseOperationInput, parseOperationOutput } from "./parse";
import { camelCaseToTitleCase, formatCode } from "./utils";

export function operationToMdx(
	value: OperationDefinitionNode,
	biome: Biome,
	schema: GraphQLSchema,
	availability: { client: boolean; server: boolean },
	fragments: FragmentDefinitionNode[],
	group: string,
): string {
	const inputObject = parseOperationInput(schema, value);
	const inputCode = inputObject?.removeInputFieldIfPossible().toCode();

	const description = getFieldDescription(schema, value) ?? "";

	const codeExample = `
	import { whopSdk } from "@/lib/whop-sdk";

	const result = await whopSdk.${group}.${value.name?.value}(${inputCode ?? ""});
	`;

	const formatted = formatCode(codeExample, biome);

	const availabilityNotice =
		!availability.client || !availability.server
			? `<Note>This operation is only available on the ${availability.server ? "server" : "client"}.</Note>`
			: "";

	const outputObject = parseOperationOutput(schema, value, fragments);

	const requiredPermissions = outputObject
		.getPermissions(true)
		.map((p) =>
			p.required ? `\`${p.action}\`` : `_\`${p.action}\` (optional)_`,
		)
		.join("\n - ");

	const permissionsText =
		requiredPermissions.length > 0
			? `

### Required Permissions
 - ${requiredPermissions}
`
			: "";

	const exampleOutputCode = `const result = ${outputObject
		.unnestSingleField()
		.toCode()}`;
	const exampleOutput = formatCode(exampleOutputCode, biome);

	const file = `---
title: ${camelCaseToTitleCase(value.name?.value ?? "")}${description}
noindex: true
---
${availabilityNotice}${permissionsText}
### Usage

\`\`\`typescript
${formatted}
\`\`\`

### Example output

\`\`\`typescript
${exampleOutput}
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
