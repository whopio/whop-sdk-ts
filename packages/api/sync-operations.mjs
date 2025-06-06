import crypto from "node:crypto";
import { sync } from "graphql-ruby-client";

async function syncOperations(mode) {
	const secret = process.env.GRAPHQL_SYNC_OPERATIONS_SECRET;
	const url = process.env.GRAPHQL_SYNC_OPERATIONS_URL;

	if (!secret) throw new Error("GRAPHQL_SYNC_OPERATIONS_SECRET is not set");
	if (!url) throw new Error("GRAPHQL_SYNC_OPERATIONS_URL is not set");

	const operations = await sync({
		client: `whop-sdk-ts-${mode}`,
		outfile: "/dev/null",
		addTypename: true,
		hash: hashFunction,
		path: `{./graphql/operations/**/*.shared.graphql,./graphql/operations/**/*.${mode}.graphql,./graphql/fragments/**/*.graphql}`,
		secret: `${secret}-${mode}`,
		url,
	});

	console.log(`Uploaded ${operations.operations.length} operations`);
}

function hashFunction(str) {
	const hashed = crypto.createHash("sha256").update(str).digest("hex");
	return `sha256:${hashed}`;
}

syncOperations("server");
syncOperations("client");
