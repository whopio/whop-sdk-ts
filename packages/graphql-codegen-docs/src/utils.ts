import type { Biome } from "@biomejs/js-api";

export function notEmpty<TValue>(
	value: TValue | null | undefined,
): value is TValue {
	return value !== null && value !== undefined;
}

export function kebabCaseToTitleCase(value: string) {
	return value
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function kebabCaseToCamelCase(str: string) {
	return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelCaseToSnakeCase(value: string) {
	return splitCamelCase(value).join("_").toLowerCase();
}

export function camelCaseToTitleCase(value: string) {
	return splitCamelCase(value)
		.join(" ")
		.replace(/^./, (str) => str.toUpperCase());
}

export function camelCaseToKebabCase(value: string) {
	return splitCamelCase(value).join("-").toLowerCase();
}

export function splitCamelCase(value: string) {
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

export function formatCode(code: string, biome: Biome, extension = "ts") {
	const formatted = biome.formatContent(code, {
		filePath: `file.${extension}`,
	});

	const result = biome.lintContent(formatted.content, {
		filePath: `file.${extension}`,
		fixFileMode: "SafeAndUnsafeFixes",
	});

	return result.content;
}
