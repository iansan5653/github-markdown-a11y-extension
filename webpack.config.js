// @ts-check

"use strict";

const webpack = require("webpack");
const {name} = require("./manifest.json");
const safeName = name.replace(/\s/g, "_");

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
    name: safeName,
    output: {
      filename: "dist/content-script.js",
      library: {
        name: safeName.replace(/(-\w)/g, (m) => m.slice(1).toUpperCase()),
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
    mode: "development",
  },
];
