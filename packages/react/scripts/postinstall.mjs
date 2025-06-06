// @ts-check

import { createReadStream, createWriteStream } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const frostedCssLocation = require.resolve("frosted-ui/styles.css");

createReadStream(frostedCssLocation).pipe(
	createWriteStream(join(process.cwd(), "styles.css")),
);
