import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
// import { compact } from 'lodash';
import { resolve } from 'path';
import * as webpack from 'webpack';

const VERSION = JSON.stringify(require('../package.json').version);
const REVISION = JSON.stringify(
  require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
);

function root(filename) {
  return resolve(__dirname + '/' + filename);
}

const babelLoader = () => ({
  loader: 'babel-loader',
  options: {
    babelrc: false,
    presets: [
      [
        '@babel/preset-env',
        { useBuiltIns: 'entry', corejs: 3, exclude: ['transform-typeof-symbol'], targets: 'defaults'},
      ],
      ['@babel/preset-react', { development: false, runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', {legacy: true}],
      ['@babel/plugin-proposal-class-properties', { loose: false }],
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers: true,
          // By default, babel assumes babel/runtime version 7.0.0-beta.0,
          // explicitly resolving to match the provided helper functions.
          // https://github.com/babel/babel/issues/10261
          // eslint-disable-next-line import/no-internal-modules
          version: require('@babel/runtime/package.json').version,
          regenerator: true,
        },
      ],
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      'react-hot-loader/babel',

      // '@babel/plugin-syntax-dynamic-import',
    ],
  },
});

// const babelHotLoader = {
//   loader: 'babel-loader',
//   options: {
//     plugins: ['react-hot-loader/babel'],
//   },
// };

export default (env: { playground?: boolean; bench?: boolean } = {}, { mode }) => ({
  entry: [
    root('../src/polyfills.ts'),
    root(
      env.playground
        ? 'playground/hmr-playground.tsx'
        : env.bench
        ? '../benchmark/index.tsx'
        : 'index.tsx',
    ),
  ],
  output: {
    filename: 'redoc-demo.bundle.js',
    path: root('dist'),
    globalObject: 'this',
  },

  devServer: {
    contentBase: __dirname,
    watchContentBase: true,
    port: 9090,
    disableHostCheck: true,
    stats: 'minimal',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias:
      mode !== 'production'
        ? {
            'react-dom': '@hot-loader/react-dom',
          }
        : {},
  },

  node: {
    fs: 'empty',
  },

  performance: false,

  externals: {
    esprima: 'esprima',
    'node-fetch': 'null',
    'node-fetch-h2': 'null',
    yaml: 'null',
    'safe-json-stringify': 'null',
  },

  module: {
    rules: [
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
      { test: [/\.eot$/, /\.gif$/, /\.woff$/, /\.svg$/, /\.ttf$/], use: 'null-loader' },
      {
        test: /\.tsx?$/,
        use: [
          // mode !== 'production' ? babelHotLoader : undefined,
          // tsLoader(env),
          babelLoader(),
        ],
        exclude: {
          test: /node_modules/,
          not: [
            /swagger2openapi/,
            /reftools/,
            /oas-resolver/,
            /oas-kit-common/,
            /oas-schema-walker/,
          ],
        },
      },
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader',
          options: {
            sourceMap: true,
          },
        },
      },
      // {
      //   test: /node_modules\/(swagger2openapi|reftools|oas-resolver|oas-kit-common|oas-schema-walker)\/.*\.js$/,
      //   use: {
      //     loader: 'ts-loader',
      //     options: {
      //       transpileOnly: true,
      //       instance: 'ts2js-transpiler-only',
      //       compilerOptions: {
      //         allowJs: true,
      //         declaration: false,
      //       },
      //     },
      //   },
      // },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __REDOC_VERSION__: VERSION,
      __REDOC_REVISION__: REVISION,
    }),
    // new webpack.NamedModulesPlugin(),
    // new webpack.optimize.ModuleConcatenationPlugin(),
    new HtmlWebpackPlugin({
      template: env.playground
        ? 'demo/playground/index.html'
        : env.bench
        ? 'benchmark/index.html'
        : 'demo/index.html',
    }),
    new ForkTsCheckerWebpackPlugin(),
    ignore(/js-yaml\/dumper\.js$/),
    ignore(/json-schema-ref-parser\/lib\/dereference\.js/),
    ignore(/^\.\/SearchWorker\.worker$/),
    new CopyWebpackPlugin({
      patterns: ['demo/openapi.yaml'],
    }),
  ],
});

function ignore(regexp) {
  return new webpack.NormalModuleReplacementPlugin(regexp, require.resolve('lodash/noop.js'));
}
