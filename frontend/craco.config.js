const fs = require("fs");
const evalSourceMap = require("react-dev-utils/evalSourceMapMiddleware");
const redirectServedPath = require("react-dev-utils/redirectServedPathMiddleware");
const noopServiceWorker = require("react-dev-utils/noopServiceWorkerMiddleware");
const webpack = require("webpack");
const CracoAlias = require("craco-alias");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add Node.js module polyfills for browser compatibility
      webpackConfig.resolve.fallback = {
        assert: require.resolve("assert"),
        buffer: require.resolve("buffer"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        zlib: require.resolve("browserify-zlib"),
        https: require.resolve("https-browserify"),
        crypto: require.resolve("crypto-browserify"),
        process: require.resolve("process/browser.js"), // Add explicit .js extension
      };

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        "crypto-js/enc-base64url": require.resolve("crypto-js/enc-base64url"),
        "crypto-js/enc-hex": require.resolve("crypto-js/enc-hex"),
        "crypto-js/enc-utf8": require.resolve("crypto-js/enc-utf8"),
        "crypto-js/sha256": require.resolve("crypto-js/sha256"),
        "lodash/get": require.resolve("lodash/get"),
      };

      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser.js",
        }),
      ];
      webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
        if (rule.oneOf instanceof Array) {
          rule.oneOf[rule.oneOf.length - 1].exclude = [
            /\.(js|mjs|jsx|cjs|ts|tsx)$/,
            /\.html$/,
            /\.json$/,
          ];
        }

        return rule;
      });

      return {
        ...webpackConfig,
        ignoreWarnings: [/Failed to parse source map/, /Deprecation/],
      };
    },
  },
  style: {
    css: {
      preprocessorOptions: {
        sass: {
          api: "modern",
        },
      },
    },
  },
  devServer: (devServerConfig, { env, paths }) => {
    // Extend the devServer configuration
    devServerConfig = {
      devMiddleware: {
        publicPath: "/ui/",
        writeToDisk: true,
      },
      onBeforeSetupMiddleware: undefined,
      onAfterSetupMiddleware: undefined,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error("webpack-dev-server is not defined");
        }

        if (fs.existsSync(paths.proxySetup)) {
          require(paths.proxySetup)(devServer.app);
        }

        middlewares.push(
          evalSourceMap(devServer),
          redirectServedPath(paths.publicUrlOrPath),
          noopServiceWorker(paths.publicUrlOrPath)
        );

        return middlewares;
      },
    };
    return devServerConfig;
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        baseUrl: ".",
        tsConfigPath: "./tsconfig.json",
      },
    },
  ],
};
