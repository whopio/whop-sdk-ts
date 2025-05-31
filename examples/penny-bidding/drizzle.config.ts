import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.development.local", ".env.local", ".env"] });

export default defineConfig({
	out: "./drizzle",
	schema: "./lib/db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: always set
		url: process.env.POSTGRES_URL_NON_POOLING!,
	},
});
