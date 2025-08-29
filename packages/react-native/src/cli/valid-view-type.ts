import { readdir } from "node:fs/promises";
import path from "node:path";

export const VALID_VIEW_TYPES = [
	"experience-view",
	"discover-view",
	"dashboard-view",
] as const;

export async function getSupportedAppViewTypes(
	root: string,
): Promise<(typeof VALID_VIEW_TYPES)[number][]> {
	const views = await readdir(path.join(root, "src", "views"), {
		withFileTypes: true,
		recursive: false,
	});
	const files = views
		.filter((file) => file.isFile())
		.map((file) => file.name.split(".")[0])
		.filter((file) => !!file);

	const validViews = files.filter((file) =>
		VALID_VIEW_TYPES.includes(file as (typeof VALID_VIEW_TYPES)[number]),
	) as (typeof VALID_VIEW_TYPES)[number][];

	if (validViews.length === 0) {
		throw new Error(
			`No valid views found, please create a view in the src/views folder and name it with a valid view type: ${VALID_VIEW_TYPES.join(", ")}`,
		);
	}

	return validViews;
}
