const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "public/[name].bundle.js",
    clean: true,
  },
  devtool: "inline-source-map",
  plugins: [
    new Dotenv({
      path: ".env.development",
    }),
  ],
});
