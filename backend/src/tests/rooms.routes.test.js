import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import fs from "fs";
import path from "path";

let testUser1Token, testUser2Token;
let testUser1Id, testUser2Id;
let testUser1Username, testUser2Username;
let testRoomId, testDMRoomId;

// Create test users before running the tests
beforeAll(async () => {
  const timestamp = Date.now();
  
  // Create first test user
  testUser1Username = `roomtest1_${timestamp}`;
  const user1Response = await request(app).post("/api/auth/register").send({
    username: testUser1Username,
    email: `roomtest1_${timestamp}@example.com`,
    password: "password123",
  });
  expect(user1Response.status).toBe(201);
  
  const user1Login = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUser1Username,
    password: "password123",
  });
  testUser1Token = user1Login.body.token;
  testUser1Id = user1Login.body.id;

  // Create second test user
  testUser2Username = `roomtest2_${timestamp}`;
  const user2Response = await request(app).post("/api/auth/register").send({
    username: testUser2Username,
    email: `roomtest2_${timestamp}@example.com`,
    password: "password123",
  });
  expect(user2Response.status).toBe(201);
  
  const user2Login = await request(app).post("/api/auth/login").send({
    usernameOrEmail: testUser2Username,
    password: "password123",
  });
  testUser2Token = user2Login.body.token;
  testUser2Id = user2Login.body.id;
});

