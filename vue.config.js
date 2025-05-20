module.exports = {
  // 打包时不生成map文件，减小体积
  productionSourceMap: false,
  
  // 部署应用包的基本URL
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',

  // 静态资源目录（相对于outputDir）
  assetsDir: 'static',

  // 禁用ESLint
  lintOnSave: false,

  // 开发服务器配置
  devServer: {
    port: 8080,
    open: true,
    // 代理配置用于开发环境接口请求
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },

  // 对webpack配置进行额外配置
  configureWebpack: {
    // 性能提示
    performance: {
      hints: 'warning',
      maxEntrypointSize: 50000000,
      maxAssetSize: 30000000,
      assetFilter: function(assetFilename) {
        return assetFilename.endsWith('.js')
      }
    }
  }
} 