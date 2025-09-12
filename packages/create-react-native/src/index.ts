import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import inquirer from "inquirer";
import fetch from "node-fetch";
import ora from "ora";
import slugify from "slugify";

interface PackageVersions {
	react: string;
	typesReact: string;
	typescript: string;
	whopReactNative: string;
}

interface ProjectAnswers {
	projectName: string;
}

interface EnvironmentAnswers {
	envVariables: string;
}

interface TemplateData {
	projectName: string;
	reactVersion: string;
	typesReactVersion: string;
	typescriptVersion: string;
	whopReactNativeVersion: string;
}

async function fetchLatestVersion(packageName: string): Promise<string> {
	try {
		const response = await fetch(
			`https://registry.npmjs.org/${packageName}/latest`,
		);
		const data = (await response.json()) as { version: string };
		return `^${data.version}`;
	} catch (error) {
		console.warn(
			chalk.yellow(
				`⚠️  Could not fetch latest version for ${packageName}, using fallback`,
			),
		);

		// Fallback versions
		const fallbacks: Record<string, string> = {
			react: "^19.1.0",
			"@types/react": "^19.1.8",
			typescript: "^5.8.3",
			"@whop/react-native": "^0.0.2",
		};

		return fallbacks[packageName] || "^1.0.0";
	}
}

async function fetchPackageVersions(): Promise<PackageVersions> {
	const spinner = ora("Fetching latest package versions...").start();

	try {
		const [react, typesReact, typescript, whopReactNative] = await Promise.all([
			fetchLatestVersion("react"),
			fetchLatestVersion("@types/react"),
			fetchLatestVersion("typescript"),
			fetchLatestVersion("@whop/react-native"),
		]);

		spinner.succeed("Package versions fetched successfully");

		return {
			react,
			typesReact,
			typescript,
			whopReactNative,
		};
	} catch (error) {
		spinner.fail("Failed to fetch package versions, using defaults");
		throw error;
	}
}

function validateProjectName(name: string): boolean | string {
	if (!name || name.trim().length === 0) {
		return "Project name is required";
	}

	if (name.length > 50) {
		return "Project name must be 50 characters or less";
	}

	// Check for invalid characters that slugify can't handle well
	if (!/^[a-zA-Z0-9\s\-_.]+$/.test(name)) {
		return "Project name contains invalid characters. Use only letters, numbers, spaces, hyphens, underscores, and dots.";
	}

	return true;
}

function validateEnvironmentVariables(envVars: string): boolean | string {
	if (!envVars || envVars.trim().length === 0) {
		return "Environment variables are required";
	}

	// Basic validation - should contain at least one = sign
	if (!envVars.includes("=")) {
		return "Environment variables should be in KEY=VALUE format";
	}

	return true;
}

async function copyTemplateFiles(
	sourcePath: string,
	targetPath: string,
	data: TemplateData,
): Promise<void> {
	const files = await fs.readdir(sourcePath, { withFileTypes: true });

	for (const file of files) {
		if (file.name === ".DS_Store") {
			// Never copy this shit.
			continue;
		}

		const sourceFilePath = path.join(sourcePath, file.name);
		const targetFilePath =
			file.name === "gitignore"
				? path.join(targetPath, ".gitignore")
				: path.join(targetPath, file.name);

		if (file.isDirectory()) {
			await fs.ensureDir(targetFilePath);
			await copyTemplateFiles(sourceFilePath, targetFilePath, data);
		} else {
			let content = await fs.readFile(sourceFilePath, "utf-8");

			// Process handlebars templates for specific file types
			if (
				file.name.endsWith(".json") ||
				file.name.endsWith(".ts") ||
				file.name.endsWith(".tsx") ||
				file.name.endsWith(".md")
			) {
				// Simple handlebars replacement
				for (const [key, value] of Object.entries(data)) {
					const regex = new RegExp(`{{${key}}}`, "g");
					content = content.replace(regex, String(value));
				}
			}

			await fs.writeFile(targetFilePath, content);
		}
	}
}

