const dotenv = require('dotenv');
const dotenvexpand = require('dotenv-expand');
const environment = dotenv.config();
dotenvexpand(environment);

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

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
				new webpack.DefinePlugin({ "global.GENTLY": false }), // https://github.com/node-formidable/formidable/issues/337#issuecomment-153408479

			],
			optimization: {
				// Necessary to pack mysql2, which is required for sequelize. See https://github.com/sidorares/node-mysql2/issues/1016#issuecomment-549105591
				minimizer: [
					new TerserPlugin({
						terserOptions: {
							keep_fnames: true
						}
					})
				]
			},
		};
	}

	let configs = [
		buildNodeConfig('./src/server.ts', 'server.js'),
		buildNodeConfig('./src/worker.ts', 'worker.js'),
		buildNodeConfig('./src/cronJobs.ts', 'cronJobs.js'),
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
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						// Creates `style` nodes from JS strings
						'style-loader',
						// Translates CSS into CommonJS
						'css-loader',
						// Compiles Sass to CSS
						'sass-loader',
					],
				},
				{
					test: /\.(png|svg|jpg|gif)$/,
					use: [
						'file-loader',
					],
				},
			] },
			output: {
				path: __dirname + '/dist/views',
				filename: 'index.js'
			},
			stats: 'errors-warnings',
			plugins: [
				new HtmlWebpackPlugin({
					template: './src/views/index.html',
					filename: 'index.html',
					hash: true // cache busting
				}),
				new CspHtmlWebpackPlugin({
					'base-uri': "'self'",
					'object-src': "'none'",
					'frame-src': "'self'",
					'script-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'", "www.google-analytics.com"],
					'style-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'", "fonts.googleapis.com"]
				}),
				new webpack.EnvironmentPlugin(['GA_TRACKING_ID']),
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