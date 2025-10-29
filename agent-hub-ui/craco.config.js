const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Disable CSS optimization in production to avoid the CSS minimizer error
      if (env === 'production') {
        const miniCssExtractPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
        );
        if (miniCssExtractPlugin) {
          miniCssExtractPlugin.options = {
            ...miniCssExtractPlugin.options,
            ignoreOrder: true
          };
        }

        // Find and modify CSS minimizer
        const optimizationConfig = webpackConfig.optimization;
        if (optimizationConfig && optimizationConfig.minimizer) {
          optimizationConfig.minimizer = optimizationConfig.minimizer.filter(
            minimizer => minimizer.constructor.name !== 'CssMinimizerPlugin'
          );
        }
      }
      return webpackConfig;
    }
  }
};