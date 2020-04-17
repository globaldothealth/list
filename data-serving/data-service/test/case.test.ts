import request from "supertest";
import app from "../src/index";

describe("GET /cases/:id", () => {
    it("should return 200 OK", (done) => {
        request(app).get("/cases/id")
            .expect(200, done);
    });
});

describe("GET /cases", () => {
    it("should return 200 OK", (done) => {
        request(app).get("/cases")
            .expect(200, done);
    });
});