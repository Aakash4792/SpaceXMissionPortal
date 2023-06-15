const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");
describe("Launches API", () => {
  //Setup
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });
  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET/launches", () => {
    test("It should response with 200 success", async () => {
      const response = await request(app).get("/v1/launches");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Test POST/launches", () => {
    const completeTest = {
      mission: "USS ESN",
      rocket: "NCC 170",
      target: "Kepler-62 f",
      launchDate: "January 17,2028",
    };
    const partialTest = {
      mission: "USS ESN",
      rocket: "NCC 170",
      target: "Kepler-62 f",
    };
    const invalidTest = {
      mission: "USS ESN",
      rocket: "NCC 170",
      target: "Kepler-62 f",
      launchDate: "hekki",
    };
    test("It should response with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeTest)
        .expect("Content-Type", /json/)
        .expect(201);
      const requestDate = new Date(completeTest.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);
      expect(response.body).toMatchObject(partialTest);
    });
    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(partialTest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });
    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(invalidTest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({ error: "Invalid date" });
    });
  });
});
