// build/metroCustomTransformer.js (or anywhere in your repo)
const upstream = require("metro-react-native-babel-transformer");
const fs = require("node:fs");
const path = require("node:path");

const BABEL_CONFIG_FILES = ["babel.config.js", ".babelrc", ".babelrc.js"];

/**
 * Find babel config file in the project root
 * @param {string} projectRoot - The project root directory
 * @returns {string | null} Path to babel config file or null if not found
 */
function findBabelConfig(projectRoot) {
	const file = BABEL_CONFIG_FILES.find((file) =>
		fs.existsSync(path.resolve(projectRoot, file)),
	);

	return file ? path.resolve(projectRoot, file) : null;
}

/**
 * Metro calls `transform` for every file it processes.
 * We forward the call to the upstream transformer, but
 * force-inject our own Babel config.
 */
module.exports.transform = ({ options, ...rest }) => {
	const babelConfigPath = findBabelConfig(options.projectRoot);

	return upstream.transform({
		...rest,
		options: {
			...options, // keep Metro’s own options
			extendsBabelConfigPath:
				babelConfigPath || require.resolve("./babel.config.js"),
		},
	});
};
