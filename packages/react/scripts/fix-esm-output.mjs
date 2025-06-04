// @ts-check

import { readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { parseFile, print } from "@swc/core";

/**
 * @param {string} dir
 */
async function fixDirectory(dir) {
	const filesAndDirs = await readdir(dir);
	for (const fileOrDir of filesAndDirs) {
		const fileOrDirPath = join(dir, fileOrDir);
		const stats = await stat(fileOrDirPath);
		if (stats.isDirectory()) {
			await fixDirectory(fileOrDirPath);
		} else if (stats.isFile() && fileOrDirPath.endsWith(".mjs")) {
			await fixFile(fileOrDirPath);
		}
	}
}

/**
 * @param {string} filePath
 */
async function fixFile(filePath) {
	const ast = await parseFile(filePath, {
		syntax: "ecmascript",
	});

	ast.body = await Promise.all(
		ast.body.map(async (item) => {
			switch (item.type) {
				case "ImportDeclaration": {
					const importedPath = item.source.value;
					if (!importedPath.startsWith(".")) return item;
					const newPath = await fixSinglePath(filePath, importedPath);
					item.source.value = newPath;
					item.source.raw = `"${newPath}"`;
					return item;
				}
				case "ExportNamedDeclaration": {
					if (!item.source?.value) return item;
					const exportedPath = item.source.value;
					if (!exportedPath.startsWith(".")) return item;
					const newPath = await fixSinglePath(filePath, exportedPath);
					item.source.value = newPath;
					item.source.raw = `"${newPath}"`;
					return item;
				}
				case "ExportAllDeclaration": {
					if (!item.source?.value) return item;
					const exportedPath = item.source.value;
					if (!exportedPath.startsWith(".")) return item;
					const newPath = await fixSinglePath(filePath, exportedPath);
					item.source.value = newPath;
					item.source.raw = `"${newPath}"`;
					return item;
				}
			}
			return item;
		}),
	);

	const { code } = await print(ast);
	await writeFile(filePath, code);
}

/**
 * @param {string} path
 */
async function exists(path) {
	try {
		const stats = await stat(path);
		return stats.isFile();
	} catch {
		return false;
	}
}

/**
 * @param {string} importer
 * @param {string} importedPath
 */
async function fixSinglePath(importer, importedPath) {
	const resolvedPath = join(dirname(importer), importedPath);
	const baseFile = `${resolvedPath}.mjs`;
	const baseIndex = `${resolvedPath}/index.mjs`;

	if (await exists(baseFile)) {
		return `${importedPath}.mjs`;
	}

	if (await exists(baseIndex)) {
		return `${importedPath}/index.mjs`;
	}

	throw new Error(`Could not find ${importedPath} in ${importer}`);
}

await fixDirectory(join(process.cwd(), "dist"));
