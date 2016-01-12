var webpack = require('webpack');
module.exports = [
  {
    entry: {
        'netflux': './src/index.js',
        'netflux.min': './src/index.js'
    },
    output: {
      libraryTarget: "umd",
      library: "nf",
      path: './dist',
      filename: '[name].js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel',
          exclude: /node_modules/,
          query: {
            cacheDirectory: true,
            presets: ['es2015']
          }
        }
      ]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        include: /\.min\.js$/,
        minimize: true
      })
    ]
  }
];
