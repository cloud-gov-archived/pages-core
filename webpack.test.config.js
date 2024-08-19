const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const { getFeatureFlags } = require('./webpack-utils');

const RESOURCE_GENERATOR = {
  filename: 'images/[contenthash][ext]',
  publicPath: '/',
};

const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
};

const config = {
  mode: 'production',
  entry: {
    bundle: './frontend/main.jsx',
    report: './frontend/mainReport.jsx',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components|public\/)/,
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: { filter: (url) => !url.includes('images') },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: process.env.NODE_ENV === 'development',
              postcssOptions: {
                plugins: [autoprefixer],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true,
                loadPath: path.resolve(__dirname, 'node_modules/uswds/src/stylesheets/'),
              },
            },
          },
        ],
      },
      {
        test: /\.(gif|png|jpe?g|ttf|woff2?|eot)$/i,
        type: 'asset/resource',
        generator: RESOURCE_GENERATOR,
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // For .svg files in public/images/icons/, use the @svgr/webpack loader
            // so that they can be loaded as React components
            include: path.resolve(__dirname, 'public/images/icons'),
            use: [{ loader: '@svgr/webpack', options: { svgoConfig } }],
          },
          {
            // For all other .svg files, fallback to asset/resource
            type: 'asset/resource',
            generator: RESOURCE_GENERATOR,
          },
        ],
      },
    ],
  },
  plugins: [
    // Make sure this is the first plugin!!!
    new MiniCssExtractPlugin({ filename: `styles/styles${process.env.NODE_ENV === 'production' ? '.[contenthash]' : ''}.css` }),
    // When webpack bundles moment, it includes all of its locale files,
    // which we don't need, so we'll use this plugin to keep them out of the
    // bundle
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
    new WebpackManifestPlugin({
      fileName: '../webpack-manifest.json',
      publicPath: 'dist/',
    }),
    new webpack.EnvironmentPlugin([
      ...getFeatureFlags(process.env),
      'APP_HOSTNAME',
      'PRODUCT',
      'PROXY_DOMAIN',
    ]),
  ],
};

if (process.env.NODE_ENV === 'development') {
  config.devtool = 'inline-source-map';
  config.stats = 'minimal';
}

module.exports = config;
