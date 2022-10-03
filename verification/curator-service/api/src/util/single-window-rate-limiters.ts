import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 6, // Limit each IP to 6 requests per `window` (here, per 60 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function (req, res /*next*/) {
        return res.status(429).json({
            message: 'Too many failed login attempts, please try again later',
        });
    },
    skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
});

export const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
    skipSuccessfulRequests: true,
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
});

export const resetPasswordWithTokenLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
    skipSuccessfulRequests: true,
});
