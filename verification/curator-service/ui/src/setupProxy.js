const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    app.use(
        /\/(api|auth)/,
        createProxyMiddleware({
            // Proxy API requests to curator service.
            target: process.env.REACT_APP_PROXY_URL || "http://localhost:3001",
            changeOrigin: true,
        })
    );
};