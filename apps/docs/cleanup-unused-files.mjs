#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = __dirname;

// Files to keep regardless (config, scripts, etc.)
const ALWAYS_KEEP = new Set([
	"docs.json",
	"v2.json",
	"v5.yaml",
	"access.yaml",
	"package.json",
	"README.md",
	"CHANGELOG.md",
	"generate-openapi-sections.js",
	"reorganize-docs.mjs",
	"cleanup-unused-files.mjs",
	"favicon.png",
	"node_modules",
	".git",
	".gitignore",
	"tsconfig.json",
	"biome.json",
	"turbo.json",
	"wrangler.jsonc",
]);

// Directories that should be kept entirely (dependencies, build artifacts, etc.)
const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	"src/rest-api",
	"src/v2-api-deprecated",
	"src/v5-api-deprecated",
	"src/graphql-sdk-deprecated",
]);

// Track all used files
const usedFiles = new Set();
const mdxFilesToProcess = new Set();

/**
 * Normalize path to be relative to docs root
 */
function normalizePath(filePath) {
	const relative = path.relative(DOCS_ROOT, path.resolve(DOCS_ROOT, filePath));
	return relative.replace(/\\/g, "/");
}

/**
 * Add a file to the used set
 */
function markAsUsed(filePath) {
	// Handle leading slash (absolute paths from docs root)
	let normalizedPath = filePath;
	if (normalizedPath.startsWith("/")) {
		normalizedPath = normalizedPath.slice(1);
	}

	const normalized = normalizePath(normalizedPath);
	if (!usedFiles.has(normalized)) {
		usedFiles.add(normalized);

		// If it's an MDX file, add it to the processing queue
		if (normalized.endsWith(".mdx")) {
			mdxFilesToProcess.add(normalized);
		}
	}
}

/**
 * Parse docs.json and extract all referenced MDX files
 */
function parseDocsJson() {
	console.log("📖 Parsing docs.json...");
	const docsJsonPath = path.join(DOCS_ROOT, "docs.json");
	const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, "utf8"));

	// Mark config files as used
	markAsUsed("docs.json");
	markAsUsed("v2.json");
	markAsUsed("v5.yaml");
	markAsUsed("access.yaml");

	// Mark logo files as used
	if (docsJson.logo) {
		if (docsJson.logo.light) markAsUsed(docsJson.logo.light);
		if (docsJson.logo.dark) markAsUsed(docsJson.logo.dark);
	}

	// Mark favicon as used
	if (docsJson.favicon) {
		markAsUsed(docsJson.favicon);
	}

	// Extract MDX pages from navigation
	function extractPages(obj) {
		if (typeof obj === "string") {
			// It's a page reference
			const mdxPath = obj.endsWith(".mdx") ? obj : `${obj}.mdx`;
			markAsUsed(mdxPath);
		} else if (Array.isArray(obj)) {
			for (const item of obj) {
				extractPages(item);
			}
		} else if (obj && typeof obj === "object") {
			// Check for pages array
			if (obj.pages) {
				extractPages(obj.pages);
			}
			// Check for groups array
			if (obj.groups) {
				extractPages(obj.groups);
			}
			// Check for tabs array
			if (obj.tabs) {
				extractPages(obj.tabs);
			}
			// Recursively check other properties
			for (const value of Object.values(obj)) {
				if (typeof value === "object") {
					extractPages(value);
				}
			}
		}
	}

	if (docsJson.navigation) {
		extractPages(docsJson.navigation);
	}

	console.log(`   Found ${usedFiles.size} files from docs.json`);
}

/**
 * Extract all references from an MDX file
 */
function parseMdxFile(relativePath) {
	const fullPath = path.join(DOCS_ROOT, relativePath);

	if (!fs.existsSync(fullPath)) {
		console.warn(`   ⚠️  File not found: ${relativePath}`);
		return;
	}

	const content = fs.readFileSync(fullPath, "utf8");
	const mdxDir = path.dirname(relativePath);

	// Patterns to match various reference types
	const patterns = [
		// Markdown images: ![alt](path)
		/!\[([^\]]*)\]\(([^)]+)\)/g,
		// HTML img tags: <img src="path" />
		/<img[^>]+src=["']([^"']+)["']/g,
		// Markdown links to other MDX files: [text](path.mdx) or [text](path)
		/\[([^\]]+)\]\(([^)]+\.mdx?)\)/g,
		// Video/media: <video src="path" /> or <source src="path" />
		/<(?:video|source)[^>]+src=["']([^"']+)["']/g,
		// CardGroup/Card href attributes
		/href=["']([^"']+)["']/g,
		// Background images or other assets in style attributes
		/url\(["']?([^"')]+)["']?\)/g,
	];

	for (const pattern of patterns) {
		let match = pattern.exec(content);
		while (match !== null) {
			// The captured path is in the last capture group
			const capturedPath = match[match.length - 1];

			// Skip external URLs
			if (
				capturedPath.startsWith("http://") ||
				capturedPath.startsWith("https://") ||
				capturedPath.startsWith("//")
			) {
				match = pattern.exec(content);
				continue;
			}

			// Skip anchors and queries
			const cleanPath = capturedPath.split("#")[0].split("?")[0];
			if (!cleanPath) {
				match = pattern.exec(content);
				continue;
			}

			// Resolve relative to the MDX file's directory
			let resolvedPath;
			if (cleanPath.startsWith("/")) {
				// Absolute path from docs root
				resolvedPath = cleanPath.slice(1);
			} else {
				// Relative path
				resolvedPath = path.join(mdxDir, cleanPath);
			}

			// Add .mdx extension if it looks like an MDX reference without extension
			if (!path.extname(resolvedPath) && !resolvedPath.includes("http")) {
				// Check if .mdx file exists
				const mdxPath = `${resolvedPath}.mdx`;
				const mdxFullPath = path.join(DOCS_ROOT, mdxPath);
				if (fs.existsSync(mdxFullPath)) {
					markAsUsed(mdxPath);
					match = pattern.exec(content);
					continue;
				}
			}

			markAsUsed(resolvedPath);
			match = pattern.exec(content);
		}
	}
}

