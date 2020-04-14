// webpack.config.js
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
    let configs = [
        {
            mode: 'development',
            entry: './src/server/index.ts',
            target: 'node',
            devtool: 'source-map',
            resolve: {
				extensions: [".ts", ".tsx", ".js", ".jsx"]
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
            },
            plugins: [
                new webpack.DefinePlugin({ 'global.GENTLY': false }), // https://github.com/node-formidable/formidable/issues/452#issuecomment-587501695
            ],
            externals: ['pg', 'sqlite3', 'tedious', 'pg-hstore'] // https://github.com/sequelize/sequelize/issues/7509
        },
        {
            mode: 'development',
            entry: './src/client/index.tsx',
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
            { // Include css files in the css loader
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }] },
            output: {
                path: __dirname + '/dist/static',
				filename: 'index.js'
            },
            plugins: [
				new HtmlWebpackPlugin({
					template: './src/client/index.html',
					filename: 'index.html'
				})
            ],
            externals: ['pg', 'sqlite3', 'tedious', 'pg-hstore'] // https://github.com/sequelize/sequelize/issues/7509
        },
        {
            mode: 'development',
            entry: './src/admin/index.tsx',
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
            { // Include css files in the css loader
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }] },
            output: {
                path: __dirname + '/dist/static',
				filename: 'admin.js'
            },
            plugins: [
				new HtmlWebpackPlugin({
					template: './src/admin/index.html',
					filename: 'admin.html'
				})
            ],
            optimization: {
                minimizer: [new TerserPlugin({ terserOptions: { mangle: false } })] // https://github.com/mysqljs/mysql/issues/1655#issuecomment-484530654
            },
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