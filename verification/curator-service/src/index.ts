import express from 'express';

const app = express();

// Express configuration.
app.set('port', process.env.PORT || 3000);

// Default route handler.
app.get('/', (req, res) => {
    res.send('Curator service under construction.');
});

export default app;