/**
 * Process all MDX files to find references
 */
function processMdxFiles() {
	console.log("🔍 Processing MDX files for references...");

	let processedCount = 0;
	const totalToProcess = mdxFilesToProcess.size;

	// Process files until queue is empty
	while (mdxFilesToProcess.size > 0) {
		const filePath = mdxFilesToProcess.values().next().value;
		mdxFilesToProcess.delete(filePath);

		processedCount++;
		if (processedCount % 10 === 0 || processedCount === totalToProcess) {
			console.log(
				`   Processed ${processedCount}/${totalToProcess} MDX files...`,
			);
		}

		parseMdxFile(filePath);
	}

	console.log(`   Total files marked as used: ${usedFiles.size}`);
}

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir, fileList = [], relativeBase = "") {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const relativePath = relativeBase ? path.join(relativeBase, file) : file;

		// Skip directories we want to ignore
		if (fs.statSync(filePath).isDirectory()) {
			if (SKIP_DIRS.has(file) || SKIP_DIRS.has(relativePath)) {
				continue;
			}
			getAllFiles(filePath, fileList, relativePath);
		} else {
			// Skip files we always want to keep
			if (ALWAYS_KEEP.has(file)) {
				continue;
			}
			fileList.push(relativePath);
		}
	}

	return fileList;
}

/**
 * Find all unused files
 */
function findUnusedFiles() {
	console.log("🗂️  Finding all files in docs directory...");
	const allFiles = getAllFiles(DOCS_ROOT);
	console.log(`   Found ${allFiles.length} total files`);

	console.log("🔎 Identifying unused files...");
	const unusedFiles = allFiles.filter((file) => {
		const normalized = normalizePath(file);
		return !usedFiles.has(normalized);
	});

	return unusedFiles;
}

/**
 * Delete unused files
 */
function deleteUnusedFiles(unusedFiles, dryRun = true) {
	if (unusedFiles.length === 0) {
		console.log("✅ No unused files found!");
		return;
	}

	console.log(`\n📋 Found ${unusedFiles.length} unused files:`);

	// Group by extension
	const byExtension = {};
	for (const file of unusedFiles) {
		const ext = path.extname(file) || "no-extension";
		if (!byExtension[ext]) byExtension[ext] = [];
		byExtension[ext].push(file);
	}

	// Show summary by extension
	console.log("\n📊 Summary by file type:");
	for (const [ext, files] of Object.entries(byExtension).sort(
		(a, b) => b[1].length - a[1].length,
	)) {
		console.log(`   ${ext}: ${files.length} files`);
	}

	console.log("\n📄 Files to delete:");
	for (const file of unusedFiles) {
		console.log(`   - ${file}`);
	}

	if (dryRun) {
		console.log("\n⚠️  DRY RUN MODE - No files were deleted");
		console.log("   Run with --delete flag to actually delete these files");
		return;
	}

	console.log("\n🗑️  Deleting files...");
	let deletedCount = 0;
	let errorCount = 0;

	for (const file of unusedFiles) {
		try {
			const fullPath = path.join(DOCS_ROOT, file);
			fs.unlinkSync(fullPath);
			deletedCount++;
			console.log(`   ✓ Deleted: ${file}`);
		} catch (error) {
			errorCount++;
			console.error(`   ✗ Error deleting ${file}: ${error.message}`);
		}
	}

	console.log(`\n✅ Deleted ${deletedCount} files`);
	if (errorCount > 0) {
		console.log(`⚠️  ${errorCount} errors occurred`);
	}

	// Clean up empty directories
	console.log("\n🧹 Cleaning up empty directories...");
	cleanEmptyDirectories(DOCS_ROOT);
}

/**
 * Remove empty directories recursively
 */
function cleanEmptyDirectories(dir) {
	if (!fs.existsSync(dir)) return;

	const files = fs.readdirSync(dir);

	// Check subdirectories first
	for (const file of files) {
		const fullPath = path.join(dir, file);
		if (fs.statSync(fullPath).isDirectory() && !SKIP_DIRS.has(file)) {
			cleanEmptyDirectories(fullPath);
		}
	}

	// Check if directory is now empty
	const remainingFiles = fs.readdirSync(dir);
	if (remainingFiles.length === 0 && dir !== DOCS_ROOT) {
		try {
			fs.rmdirSync(dir);
			const relativePath = path.relative(DOCS_ROOT, dir);
			console.log(`   ✓ Removed empty directory: ${relativePath}`);
		} catch (error) {
			console.error(`   ✗ Error removing directory ${dir}: ${error.message}`);
		}
	}
}

/**
 * Main function
 */
function main() {
	console.log("🚀 Starting cleanup of unused files in docs...\n");

	const deleteFlag = process.argv.includes("--delete");

	// Step 1: Parse docs.json
	parseDocsJson();

	// Step 2: Process all MDX files to find references
	processMdxFiles();

	// Step 3: Find unused files
	const unusedFiles = findUnusedFiles();

	// Step 4: Delete or report
	deleteUnusedFiles(unusedFiles, !deleteFlag);

	console.log("\n✨ Done!");
}

// Run the script
main();
