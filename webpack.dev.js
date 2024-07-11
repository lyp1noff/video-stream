const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    proxy: [
      {
        context: ['/messages'],
        target: 'http://localhost:3000',
      },
    ],
    compress: true,
    port: 9000,
    hot: true,
  },
  plugins: [
    new Dotenv({
      path: '.env.development',
    }),
  ]
});
