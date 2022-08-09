import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 minutes
    max: 4, // Limit each IP to 4 requests per `window` (here, per 20 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function (req, res /*next*/) {
        return res.status(429).json({
            message: 'Too many failed login attempts, please try again later',
        });
    },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 4,
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
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 4,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 4,
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
    max: 4,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            message:
                'You sent too many requests. Please wait a while then try again',
        });
    },
});
