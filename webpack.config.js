// @ts-check

"use strict";

const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const {name} = require("./package.json");

const nodeModulePrefixRe = /^node:/u;

module.exports = [
  {
    entry: "./src/content-script.ts",
    devtool: false,
    externals: {},
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-typescript"],
            },
          },
        },
      ],
    },
    name,
    output: {
      filename: "dist/content-script.min.js",
      library: {
        name: name.replace(/(-\w)/g, (m) => m.slice(1).toUpperCase()),
        type: "var",
      },
      path: __dirname,
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        nodeModulePrefixRe,
        (resource) => {
          const module = resource.request.replace(nodeModulePrefixRe, "");
          resource.request = module;
        }
      ),
    ],
    resolve: {
      fallback: {
        fs: false,
        os: false,
        path: false,
        util: false,
      },
      extensions: [".tsx", ".ts", ".js"],
    },
    mode: "production",
    optimization: {
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              passes: 2,
            },
          },
        }),
      ],
    },
  },
];
