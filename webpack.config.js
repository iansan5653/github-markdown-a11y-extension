// @ts-check

"use strict";

import webpack from "webpack";
import manifest from "./manifest.json" with {type: "json"};
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const safeName = manifest.name.replace(/\s/g, "_");

const nodeModulePrefixRe = /^node:/u;


export default [
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
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".mjs": [".mjs", ".mts"],
        ".cjs": [".cjs", ".cts"]
      }
    },
    mode: "development",
  },
];
