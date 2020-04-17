import express from "express";

// Controllers (route handlers).
import * as homeController from "./controllers/home";
import * as caseController from "./controllers/case";

const app = express();

// Express configuration.
app.set("port", process.env.PORT || 3000);

// Configure app routes.
app.get("/", homeController.index);
app.get("/cases/:id", caseController.getCase);
app.get("/cases", caseController.listCases);

export default app;