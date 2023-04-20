// @ts-check

"use strict";

const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const {name} = require('./package.json')

const nodeModulePrefixRe = /^node:/u;

const baseConfig = (outputFilename) => ({
  entry: "./src/scripts.js",
  devtool: false,
  externals: {},
  module: {
    rules: [
      {
        test: /\.[cm]?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  name,
  output: {
    filename: outputFilename,
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
  },
})

const devConfig = {
  ...baseConfig("dist/scripts.js"),
  mode: "development",
};

const prodConfig = {
  ...baseConfig("dist/scripts.min.js"),
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
};

module.exports = [
  devConfig,
  prodConfig,
];
