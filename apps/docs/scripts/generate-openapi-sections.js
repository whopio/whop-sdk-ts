import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const GETTING_STARTED_SECTION = {
	group: "Introduction",
	pages: ["apps/api/getting-started"],
};

const docsJsonPath = join(import.meta.dirname, "..", "docs.json");

const docs = readFileSync(docsJsonPath, "utf8");

const docsJson = JSON.parse(docs);

const openapiTab = docsJson.navigation.versions[0].tabs.find(
	(tab) => tab.openapi,
);

const url = openapiTab.openapi;

const response = await fetch(url);

const schema = parse(await response.text());

const endpoints = schema.paths;

const groups = {};

for (const endpoint of Object.keys(endpoints)) {
	for (const method of Object.keys(endpoints[endpoint])) {
		const config = endpoints[endpoint][method];
		const group = config["x-group-title"];
		const resource = config.tags[0];
		groups[group] ||= {};
		groups[group][resource] ||= [];
		groups[group][resource].push(`${method.toUpperCase()} ${endpoint}`);
	}
}

for (const [key, value] of Object.entries(schema.webhooks)) {
	const resource = value.post.tags[0];
	let found = false;
	for (const group of Object.values(groups)) {
		if (group[resource]) {
			group[resource].push(`webhook ${key}`);
			found = true;
		}
	}
	if (!found) {
		throw new Error(
			`Webhook ${key} for resource ${resource} not found in any group`,
		);
	}
}

const groupsJson = Object.entries(groups).map(([group, resources]) => ({
	group,
	pages: Object.entries(resources).map(([group, pages]) => ({
		group,
		pages,
	})),
}));

openapiTab.groups = [GETTING_STARTED_SECTION, ...groupsJson];

const newDocs = JSON.stringify(docsJson, null, "\t");

writeFileSync(docsJsonPath, newDocs);
