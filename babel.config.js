module.exports = api => {
	api.cache(true);

	const presets = ['@babel/preset-env', '@babel/preset-typescript'];
	const plugins = [
		'@babel/plugin-transform-runtime',
		['@babel/plugin-proposal-decorators', { legacy: true }],
		['@babel/plugin-proposal-class-properties', { loose: true }],
	];

	return {
		presets,
		plugins,
	};
};
