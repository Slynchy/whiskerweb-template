const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require("webpack");

module.exports = {
    mode: 'development', // or 'production'
    entry: './src/index.ts', // Your entry point file
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html' // Path to your HTML template
        }),
        new CopyWebpackPlugin({
            patterns: [{
                from: 'src/assets',
                to: 'assets'
            }]
        }),
        // new webpack.NormalModuleReplacementPlugin(
        //     new RegExp(/^\..+\.js$/),
        //     function (resource) {
        //         resource.request = resource.request.replace(new RegExp(/\.js$/), '');
        //     }
        // ),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map', // For development only
};