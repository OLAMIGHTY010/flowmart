import express from "express";
import request from "supertest";
import mainRouter from "../../routes/index";

// Mock sub-routers with lightweight isolated routes to test mounting
jest.mock("./auth.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "auth routes mounted" })
	);
	return router;
});

jest.mock("./product.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "product routes mounted" })
	);
	return router;
});

jest.mock("./order.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "order routes mounted" })
	);
	return router;
});

jest.mock("./rider.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "rider routes mounted" })
	);
	return router;
});

jest.mock("./welfare.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "welfare routes mounted" })
	);
	return router;
});

jest.mock("./sync.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "sync routes mounted" })
	);
	return router;
});

jest.mock("./analytics.routes", () => {
	const router = require("express").Router();
	router.get("/test", (req: any, res: any) =>
		res.json({ message: "analytics routes mounted" })
	);
	return router;
});

const app = express();
app.use("/api/v1", mainRouter);

describe("Central Routing Layer Hub - Integration Tests", () => {
	it("should route /auth traffic to authRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/auth/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("auth routes mounted");
	});

	it("should route /products traffic to productRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/products/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("product routes mounted");
	});

	it("should route /orders traffic to orderRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/orders/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("order routes mounted");
	});

	it("should route /riders traffic to riderRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/riders/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("rider routes mounted");
	});

	it("should route /welfare traffic to welfareRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/welfare/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("welfare routes mounted");
	});

	it("should route /sync traffic to syncRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/sync/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("sync routes mounted");
	});

	it("should route /analytics traffic to analyticsRoutes correctly", async () => {
		const response = await request(app).get("/api/v1/analytics/test");
		expect(response.status).toBe(200);
		expect(response.body.message).toBe("analytics routes mounted");
	});
});
