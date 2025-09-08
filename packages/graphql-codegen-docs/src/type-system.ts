import { ID_PREFIXES } from "./id-prefixes";

type PrimitiveKind =
	| "string"
	| "boolean"
	| "number"
	| "timestamp"
	| "bigint"
	| "json"
	| "id";

export interface Permission {
	action: string;
	required: boolean;
}

export abstract class BaseType {
	abstract toCode(): string;
	abstract getPermissions(forceRequired: boolean): Permission[];
}

export class ArrayType extends BaseType {
	constructor(readonly type: BaseType) {
		super();
	}

	toCode(): string {
		return `[${this.type.toCode()}]`;
	}

	getPermissions(forceRequired: boolean): Permission[] {
		return this.type.getPermissions(forceRequired);
	}
}

export class ErrorType extends BaseType {
	constructor(readonly message?: string) {
		super();
	}

	toCode(): string {
		if (this.message) {
			return `"Error(${this.message})"`;
		}
		return '"Error"';
	}

	getPermissions(): Permission[] {
		return [];
	}
}

export class ObjectField extends BaseType {
	name: string;
	isRequired: boolean;
	type: BaseType;
	description?: string;
	permissions: string[];

	constructor(input: {
		name: string;
		type: BaseType;
		isRequired?: boolean;
		description?: string;
		permissions?: string[];
	}) {
		super();
		this.isRequired = input.isRequired ?? false;
		this.name = input.name;
		this.type = input.type;
		this.permissions = input.permissions ?? [];
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

	getPermissions(forceRequired: boolean): Permission[] {
		const permissions = this.permissions.map((p) => ({
			action: p,
			required: this.isRequired || Boolean(forceRequired),
		}));
		return mergePermissions(
			this.type.getPermissions(forceRequired),
			permissions,
		);
	}
}

export class PrimitiveType extends BaseType {
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
			if (fieldName in ID_PREFIXES) {
				return `"${ID_PREFIXES[fieldName as keyof typeof ID_PREFIXES]}_${postfix}"`;
			}

			if (fieldName.endsWith("Ids") && fieldName.slice(0, -1) in ID_PREFIXES) {
				return `"${ID_PREFIXES[fieldName.slice(0, -1) as keyof typeof ID_PREFIXES]}_${postfix}"`;
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

	getPermissions(): Permission[] {
		return [];
	}
}

export class EnumType extends BaseType {
	constructor(readonly values: string[]) {
		super();
	}

	toCode(): string {
		const allOptions = this.values.join(" | ");
		return `"${this.values[0]}" /* Valid values: ${allOptions} */`;
	}

	getPermissions(): Permission[] {
		return [];
	}
}

export class ObjectType extends BaseType {
	fields: ObjectField[];

	constructor(fields: ObjectField[]) {
		super();
		this.fields = fields;
	}

	addField(field: ObjectField) {
		this.fields.push(field);
	}

	removeInputFieldIfPossible(): BaseType {
		if (this.fields.length === 1 && this.fields[0].name === "input") {
			return this.fields[0].type;
		}

		return this;
	}

	unnestSingleField(): BaseType {
		if (this.fields.length === 1) {
			return this.fields[0].type;
		}

		return this;
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

	getPermissions(forceRequired: boolean): Permission[] {
		return mergePermissions(
			...this.fields.map((f) =>
				f.getPermissions(forceRequired && this.fields.length === 1),
			),
		);
	}
}

function mergePermissions(...args: Permission[][]): Permission[] {
	const combined = args.flat().reduce<Record<string, boolean>>((obj, p) => {
		if (p.required) obj[p.action] = true;
		else if (obj[p.action] !== true) obj[p.action] = false;
		return obj;
	}, {});

	return Object.entries(combined)
		.map(([k, v]) => ({ action: k, required: v }))
		.filter((p) => p.action !== "*")
		.toSorted(comparePermissions);
}

function comparePermissions(a: Permission, b: Permission): number {
	if (a.required === b.required) return a.action.localeCompare(b.action);
	if (a.required) return -1;
	if (b.required) return 1;
	return 0;
}