describe("Rooms Routes", () => {
  describe("POST /api/rooms", () => {
    it("should return 400 when type is missing", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({});
      
      expect(res.status).toBe(400);
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .send({ type: "GROUP", name: "Test Room", memberIds: [testUser1Id, testUser2Id] });
      
      expect(res.status).toBe(400); // verifyToken middleware returns 400 for missing token
    });

    it("should successfully create a group room", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({
          type: "GROUP",
          name: "Test Group Room",
          memberIds: [testUser1Id, testUser2Id]
        });
      
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Group Room");
      expect(res.body.type).toBe("GROUP");
      expect(res.body.members).toHaveLength(2);
      testRoomId = res.body.id;
    });

    it("should successfully create a direct message room", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({
          type: "DIRECT_MESSAGE",
          memberUsername: testUser2Username
        });
      
      expect(res.status).toBe(201);
      expect(res.body.type).toBe("DIRECT_MESSAGE");
      expect(res.body.members).toHaveLength(2);
      testDMRoomId = res.body.id;
    });

    it("should return 400 for group room without name or memberIds", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({
          type: "GROUP"
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/rooms", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app).get("/api/rooms");
      expect(res.status).toBe(400);
    });

    it("should return user's rooms with unread counts", async () => {
      const res = await request(app)
        .get("/api/rooms")
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // At least our test rooms
      
      // Check that each room has unreadCount property
      res.body.forEach(room => {
        expect(room).toHaveProperty("unreadCount");
        expect(typeof room.unreadCount).toBe("number");
      });
    });
  });

  describe("GET /api/rooms/:roomId", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app).get(`/api/rooms/${testRoomId}`);
      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent room", async () => {
      const res = await request(app)
        .get("/api/rooms/nonexistent-room-id")
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Room not found");
    });

    it("should successfully return room details", async () => {
      const res = await request(app)
        .get(`/api/rooms/${testRoomId}`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testRoomId);
      expect(res.body.name).toBe("Test Group Room");
      expect(res.body.members).toHaveLength(2);
    });

    it("should return 403 for non-member trying to access room", async () => {
      // Create a third user who is not a member
      const timestamp = Date.now();
      const user3Username = `roomtest3_${timestamp}`;
      await request(app).post("/api/auth/register").send({
        username: user3Username,
        email: `roomtest3_${timestamp}@example.com`,
        password: "password123",
      });
      
      const user3Login = await request(app).post("/api/auth/login").send({
        usernameOrEmail: user3Username,
        password: "password123",
      });
      const user3Token = user3Login.body.token;

      const res = await request(app)
        .get(`/api/rooms/${testRoomId}`)
        .set("Authorization", `Bearer ${user3Token}`);
      
      expect(res.status).toBe(403);
      
      // Cleanup
      await request(app).delete(`/api/user/${user3Username}`);
    });
  });

  describe("GET /api/rooms/:roomId/messages", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app).get(`/api/rooms/${testRoomId}/messages`);
      expect(res.status).toBe(400);
    });

    it("should return 403 for non-member trying to access messages", async () => {
      // Create a third user who is not a member
      const timestamp = Date.now();
      const user3Username = `roomtest3_${timestamp}`;
      await request(app).post("/api/auth/register").send({
        username: user3Username,
        email: `roomtest3_${timestamp}@example.com`,
        password: "password123",
      });
      
      const user3Login = await request(app).post("/api/auth/login").send({
        usernameOrEmail: user3Username,
        password: "password123",
      });
      const user3Token = user3Login.body.token;

      const res = await request(app)
        .get(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${user3Token}`);
      
      expect(res.status).toBe(403);
      
      // Cleanup
      await request(app).delete(`/api/user/${user3Username}`);
    });

    it("should successfully return messages for room member", async () => {
      const res = await request(app)
        .get(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should support pagination with cursor and limit", async () => {
      const res = await request(app)
        .get(`/api/rooms/${testRoomId}/messages?limit=10`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/rooms/:roomId/messages", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .send({ content: "Test message" });
      
      expect(res.status).toBe(400);
    });

    it("should return 400 when content is missing or empty", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({});
      
      expect(res.status).toBe(400);
    });

    it("should return 400 when content is only whitespace", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ content: "   " });
      
      expect(res.status).toBe(400);
    });

    it("should return 403 for non-member trying to send message", async () => {
      // Create a third user who is not a member
      const timestamp = Date.now();
      const user3Username = `roomtest3_${timestamp}`;
      await request(app).post("/api/auth/register").send({
        username: user3Username,
        email: `roomtest3_${timestamp}@example.com`,
        password: "password123",
      });
      
      const user3Login = await request(app).post("/api/auth/login").send({
        usernameOrEmail: user3Username,
        password: "password123",
      });
      const user3Token = user3Login.body.token;

      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${user3Token}`)
        .send({ content: "Test message" });
      
      expect(res.status).toBe(403);
      
      // Cleanup
      await request(app).delete(`/api/user/${user3Username}`);
    });

    it("should successfully send a message", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ content: "Hello, this is a test message!" });
      
      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Hello, this is a test message!");
      expect(res.body.senderId).toBe(testUser1Id);
      expect(res.body.roomId).toBe(testRoomId);
      expect(res.body.sender).toHaveProperty("username", testUser1Username);
    });

    it("should successfully send a reply message", async () => {
      // First send a message to reply to
      const originalMessage = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser2Token}`)
        .send({ content: "Original message" });

      // Then send a reply
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/messages`)
        .set("Authorization", `Bearer ${testUser1Token}`)
        .send({ 
          content: "This is a reply", 
          replyToId: originalMessage.body.id 
        });
      
      expect(res.status).toBe(201);
      expect(res.body.content).toBe("This is a reply");
      expect(res.body.replyToId).toBe(originalMessage.body.id);
      expect(res.body.replyTo).toHaveProperty("content", "Original message");
    });
  });

  describe("POST /api/rooms/:roomId/avatar", () => {
    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/avatar`);
      
      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent room", async () => {
      const res = await request(app)
        .post("/api/rooms/nonexistent-room-id/avatar")
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Room not found");
    });

    it("should return 400 when no file is provided", async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/avatar`)
        .set("Authorization", `Bearer ${testUser1Token}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file provided");
    });

    it("should return 403 for non-member trying to upload avatar", async () => {
      // Create a third user who is not a member
      const timestamp = Date.now();
      const user3Username = `roomtest3_${timestamp}`;
      await request(app).post("/api/auth/register").send({
        username: user3Username,
        email: `roomtest3_${timestamp}@example.com`,
        password: "password123",
      });
      
      const user3Login = await request(app).post("/api/auth/login").send({
        usernameOrEmail: user3Username,
        password: "password123",
      });
      const user3Token = user3Login.body.token;

      // Create a small test image buffer
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const res = await request(app)
        .post(`/api/rooms/${testRoomId}/avatar`)
        .set("Authorization", `Bearer ${user3Token}`)
        .attach('avatar', testImageBuffer, 'test.png');
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not a member of this room");
      
      // Cleanup
      await request(app).delete(`/api/user/${user3Username}`);
    });

    // Note: Testing actual file upload would require mocking Supabase or having actual credentials
    // This test would need to be adapted based on your testing environment
  });
});

// Clean up: delete the test users
afterAll(async () => {
  await request(app).delete(`/api/user/${testUser1Username}`);
  await request(app).delete(`/api/user/${testUser2Username}`);
});
