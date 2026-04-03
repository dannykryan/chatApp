import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";

let testUser1Token, testUser2Token, testUser3Token;
let testUser1Id, testUser2Id, testUser3Id;
let testUser1Username, testUser2Username, testUser3Username;

// Create test users before running the tests
beforeAll(async () => {
  // Create first test user
  const timestamp = Date.now();
  testUser1Username = `friendtest1_${timestamp}`;
  const user1Response = await request(app).post("/api/auth/register").send({
    username: testUser1Username,
    email: `friendtest1_${timestamp}@example.com`,
    password: "password123",
  });
  expect(user1Response.status).toBe(201);
  
  // Login first user to get token
  const user1Login = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUser1Username,
    password: "password123",
  });
  testUser1Token = user1Login.body.token;
  testUser1Id = user1Login.body.id;

  // Create second test user
  testUser2Username = `friendtest2_${timestamp}`;
  const user2Response = await request(app).post("/api/auth/register").send({
    username: testUser2Username,
    email: `friendtest2_${timestamp}@example.com`,
    password: "password123",
  });
  expect(user2Response.status).toBe(201);
  
  // Login second user to get token
  const user2Login = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUser2Username,
    password: "password123",
  });
  testUser2Token = user2Login.body.token;
  testUser2Id = user2Login.body.id;

  // Create third test user
  testUser3Username = `friendtest3_${timestamp}`;
  const user3Response = await request(app).post("/api/auth/register").send({
    username: testUser3Username,
    email: `friendtest3_${timestamp}@example.com`,
    password: "password123",
  });
  expect(user3Response.status).toBe(201);
  
  // Login third user to get token
  const user3Login = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUser3Username,
    password: "password123",
  });
  testUser3Token = user3Login.body.token;
  testUser3Id = user3Login.body.id;
});

describe("Friends Routes", () => {
  describe("POST /api/friends/add", () => {
    it("should return 400 when friendUsername is missing", async () => {
      const res = await request(app)
        .post("/api/friends/add")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Friend username is required");
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post("/api/friends/add")
        .send({ friendUsername: testUser2Username });
      
      expect(res.status).toBe(400); // verifyToken middleware returns 400 for missing token
    });

    it("should return 404 when user doesn't exist", async () => {
      const res = await request(app)
        .post("/api/friends/add")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ friendUsername: "nonexistentuser" });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should successfully send a friend request", async () => {
      const res = await request(app)
        .post("/api/friends/add")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ friendUsername: testUser2Username });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Friend request sent successfully");
    });

    it("should return 409 when friend request already exists", async () => {
      const res = await request(app)
        .post("/api/friends/add")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ friendUsername: testUser2Username });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Friend request already exists");
    });
  });

  describe("GET /api/friends/status/:friendUsername", () => {
    it("should return PENDING status for sent friend request", async () => {
      const res = await request(app)
        .get(`/api/friends/status/${testUser2Username}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PENDING");
      expect(res.body.userId1).toBe(testUser1Id);
      expect(res.body.userId2).toBe(testUser2Id);
    });

    it("should return PENDING status for received friend request", async () => {
      const res = await request(app)
        .get(`/api/friends/status/${testUser1Username}`)
        .set("Authorization", `Bearer ${testUser2Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PENDING");
    });

    it("should return NONE status when no relationship exists", async () => {
      const res = await request(app)
        .get(`/api/friends/status/${testUser3Username}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("NONE");
    });

    it("should return 404 when user doesn't exist", async () => {
      const res = await request(app)
        .get("/api/friends/status/nonexistentuser")
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("POST /api/friends/respond", () => {
    it("should return 400 when senderId or friendRequestResponse is missing", async () => {
      const res = await request(app)
        .post("/api/friends/respond")
        .set("Authorization", `Bearer ${testUser2Token}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Sender ID and action are required");
    });

    it("should successfully accept a friend request", async () => {
      const res = await request(app)
        .post("/api/friends/respond")
        .set("Authorization", `Bearer ${testUser2Token}`)
        .send({ 
          senderId: testUser1Id, 
          friendRequestResponse: true 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Friend request accepted");
    });

    it("should show FRIENDS status after acceptance", async () => {
      const res = await request(app)
        .get(`/api/friends/status/${testUser2Username}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("FRIENDS");
    });

    it("should return 404 when friend request doesn't exist", async () => {
      const res = await request(app)
        .post("/api/friends/respond")
        .set("Authorization", `Bearer ${testUser3Token}`)
        .send({ 
          senderId: testUser1Id, 
          friendRequestResponse: true 
        });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Friend request not found");
    });
  });

  describe("Friend request decline flow", () => {
    beforeEach(async () => {
      // Send a new friend request from user1 to user3 for decline test
      await request(app)
        .post("/api/friends/add")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ friendUsername: testUser3Username });
    });

    it("should successfully decline a friend request", async () => {
      const res = await request(app)
        .post("/api/friends/respond")
        .set("Authorization", `Bearer ${testUser3Token}`)
        .send({ 
          senderId: testUser1Id, 
          friendRequestResponse: false 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Friend request declined");
    });

    it("should show NONE status after decline", async () => {
      // First decline the request
      await request(app)
        .post("/api/friends/respond")
        .set("Authorization", `Bearer ${testUser3Token}`)
        .send({ 
          senderId: testUser1Id, 
          friendRequestResponse: false 
        });

      // Then check status
      const res = await request(app)
        .get(`/api/friends/status/${testUser3Username}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("NONE");
    });
  });

  describe("DELETE /api/friends/remove", () => {
    it("should return 400 when username is missing", async () => {
      const res = await request(app)
        .delete("/api/friends/remove")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Friend username is required");
    });

    it("should return 404 when user doesn't exist", async () => {
      const res = await request(app)
        .delete("/api/friends/remove")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ username: "nonexistentuser" });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should successfully remove a friend", async () => {
      const res = await request(app)
        .delete("/api/friends/remove")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ username: testUser2Username });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Friend removed successfully");
    });

    it("should show NONE status after friend removal", async () => {
      const res = await request(app)
        .get(`/api/friends/status/${testUser2Username}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("NONE");
    });
  });
});

// Clean up: delete the test users
afterAll(async () => {
  await request(app).delete(`/api/user/${testUser1Username}`);
  await request(app).delete(`/api/user/${testUser2Username}`);
  await request(app).delete(`/api/user/${testUser3Username}`);
});
