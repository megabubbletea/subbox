'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: 'development',
    entry: ['./src/main.ts', './src/main.scss'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader'
            },
            {
                test: /\.s?css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ]
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    // tell webpack that we're building for electron
    target: 'electron-main',
    node: {
        // tell webpack that we actually want a working __dirname value
        // (ref: https://webpack.js.org/configuration/node/#node-__dirname)
        __dirname: false
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css"
        })
    ]
};