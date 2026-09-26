const request = require("supertest");

jest.doMock("../config/redis", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

jest.doMock("../model/user.model", () => ({
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.doMock("../utility/redis.util", () => jest.fn());

jest.doMock("../middleware/auth.middleware", () => {
  return (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (token === "Bearer admin-token") {
      req.user = {
        id: 7,
        role: "admin",
      };

      return next();
    }

    if (token === "Bearer valid-user-token") {
      req.user = {
        id: 7,
        role: "user",
      };

      return next();
    }

    if (token === "Bearer regular-user-token") {
      req.user = {
        id: 7,
        role: "user",
      };

      return res.status(403).json({
        message: "Forbidden",
      });
    }

    return res.status(401).json({
      message: "Unauthorized",
    });
  };
});

const app = require("../app");
const redis = require("../config/redis");
const User = require("../model/user.model");
const clearCacheByPattern = require("../utility/redis.util");

describe("GET /api/v1/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated users on a cache miss", async () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    User.getUsers.mockResolvedValue(users);

    const response = await request(app)
      .get("/api/v1/users?page=2&limit=2")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      users,
    });

    expect(redis.get).toHaveBeenCalledWith("users:2:2");

    expect(User.getUsers).toHaveBeenCalledWith(2, 2);

    expect(redis.setEx).toHaveBeenCalledWith(
      "users:2:2",
      60,
      JSON.stringify({ users })
    );
  });

  it("returns cached users without querying the database", async () => {
    const cachedResponse = {
      users: [{ id: 1, name: "Alice" }],
    };

    redis.get.mockResolvedValue(JSON.stringify(cachedResponse));

    const response = await request(app)
      .get("/api/v1/users?page=1&limit=10")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);

    expect(response.body).toEqual(cachedResponse);

    expect(redis.get).toHaveBeenCalledWith("users:1:10");

    expect(User.getUsers).not.toHaveBeenCalled();

    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it("uses default pagination values", async () => {
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    User.getUsers.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);

    expect(User.getUsers).toHaveBeenCalledWith(10, 0);

    expect(redis.get).toHaveBeenCalledWith("users:1:10");
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/v1/users");

    expect([401, 403]).toContain(response.status);

    expect(User.getUsers).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer regular-user-token");

    expect([401, 403]).toContain(response.status);

    expect(User.getUsers).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    redis.get.mockResolvedValue(null);

    User.getUsers.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

describe("GET /api/v1/users/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the authenticated user on a cache miss", async () => {
    const user = {
      id: 7,
      name: "Alice",
      email: "alice@example.com",
    };

    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    User.getUserById.mockResolvedValue(user);

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      user,
    });

    expect(redis.get).toHaveBeenCalledWith("user:7");

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(redis.setEx).toHaveBeenCalledWith(
      "user:7",
      60,
      JSON.stringify({ user })
    );
  });

  it("returns the user from cache without querying the database", async () => {
    const cachedUser = {
      user: {
        id: 7,
        name: "Alice",
        email: "alice@example.com",
      },
    };

    redis.get.mockResolvedValue(
      JSON.stringify(cachedUser)
    );

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBe(200);

    expect(response.body).toEqual(cachedUser);

    expect(redis.get).toHaveBeenCalledWith("user:7");

    expect(User.getUserById).not.toHaveBeenCalled();

    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it("returns 404 when the authenticated user does not exist", async () => {
    redis.get.mockResolvedValue(null);

    User.getUserById.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBe(500);

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get(
      "/api/v1/users/me"
    );

    expect([401, 403]).toContain(response.status);

    expect(redis.get).not.toHaveBeenCalled();

    expect(User.getUserById).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    redis.get.mockResolvedValue(null);

    User.getUserById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

describe("PUT /api/v1/users/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates the authenticated user's profile", async () => {
    const existingUser = {
      id: 7,
      name: "Old Name",
      email: "old@example.com",
    };

    const updatedUser = {
      id: 7,
      name: "New Name",
      email: "new@example.com",
    };

    User.getUserById.mockResolvedValue(existingUser);

    User.updateUser.mockResolvedValue(updatedUser);

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        name: "New Name",
        email: "new@example.com",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "User updated successfully",
      user: updatedUser,
    });

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(User.updateUser).toHaveBeenCalledWith(
      7,
      "New Name",
      "new@example.com"
    );

    expect(redis.del).toHaveBeenCalledWith("user:7");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "users:*"
    );
  });

  it("keeps existing values when only one field is updated", async () => {
    const existingUser = {
      id: 7,
      name: "Existing Name",
      email: "old@example.com",
    };

    const updatedUser = {
      id: 7,
      name: "Existing Name",
      email: "new@example.com",
    };

    User.getUserById.mockResolvedValue(existingUser);

    User.updateUser.mockResolvedValue(updatedUser);

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        email: "new@example.com",
      });

    expect(response.status).toBe(200);

    expect(User.updateUser).toHaveBeenCalledWith(
      7,
      "Existing Name",
      "new@example.com"
    );

    expect(redis.del).toHaveBeenCalledWith("user:7");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "users:*"
    );
  });

  it("returns 404 when the authenticated user does not exist", async () => {
    User.getUserById.mockResolvedValue(null);

    const response = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        name: "New Name",
        email: "new@example.com",
      });

    expect(response.status).toBe(500);

    expect(User.updateUser).not.toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .put("/api/v1/users/me")
      .send({
        name: "New Name",
      });

    expect([401, 403]).toContain(response.status);

    expect(User.getUserById).not.toHaveBeenCalled();

    expect(User.updateUser).not.toHaveBeenCalled();
  });

  it("passes update errors to the error handler", async () => {
    User.getUserById.mockResolvedValue({
      id: 7,
      name: "Existing Name",
      email: "old@example.com",
    });

    User.updateUser.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token")
      .send({
        name: "New Name",
      });

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/users/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes the authenticated user and clears caches", async () => {
    const deletedUser = {
      id: 7,
      email: "alice@example.com",
    };

    User.deleteUser.mockResolvedValue(deletedUser);

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "User deleted successfully",
    });

    expect(User.deleteUser).toHaveBeenCalledWith(7);

    expect(redis.del).toHaveBeenCalledWith("user:7");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "users:*"
    );
  });

  it("returns 404 when the user does not exist", async () => {
    User.deleteUser.mockResolvedValue(null);

    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBe(500);

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(
      "/api/v1/users/me"
    );

    expect([401, 403]).toContain(response.status);

    expect(User.deleteUser).not.toHaveBeenCalled();
  });

  it("passes deletion errors to the error handler", async () => {
    User.deleteUser.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });

  it("does not clear caches when Redis invalidation fails", async () => {
    User.deleteUser.mockResolvedValue({
      id: 7,
      email: "alice@example.com",
    });

    redis.del.mockRejectedValue(
      new Error("Redis failure")
    );

    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", "Bearer valid-user-token");

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
});