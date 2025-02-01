const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "public/[name].[contenthash].bundle.js",
    assetModuleFilename: 'public/[hash][ext][query]',
    clean: true,
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new Dotenv({
      path: ".env.production",
    }),
  ],
});
