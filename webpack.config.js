// webpack.config.js
module.exports = (env) => {
    let configs = [
        {
            mode: 'development',
            entry: './src/index.ts',
            target: 'node',
            devtool: 'source-map',
            resolve: {
				extensions: [".ts", ".js"]
			},
            module: {
                rules: [{
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }]
            },
            output: {
                path: __dirname + '/dist',
                filename: 'server.js'
            },
            node: {
                __dirname: false, // required for __dirname to properly resolve
            }
        }
    ];

    if (env.production) {
		configs.forEach((config) => {
			config.mode = 'production';
			delete config.devtool;
		});
	}

	return configs;
}