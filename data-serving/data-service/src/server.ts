import app from "./index";

// Start Express server.
const server = app.listen(app.get("port"), () => {
    console.log('App running at http://localhost:%d.', app.get("port"));
    console.log("  Press CTRL-C to stop\n");
});

export default server;