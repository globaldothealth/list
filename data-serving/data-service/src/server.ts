import app from './index';

// Start Express server.
const server = app.listen(app.get('port'), async () => {
    console.log(`Listening on port ${app.get('port')}`);
    console.log('  Press CTRL-C to stop\n');
});

export default server;
