import {
	type EnumTypeDefinitionNode,
	type GraphQLSchema,
	type InputObjectTypeDefinitionNode,
	Kind,
	type OperationDefinitionNode,
	type ScalarTypeDefinitionNode,
	type TypeNode,
} from "graphql";

const idPrefixes = {
	accessPassId: "prod",
	experienceId: "exp",
	forumExperienceId: "exp",
	companyId: "biz",
	senderUserId: "user",
	userId: "user",
	parentId: "post",
	companyTeamId: "biz",
	appId: "app",
	feedId: "feed",
	ledgerAccountId: "ldgr",
	chatExperienceId: "exp",
};

type PrimitiveKind =
	| "string"
	| "boolean"
	| "number"
	| "timestamp"
	| "bigint"
	| "json"
	| "id";

abstract class BaseType {
	abstract toCode(): string;
}

class ArrayType extends BaseType {
	constructor(readonly type: BaseType) {
		super();
	}

	toCode(): string {
		return `[${this.type.toCode()}]`;
	}
}

class ErrorType extends BaseType {
	constructor(readonly message?: string) {
		super();
	}

	toCode(): string {
		if (this.message) {
			return `"Error(${this.message})"`;
		}
		return '"Error"';
	}
}

class ObjectField extends BaseType {
	name: string;
	isRequired: boolean;
	type: BaseType;
	description?: string;

	constructor(input: {
		name: string;
		type: BaseType;
		isRequired?: boolean;
		description?: string;
	}) {
		super();
		this.isRequired = input.isRequired ?? false;
		this.name = input.name;
		this.type = input.type;
	}

	toCode(): string {
		let output = "";
		if (this.description) {
			const comment = `${this.description ?? ""}`
				.split("\n")
				.map((line) => `// ${line}`)
				.join("\n");
			output += `${comment}\n`;
		}
		output += `${this.name}: ${this.type.toCode()}`;
		if (this.isRequired && this.name !== "input") {
			output += " /* Required! */";
		}
		return output;
	}

	get shouldRender(): boolean {
		if (this.name === "clientMutationId") {
			return false;
		}

		return true;
	}
}

class PrimitiveType extends BaseType {
	associatedField: ObjectField | null = null;

	constructor(readonly kind: PrimitiveKind) {
		super();
	}

	toCode(): string {
		switch (this.kind) {
			case "string":
				return this.exampleString();
			case "boolean":
				return "true";
			case "number":
				return "10";
			case "json":
				return "{ any: 'json' }";
			case "bigint":
				return `"9999999"`;
			case "timestamp":
				return "1716931200";
			case "id":
				return this.exampleId();
		}
	}

	exampleId(): string {
		const postfix = "XXXXXXXX";
		if (this.associatedField) {
			const fieldName = this.associatedField.name;
			if (fieldName in idPrefixes) {
				return `"${idPrefixes[fieldName as keyof typeof idPrefixes]}_${postfix}"`;
			}

			if (fieldName.endsWith("Ids") && fieldName.slice(0, -1) in idPrefixes) {
				return `"${idPrefixes[fieldName.slice(0, -1) as keyof typeof idPrefixes]}_${postfix}"`;
			}
		}

		return `"xxxxxxxxxxx"`;
	}
	exampleString(): string {
		if (this.associatedField?.name === "after") {
			return `"pageCursor.endCursor"`;
		}
		return `"some string"`;
	}
}

class EnumType extends BaseType {
	constructor(readonly values: string[]) {
		super();
	}

	toCode(): string {
		const allOptions = this.values.join(" | ");
		return `"${this.values[0]}" /* Valid values: ${allOptions} */`;
	}
}

class ObjectType extends BaseType {
	fields: ObjectField[];

	constructor(fields: ObjectField[]) {
		super();
		this.fields = fields;
	}

	addField(field: ObjectField) {
		this.fields.push(field);
	}

	toCode(): string {
		let output = "{";
		for (const field of this.fields) {
			if (!field.shouldRender) continue;
			output += `${field.toCode()},\n\n`;
		}
		output += "}";
		return output;
	}
}

