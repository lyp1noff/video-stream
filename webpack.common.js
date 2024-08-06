const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/main/index.js",
    admin: "./src/admin/index.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/main/index.html",
      favicon: "./src/favicon.ico",
      chunks: ["main"],
      filename: "public/index.html",
    }),

    new HtmlWebpackPlugin({
      template: "./src/admin/index.html",
      favicon: "./src/favicon.ico",
      chunks: ["admin"],
      filename: "protected/admin.html",
    }),

    new HtmlWebpackPlugin({
      template: "./src/login/index.html",
      chunks: ["login"],
      filename: "public/login.html",
    }),
  ],
};
