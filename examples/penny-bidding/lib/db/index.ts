import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const DEFAULT_POSTGRES_URL =
	"postgres://postgres:postgres@localhost:5432/postgres";

export const db = drizzle(process.env.POSTGRES_URL ?? DEFAULT_POSTGRES_URL, {
	schema,
});
