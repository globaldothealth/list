import pino from 'pino';

// The Pino team recommends against using pino-pretty/prettyPrint in
// production. Without a prettifier, Pino logs JSON messages. This is faster,
// and decouples log writing and reading concerns, but requires that viewers
// install pino-pretty globally and pipe all logs commands to it.
//
// Instead, prettifying programmatically, since we only use it for HTTP errors,
// as opposed to all requests.
export const logger = pino({
    prettyPrint: { colorize: process.env.NODE_ENV !== 'production' },
});
