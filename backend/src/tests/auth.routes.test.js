process.env.JWT_SECRET = "test-secret";

import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";

describe("Auth routes", () => {
  it("POST /api/auth/register returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/login returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});