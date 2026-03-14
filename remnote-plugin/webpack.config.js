const { resolve } = require('path');
var glob = require('glob');
var path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const { ProvidePlugin, BannerPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';
const isDevelopment = !isProd;

const fastRefresh = isDevelopment ? new ReactRefreshWebpackPlugin() : null;

const SANDBOX_SUFFIX = '-sandbox';

const config = {
  mode: isProd ? 'production' : 'development',
  entry: glob.sync('./src/widgets/**/*.tsx').reduce((obj, el) => {
    const rel = path
      .relative('src/widgets', el)
      .replace(/\.[tj]sx?$/, '')
      .replace(/\\/g, '/');

    obj[rel] = el;
    obj[`${rel}${SANDBOX_SUFFIX}`] = el;
    return obj;
  }, {}),

  output: {
    path: resolve(__dirname, 'dist'),
    filename: `[name].js`,
    publicPath: '',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|jsx|js)?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2020',
          minify: false,
        },
      },
      {
        test: /\.css$/i,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    isDevelopment
      ? undefined
      : new MiniCssExtractPlugin({
          filename: '[name].css',
        }),
    new HtmlWebpackPlugin({
      templateContent: `
      <body></body>
      <script type="text/javascript">
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      const widgetName = queryParams["widgetName"];
      if (widgetName == undefined) {document.body.innerHTML+="Widget ID not specified."}

      const s = document.createElement('script');
      s.type = "module";
      s.src = widgetName+"${SANDBOX_SUFFIX}.js";
      document.body.appendChild(s);
      </script>
    `,
      filename: 'index.html',
      inject: false,
    }),
    new ProvidePlugin({
      React: 'react',
      reactDOM: 'react-dom',
    }),
    new BannerPlugin({
      banner: (file) => {
        return !file.chunk.name.includes(SANDBOX_SUFFIX) ? 'const IMPORT_META=import.meta;' : '';
      },
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
      ],
    }),
    fastRefresh,
  ].filter(Boolean),
};

if (isProd) {
  config.optimization = {
    minimize: isProd,
    minimizer: [new EsbuildPlugin()],
  };
} else {
  // for more information, see https://webpack.js.org/configuration/dev-server
  config.devServer = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
    open: true,
    hot: true,
    compress: true,
    watchFiles: ['src/*'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    },
    // 劫持 /api/discovery 和 /manifest.json，与 StaticServer 行为一致
    setupMiddlewares: (middlewares, devServer) => {
      const instance = process.env.DISCOVERY_INSTANCE || 'default';

      devServer.app.get('/api/discovery', (req, res) => {
        res.json({
          wsPort: parseInt(process.env.DISCOVERY_WS_PORT || '29100', 10),
          configPort: parseInt(process.env.DISCOVERY_CONFIG_PORT || '29102', 10),
          instance,
          slotIndex: parseInt(process.env.DISCOVERY_SLOT_INDEX || '0', 10),
        });
      });

      // 多实例支持：非 default 实例动态修改 manifest 的 id 和 name，
      // 使 RemNote 能同时加载多个同源 Plugin（RemNote 按 id 去重）
      if (instance !== 'default') {
        devServer.app.get('/manifest.json', (req, res) => {
          const fs = require('fs');
          const manifestPath = path.resolve(__dirname, 'public', 'manifest.json');
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            manifest.id = `${manifest.id}_${instance}`;
            manifest.name = `${manifest.name} (${instance})`;
            // webpack-dev-server 的 headers 配置不覆盖自定义路由，需手动设置 CORS
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.json(manifest);
          } catch (err) {
            res.status(500).send('manifest parse error');
          }
        });
      }

      return middlewares;
    },
  };
}

module.exports = config;
