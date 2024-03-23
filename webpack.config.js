/**
 * @file defines the webpack configuration.
 */

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      { test: /(\.glsl|\.vert|\.frag)$/, use: 'raw-loader' }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};
