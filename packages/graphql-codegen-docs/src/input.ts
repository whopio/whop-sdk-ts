import {
	type EnumTypeDefinitionNode,
	type FieldNode,
	type FragmentDefinitionNode,
	GraphQLEnumType,
	type GraphQLField,
	type GraphQLFieldMap,
	GraphQLInterfaceType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	type GraphQLOutputType,
	GraphQLScalarType,
	type GraphQLSchema,
	type InputObjectTypeDefinitionNode,
	Kind,
	type OperationDefinitionNode,
	OperationTypeNode,
	type ScalarTypeDefinitionNode,
	type SelectionNode,
	type SelectionSetNode,
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
		if (["clientMutationId", "__typename"].includes(this.name)) {
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
			return `"pageInfo.endCursor"`;
		}
		if (this.associatedField?.name === "before") {
			return `"pageInfo.startCursor"`;
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

export function generateExampleOutput(
	schema: GraphQLSchema,
	operation: OperationDefinitionNode,
	fragments: FragmentDefinitionNode[],
): string {
	const baseObjectType =
		operation.operation === OperationTypeNode.MUTATION
			? schema.getMutationType()
			: operation.operation === OperationTypeNode.QUERY
				? schema.getQueryType()
				: schema.getSubscriptionType();

	if (!baseObjectType) {
		throw new Error("No query type found");
	}

	return parseSelectionSet(
		schema,
		operation.selectionSet,
		baseObjectType.getFields(),
		fragments,
	).toCode();
}

function parseField(
	schema: GraphQLSchema,
	field: FieldNode,
	// biome-ignore lint/suspicious/noExplicitAny: allow for generics
	graphqlType: GraphQLField<any, any>,
	fragments: readonly FragmentDefinitionNode[],
): ObjectField {
	const fieldType = graphqlType.type;
	const name = field.alias?.value ?? field.name.value;
	const type = parseGraphqlOutputType(
		schema,
		fieldType,
		fragments,
		field.selectionSet,
	);

	return new ObjectField({ name, type });
}

function parseGraphqlOutputType(
	schema: GraphQLSchema,
	type: GraphQLOutputType,
	fragments: readonly FragmentDefinitionNode[],
	selectionSet?: SelectionSetNode,
): BaseType {
	if (type instanceof GraphQLEnumType) {
		if (!type.astNode) {
			return new ErrorType("No ast node found for enum type");
		}
		return parseEnumTypeDefinition(type.astNode);
	}

	if (type instanceof GraphQLScalarType) {
		const literal = parsePrimitiveType(type.name, null);
		if (literal) {
			return literal;
		}
		if (!type.astNode) {
			return new ErrorType("No ast node found for scalar type");
		}
		return parseScalarTypeDefinition(type.astNode);
	}

	if (type instanceof GraphQLObjectType) {
		if (!selectionSet) {
			return new ErrorType("No selection set passed for input object type");
		}
		return parseSelectionSet(schema, selectionSet, type.getFields(), fragments);
	}

	if (type instanceof GraphQLNonNull) {
		return parseGraphqlOutputType(schema, type.ofType, fragments, selectionSet);
	}

	if (type instanceof GraphQLList) {
		const ofType = parseGraphqlOutputType(
			schema,
			type.ofType,
			fragments,
			selectionSet,
		);
		return new ArrayType(ofType);
	}

	if (type instanceof GraphQLInterfaceType) {
		if (!selectionSet) {
			return new ErrorType("No selection set passed for input object type");
		}
		const fields = type.getFields();

		return parseSelectionSet(schema, selectionSet, fields, fragments);
	}

	return new ErrorType(`Unknown type: ${type.toString()}`);
}

function parseSelectionSet(
	schema: GraphQLSchema,
	selectionSet: SelectionSetNode,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fieldTypes: GraphQLFieldMap<any, any>,
	fragments: readonly FragmentDefinitionNode[],
): ObjectType {
	const object = new ObjectType([]);

	const flatFields = flattenSelectionSet(
		schema,
		fragments,
		selectionSet.selections,
	);

	function getFieldType(field: FieldNodeWithTypeName) {
		const inTypesAlready = fieldTypes[field.name.value];
		if (inTypesAlready) return inTypesAlready;

		if (field.typeName) {
			const type = schema.getType(field.typeName);
			if (!type) {
				throw new Error(`Type ${field.typeName} not found`);
			}

			if (
				type instanceof GraphQLObjectType ||
				type instanceof GraphQLInterfaceType
			) {
				return type.getFields()[field.name.value];
			}
		}
	}

	for (const field of flatFields) {
		const fieldType = getFieldType(field);
		if (!fieldType) {
			object.addField(
				new ObjectField({
					name: field.name.value,
					type: new ErrorType("Missing"),
				}),
			);
			continue;
		}
		const type = parseField(schema, field, fieldType, fragments);
		type.description = fieldType.description ?? undefined;
		object.addField(type);
	}

	return object;
}

interface FieldNodeWithTypeName extends FieldNode {
	typeName?: string;
}

function flattenSelectionSet(
	schema: GraphQLSchema,
	fragments: readonly FragmentDefinitionNode[],
	selectionNodes: readonly SelectionNode[],
): FieldNodeWithTypeName[] {
	const flatFields: FieldNodeWithTypeName[] = [];

	for (const selection of selectionNodes) {
		if (selection.kind === Kind.FIELD) {
			flatFields.push(selection);
		}

		if (selection.kind === Kind.FRAGMENT_SPREAD) {
			const fragmentDef = fragments.find(
				(f) => f.name.value === selection.name.value,
			);

			if (!fragmentDef) {
				throw new Error(`Fragment ${selection.name.value} not found`);
			}

			flatFields.push(
				...flattenSelectionSet(
					schema,
					fragments,
					fragmentDef.selectionSet.selections,
				).map((f) => ({
					...f,
					typeName: f.typeName ?? fragmentDef.typeCondition.name.value,
				})),
			);
		}

		if (selection.kind === Kind.INLINE_FRAGMENT) {
			flatFields.push(
				...flattenSelectionSet(
					schema,
					fragments,
					selection.selectionSet.selections,
				).map((f) => ({
					...f,
					typeName: selection.typeCondition?.name.value,
				})),
			);
		}
	}

	return flatFields;
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
		case "File":
			return new PrimitiveType("string");
		default: {
			const regularScalar = parsePrimitiveType(node.name.value, null);
			if (regularScalar) {
				return regularScalar;
			}
			return new ErrorType(`Unknown scalar type: ${node.name.value}`);
		}
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
