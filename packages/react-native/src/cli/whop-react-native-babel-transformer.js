// build/metroCustomTransformer.js (or anywhere in your repo)
const upstream = require("metro-react-native-babel-transformer");

/**
 * Metro calls `transform` for every file it processes.
 * We forward the call to the upstream transformer, but
 * force-inject our own Babel config.
 */
module.exports.transform = ({ options, ...rest }) => {
	return upstream.transform({
		...rest,
		options: {
			...options, // keep Metro’s own options
			extendsBabelConfigPath: require.resolve("./babel.config.js"),
		},
	});
};
