#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the docs.json file
const docsJsonPath = path.join(__dirname, "docs.json");
const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, "utf-8"));

// Normalize a string to be ASCII/numbers with dashes
function normalize(str) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}

// Get the basename of a file path (filename without directory)
function getBasename(filePath) {
	const parts = filePath.split("/");
	return parts[parts.length - 1];
}

// Check if a page is an HTTP method (API reference)
function isHttpMethod(page) {
	if (typeof page !== "string") return false;
	const httpMethods = [
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"OPTIONS",
		"HEAD",
	];
	return httpMethods.some((method) => page.startsWith(`${method} `));
}

// Process pages recursively, handling nested groups
function processPages(pages, versionDir, tabDir, groupDir, subgroupPath = []) {
	const fileMappings = [];

	for (const page of pages) {
		if (typeof page === "string") {
			// Skip HTTP method references (API endpoints)
			if (isHttpMethod(page)) {
				continue;
			}

			// This is a file path
			const oldPath = page;
			const filename = getBasename(oldPath);

			// Ensure filename has .mdx extension
			const filenameWithExt = filename.endsWith(".mdx")
				? filename
				: `${filename}.mdx`;

			// Build the new path
			const pathParts = [
				versionDir,
				tabDir,
				groupDir,
				...subgroupPath,
				filenameWithExt,
			];
			const newPath = path.join("src", ...pathParts);

			// Store mapping
			fileMappings.push({
				oldPath: oldPath.endsWith(".mdx") ? oldPath : `${oldPath}.mdx`,
				newPath,
				oldPathWithoutExt: oldPath,
			});
		} else if (typeof page === "object" && page.group && page.pages) {
			// This is a nested group (subgroup)
			const subgroupDir = normalize(page.group);
			const nestedMappings = processPages(
				page.pages,
				versionDir,
				tabDir,
				groupDir,
				[...subgroupPath, subgroupDir],
			);
			fileMappings.push(...nestedMappings);
		}
	}

	return fileMappings;
}

// Main function to process the docs.json structure
function generateFileMappings() {
	const fileMappings = [];

	const versions = docsJson.navigation?.versions || [];

	for (const version of versions) {
		const versionName = version.version;
		const versionDir = normalize(versionName);

		for (const tab of version.tabs) {
			const tabName = tab.tab;
			const tabDir = normalize(tabName);

			// Skip tabs with openapi (these are API references without MDX files)
			if (tab.openapi) {
				console.log(`Skipping openapi tab: ${versionName} / ${tabName}`);
				continue;
			}

			for (const group of tab.groups) {
				const groupName = group.group;
				const groupDir = normalize(groupName);

				const mappings = processPages(
					group.pages,
					versionDir,
					tabDir,
					groupDir,
				);
				fileMappings.push(...mappings);
			}
		}
	}

	return fileMappings;
}

// Move files based on mappings
function moveFiles(fileMappings, dryRun = false) {
	const stats = {
		moved: 0,
		notFound: 0,
		errors: 0,
		created: [],
	};

	console.log(
		`\n${dryRun ? "DRY RUN - " : ""}Processing ${fileMappings.length} file mappings...\n`,
	);

	for (const mapping of fileMappings) {
		const oldFullPath = path.join(__dirname, mapping.oldPath);
		const newFullPath = path.join(__dirname, mapping.newPath);

		// Check if old file exists
		if (!fs.existsSync(oldFullPath)) {
			console.log(`⚠️  Not found: ${mapping.oldPath}`);
			stats.notFound++;
			continue;
		}

		try {
			if (!dryRun) {
				// Create directory if it doesn't exist
				const newDir = path.dirname(newFullPath);
				if (!fs.existsSync(newDir)) {
					fs.mkdirSync(newDir, { recursive: true });
					stats.created.push(newDir);
				}

				// Move the file
				fs.renameSync(oldFullPath, newFullPath);
			}

			console.log(`✅ ${dryRun ? "[DRY RUN] Would move" : "Moved"}:`);
			console.log(`   FROM: ${mapping.oldPath}`);
			console.log(`   TO:   ${mapping.newPath}\n`);
			stats.moved++;
		} catch (error) {
			console.error(`❌ Error moving ${mapping.oldPath}: ${error.message}\n`);
			stats.errors++;
		}
	}

	return stats;
}

// Clean up empty directories
function cleanupEmptyDirs(dirPath, dryRun = false) {
	if (!fs.existsSync(dirPath)) return;

	const entries = fs.readdirSync(dirPath, { withFileTypes: true });

	// Recursively process subdirectories
	for (const entry of entries) {
		if (entry.isDirectory()) {
			const fullPath = path.join(dirPath, entry.name);
			cleanupEmptyDirs(fullPath, dryRun);
		}
	}

	// Check if directory is empty after processing subdirectories
	const updatedEntries = fs.readdirSync(dirPath);
	if (updatedEntries.length === 0) {
		if (!dryRun) {
			fs.rmdirSync(dirPath);
		}
		console.log(
			`🗑️  ${dryRun ? "[DRY RUN] Would remove" : "Removed"} empty directory: ${path.relative(__dirname, dirPath)}`,
		);
	}
}

