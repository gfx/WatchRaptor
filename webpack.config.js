"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./background",
    options: "./options",
    popup: "./popup",
    injected: "./injected",
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

