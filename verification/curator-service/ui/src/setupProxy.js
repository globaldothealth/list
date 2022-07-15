const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    if (process.env.REACT_APP_PROXY_URL) {
        app.use(
            /\/(api|auth|version|env|diseaseName|feedback)/,
            createProxyMiddleware({
                // Proxy API requests to curator service.
                target: process.env.REACT_APP_PROXY_URL,
                changeOrigin: true,
            }),
        );
    }
};