export function generateExampleInput(
	schema: GraphQLSchema,
	operation: OperationDefinitionNode,
): string | undefined {
	const variableDefinitions = operation.variableDefinitions;
	if (!variableDefinitions || variableDefinitions.length === 0) {
		return undefined;
	}

	const inputObject: ObjectType = new ObjectType([]);

	for (const def of variableDefinitions) {
		const varName = def.variable.name.value;

		const objectField = new ObjectField({
			name: varName,
			type: new ErrorType(),
		});

		const type = parseType(schema, def.type, objectField);

		objectField.type = type;

		const selection = operation.selectionSet.selections.at(0);
		if (selection?.kind === Kind.FIELD) {
			for (const arg of selection.arguments ?? []) {
				if (
					arg.value.kind === Kind.VARIABLE &&
					arg.value.name.value === varName
				) {
					objectField.description = getInputArgDescription(
						schema,
						operation,
						arg.name.value,
					);
				}
			}
		}

		inputObject.addField(objectField);
	}

	const objectCode = inputObject.toCode();

	return objectCode;
}

function parseType(
	schema: GraphQLSchema,
	type: TypeNode,
	objectField: ObjectField | null,
): BaseType {
	if (type.kind === Kind.NON_NULL_TYPE) {
		if (objectField) {
			objectField.isRequired = true;
		}
		return parseType(schema, type.type, objectField);
	}

	if (type.kind === Kind.LIST_TYPE) {
		return new ArrayType(parseType(schema, type.type, null));
	}

	return parseNamedType(type.name.value, schema, objectField);
}

function parsePrimitiveType(
	typeName: string,
	parent: ObjectField | null,
): PrimitiveType | null {
	let primitive = null;
	switch (typeName) {
		case "String":
			primitive = new PrimitiveType("string");
			break;
		case "Boolean":
			primitive = new PrimitiveType("boolean");
			break;
		case "Int":
			primitive = new PrimitiveType("number");
			break;
		case "Float":
			primitive = new PrimitiveType("number");
			break;
		case "ID":
			primitive = new PrimitiveType("id");
			break;
		case "JSON":
			primitive = new PrimitiveType("json");
			break;
		default:
			return null;
	}
	if (parent) {
		primitive.associatedField = parent;
	}
	return primitive;
}

function parseNamedType(
	typeName: string,
	schema: GraphQLSchema,
	parent: ObjectField | null,
): BaseType {
	const type = schema.getType(typeName);
	if (!type) {
		return new ErrorType(`No Type for ${typeName}`);
	}

	const astNode = type.astNode;

	if (!astNode) {
		const primitive = parsePrimitiveType(typeName, parent);
		if (primitive) {
			return primitive;
		}
		return new ErrorType(`No Ast Node for ${typeName}`);
	}

	// if (parent && astNode.description?.value) {
	// 	parent.description ??= astNode.description.value;
	// }

	if (astNode.kind === Kind.ENUM_TYPE_DEFINITION) {
		return parseEnumTypeDefinition(astNode);
	}

	if (astNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
		return parseInputObjectTypeDefinition(astNode, schema);
	}

	if (astNode.kind === Kind.SCALAR_TYPE_DEFINITION) {
		return parseScalarTypeDefinition(astNode);
	}

	return new ErrorType(astNode.kind);
}

function parseEnumTypeDefinition(node: EnumTypeDefinitionNode): BaseType {
	const values = node.values?.map((value) => value.name.value) ?? [];
	if (values.length === 0) {
		return new ErrorType();
	}
	return new EnumType(values);
}

function parseScalarTypeDefinition(node: ScalarTypeDefinitionNode): BaseType {
	switch (node.name.value) {
		case "Timestamp":
			return new PrimitiveType("timestamp");
		case "BigInt":
			return new PrimitiveType("bigint");
		default:
			return new ErrorType(`Unknown scalar type: ${node.name.value}`);
	}
}

function parseInputObjectTypeDefinition(
	node: InputObjectTypeDefinitionNode,
	schema: GraphQLSchema,
): BaseType {
	if (!node.fields || node.fields.length === 0) {
		return new ErrorType("No fields in input object");
	}

	const object = new ObjectType([]);

	for (const f of node.fields) {
		const field = new ObjectField({
			name: f.name.value,
			type: new ErrorType(),
		});

		const type = parseType(schema, f.type, field);

		field.type = type;
		field.description = f.description?.value;

		object.addField(field);
	}

	return object;
}

function getInputArgDescription(
	schema: GraphQLSchema,
	operation: OperationDefinitionNode,
	argName: string,
) {
	const firstSelection = operation.selectionSet.selections.at(0);
	if (firstSelection?.kind === Kind.FIELD) {
		const field = schema.getQueryType()?.getFields()[firstSelection.name.value];
		if (!field) return;
		const arg = field.args?.find((arg) => arg.name === argName);
		if (!arg) return;
		return arg.description ?? undefined;
	}
}
