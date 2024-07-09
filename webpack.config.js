const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',  // Adjust according to your entry file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',  // Specify the base path for all assets
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './src/index.html',  // Adjust according to your HTML template file
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),  // Serve static files from the 'dist' directory
    },
    compress: true,
    port: 9000,
    hot: true,  // Enable hot module replacement
    open: true,  // Open the browser when server starts
  },
};
