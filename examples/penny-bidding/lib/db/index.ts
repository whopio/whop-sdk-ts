import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

// biome-ignore lint/style/noNonNullAssertion: always set
export const db = drizzle(process.env.POSTGRES_URL!, { schema });
