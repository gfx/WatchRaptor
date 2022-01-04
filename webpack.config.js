"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background",
    watcher: "./src/watcher",

    options: "./src/options",
    popup: "./src/popup",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  target: ["web", "es2020"],
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".json", ".wasm"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
      },
      {
        test: /\.(?:png|jpg|gif)$/i,
        type: "asset/inline",
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./public",
          to: "./",
        },
      ]
    }),
  ],

  optimization: {
    minimize: false,
  },

  performance: {
    hints: false,
  },
  devtool: 'inline-cheap-module-source-map',
};

