// webpack.config.js
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (env) => {
    function buildNodeConfig(entry, output, dirname) {
        return {
            mode: 'development',
            entry,
            target: 'node',
            devtool: 'source-map',
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx']
            },
            module: {
                rules: [
                    { // Include TypeScript files in the TypeScript loader
                        test: /\.ts(x?)$/,
                        include: /src/,
                        use: [{ loader: 'ts-loader' }]
                    }
                ]
            },
            output: {
                path: __dirname + '/dist',
                filename: output
            },
            node: {
                // required for __dirname to properly resolve
                // Also required for `bull` to work, see https://github.com/OptimalBits/bull/issues/811
				__dirname: true, // required for __dirname to properly resolve
			},
			stats: 'errors-only', // lots of warning noise from sequelize
            externals: ['pg', 'sqlite3', 'tedious', 'pg-hstore'], // Work-around for sequelize: https://github.com/sequelize/sequelize/issues/7509#issuecomment-616235834
            plugins: [
                new webpack.DefinePlugin({ "global.GENTLY": false }) // https://github.com/node-formidable/formidable/issues/337#issuecomment-153408479
            ],
        };
    }

	let configs = [
        buildNodeConfig('./src/server.ts', 'server.js'),
        buildNodeConfig('./src/worker.ts', 'worker.js'),
		{
			mode: 'development',
			entry: './src/views/index.tsx',
			target: 'web',
			devtool: 'source-map',
			resolve: {
				extensions: [".ts", ".tsx", ".js", ".jsx"]
			},
			module: { rules: [
			{ // Include TypeScript files in the TypeScript loader
				test: /\.ts(x?)$/,
				include: /src/,
				use: [{ loader: 'ts-loader' }]
			}] },
			output: {
				path: __dirname + '/dist/views',
				filename: 'index.js'
			},
			stats: 'errors-warnings',
			plugins: [
				new HtmlWebpackPlugin({
					template: './src/views/index.html',
					filename: 'index.html'
				})
			]
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