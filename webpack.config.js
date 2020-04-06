// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = (env) => {
    let configs = [
        {
            mode: 'development',
            entry: './src/server/index.ts',
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