module.exports = {
    // ...
    devServer: {
      open: 'Google Chrome',
      host: '0.0.0.0',
      port: 8082, // CHANGE YOUR PORT HERE!
      https: false,
      hotOnly: false,
      disableHostCheck: true,
      proxy: {
          '/api': {
              target: `http://${process.env.BackEndHost}:3000`,
              secure: false
          }
      }
    },
    // ...
  }