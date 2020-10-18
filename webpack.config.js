"use strict";

const path = require("path");
const webpack = require("webpack");
const _  = require("lodash");

const nodeEnv = process.env.NODE_ENV ?? "development";

const configTemplate = {
  mode: "production",

  entry: undefined, // will be set later
  output: {
    filename: undefined, // will be set later
    path: path.resolve(__dirname, "dist"),
  },
  target: ["web", "es2020"],
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".json", ".wasm"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(nodeEnv),
    }),
  ],

  optimization: {
    minimize: false,
  },

  performance: {
    hints: false,
  },
};

module.exports = [
  ((config) => {
    config.entry = "./background.ts"
    config.output.filename = "background.js";
    return config;
  })(_.cloneDeep(configTemplate)),

  ((config) => {
    config.entry = "./options.tsx"
    config.output.filename = "options.js";
    return config;
  })(_.cloneDeep(configTemplate)),

  ((config) => {
    config.entry = "./popup.tsx"
    config.output.filename = "popup.js";
    return config;
  })(_.cloneDeep(configTemplate)),
];
