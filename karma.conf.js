var path = require('path');
var webpack = require('webpack');

module.exports = function(config) {
  config.set({

    files: ['test/index.js'],

    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha'],

    reporters: ['spec', 'coverage-istanbul'],

    coverageIstanbulReporter: {
      reports: ['html', 'lcov', 'text-summary'],
      dir: './coverage',
      fixWebpackSourcePaths: true
    },

    webpack: {
      module: {
        rules: [
            {
              test: /\.js$/,
              include: path.resolve('src/'),
              loader: 'istanbul-instrumenter-loader'
            }
        ]
      },
      devtool: 'inline-source-map'
    },

    webpackMiddleware: {
      stats: 'errors-only',
      noInfo: true
    },

    client: {
      useIframe: false
    },

    plugins: [
      require("karma-webpack"),
      require("karma-coverage-istanbul-reporter"),
      require("karma-spec-reporter"),
      require("karma-mocha"),
      require("karma-chrome-launcher"),
      require("karma-sourcemap-loader"),
      require("istanbul-instrumenter-loader")
    ],

    browsers: ['ChromeHeadless', 'ChromeHeadlessNoSandbox'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    }

  });
};