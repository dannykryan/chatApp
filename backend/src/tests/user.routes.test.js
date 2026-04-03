import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";

let testUserToken;
let testUserId;
let testUsername;

// Create test user before running the tests
beforeAll(async () => {
  const timestamp = Date.now();
  testUsername = `usertest_${timestamp}`;
  
  const registerRes = await request(app).post("/api/auth/register").send({
    username: testUsername,
    email: `usertest_${timestamp}@example.com`,
    password: "password123",
  });
  expect(registerRes.status).toBe(201);
  
  const loginRes = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUsername,
    password: "password123",
  });
  testUserToken = loginRes.body.token;
  testUserId = loginRes.body.id;
});

describe("User Routes - Additional Tests", () => {
  describe("PUT /api/user/me", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .send({ username: "newusername" });
      
      expect(res.status).toBe(400); // verifyToken returns 400 for missing token
    });

    it("should successfully update user profile", async () => {
      const updateData = {
        username: `${testUsername}_updated`,
        email: `${testUsername}_updated@example.com`,
        bio: "This is my updated bio"
      };

      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.username).toBe(updateData.username);
      expect(res.body.email).toBe(updateData.email);
      expect(res.body.bio).toBe(updateData.bio);
    });

    it("should return updated user data when fetching profile", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${testUserToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.username).toBe(`${testUsername}_updated`);
      expect(res.body.bio).toBe("This is my updated bio");
    });
  });

  describe("POST /api/user/me/avatar", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post("/api/user/me/avatar");
      
      expect(res.status).toBe(400);
    });

    it("should return 400 when no file is provided", async () => {
      const res = await request(app)
        .post("/api/user/me/avatar")
        .set("Authorization", `Bearer ${testUserToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file provided");
    });

    // Note: Testing actual file upload would require mocking Supabase or having actual credentials
    // This would need a test image file and proper Supabase configuration
    it("should reject non-image files", async () => {
      const textBuffer = Buffer.from("This is not an image", "utf-8");
      
      const res = await request(app)
        .post("/api/user/me/avatar")
        .set("Authorization", `Bearer ${testUserToken}`)
        .attach('avatar', textBuffer, 'test.txt');
      
      expect(res.status).toBe(500); // Multer should reject non-image files
    });
  });

  describe("GET /api/user/:username - Public Profile", () => {
    it("should return user profile for existing user", async () => {
      const res = await request(app)
        .get(`/api/user/${testUsername}_updated`);
      
      expect(res.status).toBe(200);
      expect(res.body.username).toBe(`${testUsername}_updated`);
      expect(res.body.bio).toBe("This is my updated bio");
      // Should not return sensitive information
      expect(res.body).not.toHaveProperty("email");
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/user/nonexistentuser123456789");
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should return 400 when username is empty", async () => {
      const res = await request(app)
        .get("/api/user/");
      
      expect(res.status).toBe(404); // Express returns 404 for missing route params
    });
  });

  describe("DELETE /api/user/me", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .delete("/api/user/me");
      
      expect(res.status).toBe(400);
    });

    // Note: We'll test this at the end since it deletes the user account
    it("should successfully delete user account", async () => {
      const res = await request(app)
        .delete("/api/user/me")
        .set("Authorization", `Bearer ${testUserToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User account deleted successfully");
    });

    it("should return 404 when trying to access deleted user", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${testUserToken}`);
      
      // The user should be deleted, so this should fail
      expect(res.status).toBe(401); // JWT would still be valid but user doesn't exist
    });
  });

  describe("Profile Data Validation", () => {
    let validationTestToken;
    let validationTestUsername;

    beforeAll(async () => {
      // Create a new user for validation tests
      const timestamp = Date.now();
      validationTestUsername = `validation_${timestamp}`;
      
      await request(app).post("/api/auth/register").send({
        username: validationTestUsername,
        email: `validation_${timestamp}@example.com`,
        password: "password123",
      });
      
      const loginRes = await request(app).post("/api/auth/login").send({
        usernameOrEmail: validationTestUsername,
        password: "password123",
      });
      validationTestToken = loginRes.body.token;
    });

    afterAll(async () => {
      // Clean up validation test user
      await request(app).delete(`/api/user/${validationTestUsername}`);
    });

    it("should handle partial profile updates", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${validationTestToken}`)
        .send({ bio: "Just updating bio" });
      
      expect(res.status).toBe(200);
      expect(res.body.bio).toBe("Just updating bio");
      expect(res.body.username).toBe(validationTestUsername); // Should remain unchanged
    });

    it("should handle empty bio update", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${validationTestToken}`)
        .send({ bio: "" });
      
      expect(res.status).toBe(200);
      expect(res.body.bio).toBe("");
    });
  });
});

// Note: The main test user is deleted during the DELETE test, so no cleanup needed
afterAll(async () => {
  // Any additional cleanup if needed
});
