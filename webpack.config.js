const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
  console.log(env);

  const environment = env.mode || 'development';
  const envFilePath = `./.env.${environment}`;

  return {
    entry: './src/index.js',
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
      new Dotenv({
        path: envFilePath,
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],
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
  };
};