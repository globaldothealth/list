import app, { logger } from './index';

// Start Express server.
const server = app.listen(app.get('port'), async () => {
    logger.info(`Data service listening on port ${app.get('port')}`);
    logger.info('  Press CTRL-C to stop\n');
});

// Set global 1-hour timeout.
// TODO: Make this more fine-grained once we fix
//   https://github.com/globaldothealth/list/issues/961.
server.setTimeout(60 * 60 * 1000);

export default server;
