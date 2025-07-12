const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const webpack = require('webpack');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  
  entry: {
    main: './src/plugin/main.ts',
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Skip type checking
              compilerOptions: {
                noEmit: false
              }
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/ui.html',
      filename: 'ui.html',
      inject: false, // Don't inject scripts since we have inline script
      chunks: [], // Don't include any JS chunks
    }),
    // Inject the UI HTML as a global __html__ variable
    new webpack.DefinePlugin({
      __html__: JSON.stringify(fs.readFileSync(path.resolve(__dirname, './src/ui/ui.html'), 'utf8'))
    }),
  ],
  
  // Figma plugin environment
  target: 'web',
});