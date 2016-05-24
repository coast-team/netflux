var webpack = require('webpack');
module.exports = [
  {
    entry: [
        'babel-polyfill',
        './src/index.js'
    ],
    output: {
      libraryTarget: "umd",
      library: "netflux",
      path: './dist',
      filename: 'netflux.es5.js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel',
          exclude: /node_modules/,
          query: {
            presets: ['es2015']
          }
        }
      ]
    }
  }
];
