import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "metro";

export async function loadMetroConfig(projectRoot: string) {
	const file = fs.existsSync(path.join(projectRoot, "metro.config.js"));
	if (!file) return {};
	return await loadConfig({ cwd: projectRoot }, {});
}
