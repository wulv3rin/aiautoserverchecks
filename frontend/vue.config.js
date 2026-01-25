module.exports = {
  // ...
  devServer: {
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 8082,
    server: 'http',
    proxy: {
      '/api': {
        target: `http://${process.env.BackEndHost}:3000`,
        secure: false
      }
    }
  },
  // ...
}