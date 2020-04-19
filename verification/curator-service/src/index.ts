import express from 'express';

const app = express();
const port = 3000;

// Default route handler.
app.get('/', (req, res) => {
    res.send('Curator service under construction.');
});

// Start the server and listen on the default port.
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}.`);
});