// Update the docs.json file with new paths
function updateDocsJson(fileMappings, dryRun = false) {
	console.log("\n📝 Updating docs.json with new paths...\n");

	// Create a mapping from old paths (without .mdx) to new paths (without src/ prefix and .mdx)
	const pathMap = {};
	for (const mapping of fileMappings) {
		const oldPathClean = mapping.oldPathWithoutExt;
		// Remove 'src/' prefix and '.mdx' extension from new path
		const newPathClean = mapping.newPath
			.replace(/^src\//, "")
			.replace(/\.mdx$/, "");
		pathMap[oldPathClean] = newPathClean;
	}

	// Deep clone the docs.json
	const updatedDocsJson = JSON.parse(JSON.stringify(docsJson));

	// Recursively update page paths
	function updatePages(pages) {
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			if (typeof page === "string") {
				// Check if this path needs to be updated
				if (pathMap[page]) {
					pages[i] = pathMap[page];
				}
			} else if (typeof page === "object" && page.group && page.pages) {
				// Recursively update nested group pages
				updatePages(page.pages);
			}
		}
	}

	// Update all versions, tabs, and groups
	const versions = updatedDocsJson.navigation?.versions || [];
	for (const version of versions) {
		for (const tab of version.tabs) {
			if (tab.groups) {
				for (const group of tab.groups) {
					if (group.pages) {
						updatePages(group.pages);
					}
				}
			}
		}
	}

	if (dryRun) {
		console.log("📄 Updated docs.json preview (first 100 lines):");
		console.log("-".repeat(80));
		const jsonString = JSON.stringify(updatedDocsJson, null, "\t");
		const lines = jsonString.split("\n");
		console.log(lines.slice(0, 100).join("\n"));
		if (lines.length > 100) {
			console.log(`\n... (${lines.length - 100} more lines)\n`);
		}
		console.log("-".repeat(80));
	} else {
		// Write the updated JSON back to file
		const outputPath = path.join(__dirname, "docs.json");
		fs.writeFileSync(
			outputPath,
			`${JSON.stringify(updatedDocsJson, null, "\t")}\n`,
		);
		console.log("✅ Updated docs.json successfully\n");
	}

	return updatedDocsJson;
}

// Main execution
function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run") || args.includes("-d");

	console.log("=".repeat(80));
	console.log("WHOP DOCS REORGANIZATION SCRIPT");
	console.log("=".repeat(80));

	if (dryRun) {
		console.log("\n🔍 Running in DRY RUN mode - no files will be moved\n");
	}

	// Generate file mappings
	console.log("📋 Generating file mappings from docs.json...\n");
	const fileMappings = generateFileMappings();

	console.log(`Found ${fileMappings.length} files to process\n`);

	// Show first few examples
	console.log("Examples of mappings:");
	console.log("-".repeat(80));
	for (let i = 0; i < Math.min(5, fileMappings.length); i++) {
		const mapping = fileMappings[i];
		console.log(`${i + 1}. ${mapping.oldPath}`);
		console.log(`   → ${mapping.newPath}\n`);
	}

	// Update docs.json
	updateDocsJson(fileMappings, dryRun);

	if (!dryRun) {
		console.log(
			"\n⚠️  This will move files. Press Ctrl+C to cancel, or wait 3 seconds...\n",
		);
		// Wait 3 seconds before proceeding
		const start = Date.now();
		while (Date.now() - start < 3000) {
			// Busy wait
		}
	}

	// Move files
	const stats = moveFiles(fileMappings, dryRun);

	// Cleanup empty directories
	console.log("\n🧹 Cleaning up empty directories...\n");
	const oldDirs = [
		"api-reference",
		"apps",
		"manage-your-business",
		"payments",
		"sdk",
		"supported-business-models",
		"whop-apps",
	];

	for (const dir of oldDirs) {
		const dirPath = path.join(__dirname, dir);
		cleanupEmptyDirs(dirPath, dryRun);
	}

	// Print summary
	console.log(`\n${"=".repeat(80)}`);
	console.log("SUMMARY");
	console.log("=".repeat(80));
	console.log(
		`✅ Files ${dryRun ? "that would be moved" : "moved"}: ${stats.moved}`,
	);
	console.log(`⚠️  Files not found: ${stats.notFound}`);
	console.log(`❌ Errors: ${stats.errors}`);
	console.log(`📁 Directories created: ${stats.created.length}`);
	console.log("=".repeat(80));

	if (dryRun) {
		console.log("\n💡 Run without --dry-run to actually move the files\n");
	} else {
		console.log("\n✨ Done!\n");
	}
}

main();
