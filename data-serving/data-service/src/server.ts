import app from './index';

// Start Express server.
const server = app.listen(app.get('port'), async () => {
    console.log(`Data service listening on port ${app.get('port')}`);
    console.log('  Press CTRL-C to stop\n');
});

// Set global 1-hour timeout.
server.setTimeout(60 * 60 * 1000);

export default server;