async function main(): Promise<void> {
	console.log(chalk.cyan.bold("🚀 Create Whop React Native App"));
	console.log(
		chalk.gray("A powerful tool to bootstrap your Whop React Native project\n"),
	);

	try {
		// Get project information
		const projectAnswers = await inquirer.prompt<ProjectAnswers>([
			{
				type: "input",
				name: "projectName",
				message: "What is your project name?",
				default: "my-whop-app",
				validate: validateProjectName,
				transformer: (input: string) => {
					const normalized = slugify(input, { lower: true, strict: true });
					return chalk.green(normalized);
				},
			},
		]);

		// Normalize project name
		const normalizedProjectName = slugify(projectAnswers.projectName, {
			lower: true,
			strict: true,
		});

		// Check if directory already exists
		const targetPath = path.join(process.cwd(), normalizedProjectName);

		if (await fs.pathExists(targetPath)) {
			console.error(
				chalk.red(`❌ Directory "${normalizedProjectName}" already exists!`),
			);
			console.log(
				chalk.yellow(
					"Please choose a different project name or remove the existing directory.",
				),
			);
			process.exit(1);
		}

		// Fetch latest package versions
		const versions = await fetchPackageVersions();

		// Prepare template data
		const templateData = {
			projectName: normalizedProjectName,
			reactVersion: versions.react,
			typesReactVersion: versions.typesReact,
			typescriptVersion: versions.typescript,
			whopReactNativeVersion: versions.whopReactNative,
		};

		// Create project directory
		console.log(chalk.blue("📁 Creating project directory..."));
		await fs.ensureDir(targetPath);

		// Copy template files
		const templatePath = path.join(__dirname, "..", "template");
		console.log(chalk.blue("📋 Copying template files..."));
		await copyTemplateFiles(templatePath, targetPath, templateData);

		console.log(chalk.green("✅ Template files copied successfully!\n"));

		// Success message and instructions
		console.log(chalk.green.bold("🎉 Project created successfully!"));
		console.log(chalk.cyan(`📦 Project: ${normalizedProjectName}`));
		console.log(chalk.gray(`📍 Location: ${targetPath}\n`));

		console.log(chalk.yellow.bold("📋 Next Steps:"));
		console.log(chalk.white(`1. cd ${normalizedProjectName}`));
		console.log(chalk.white("2. pnpm install"));
		console.log(chalk.white("3. Copy .env.example to .env.local and fill in your values"));
		console.log(chalk.white("4. pnpm ship"));
		console.log(
			chalk.gray("   This will build and deploy your app to see it working!\n"),
		);

		console.log(chalk.blue("🔗 Useful Commands:"));
		console.log(chalk.white("• pnpm build    - Build your app"));
		console.log(chalk.white("• pnpm upload   - Upload to Whop"));
		console.log(chalk.white("• pnpm clean    - Clean build files"));
		console.log(
			chalk.white("• pnpm ship     - Build and upload in one command\n"),
		);

		// Environment variables setup
		console.log(chalk.blue("🔧 Environment Setup"));
		console.log(chalk.yellow("To get your environment variables:"));
		console.log(chalk.underline.blue("https://whop.com/dashboard/developer"));
		console.log(chalk.gray("1. Go to the link above"));
		console.log(chalk.gray("2. Create a new app or select an existing one"));
		console.log(
			chalk.gray(
				"3. Copy the environment variables from the app settings to your .env.local file\n",
			),
		);

		console.log(chalk.green("Happy coding! 🚀"));
	} catch (error) {
		console.error(chalk.red("❌ An error occurred:"));

		if (error instanceof Error) {
			console.error(chalk.red(error.message));
		} else {
			console.error(chalk.red(String(error)));
		}

		console.log(chalk.yellow("\nIf this issue persists, please report it at:"));
		console.log(
			chalk.underline.blue("https://github.com/whopio/whop-sdk-ts/issues"),
		);

		process.exit(1);
	}
}

// Handle process interruption gracefully
process.on("SIGINT", () => {
	console.log(chalk.yellow("\n\n👋 Process interrupted. Goodbye!"));
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log(chalk.yellow("\n\n👋 Process terminated. Goodbye!"));
	process.exit(0);
});

main().catch((error) => {
	console.error(chalk.red("Unexpected error:"), error);
	process.exit(1);
});
