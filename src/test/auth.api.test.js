const request = require("supertest");

jest.mock("../model/user.model", () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    getUserById: jest.fn(),
}));

jest.mock("../model/refreshToken.model", () => ({
    createRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
}));

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock("../config/jwt", () => ({
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
}));

jest.mock("../utility/hash.utility", () => {
    return jest.fn();
});

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

jest.mock("../middleware/rateLimit.middleware", () => ({
    authLimiter: (req, res, next) => next(),
    refreshLimiter: (req, res, next) => next(),
}));

const app = require("../app");

const User = require("../model/user.model");
const refresh_token = require("../model/refreshToken.model");

const bcrypt = require("bcrypt");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../config/jwt");

const hashRefreshToken = require("../utility/hash.utility");

const mockUser = {
    id: 7,
    name: "Mahmoud",
    email: "mahmoud@it.com",
    password: "hashedPassword",
    role: "user",
};

const accessToken = "access-token-123";
const refreshToken = "refresh-token-123";
const hashedRefreshToken = "hashed-refresh-token-123";

beforeEach(() => {
    jest.clearAllMocks();

    // bcrypt
    bcrypt.hash.mockResolvedValue("hashedPassword");
    bcrypt.compare.mockResolvedValue(true);

    // JWT
    generateAccessToken.mockReturnValue(accessToken);
    generateRefreshToken.mockReturnValue(refreshToken);
    verifyRefreshToken.mockReturnValue({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
    });

    // Refresh token hash
    hashRefreshToken.mockReturnValue(hashedRefreshToken);

    // Refresh token model
    refresh_token.createRefreshToken.mockResolvedValue({
        id: 1,
        user_id: mockUser.id,
        token_hash: hashedRefreshToken,
    });

    refresh_token.getRefreshToken.mockResolvedValue({
        id: 1,
        user_id: mockUser.id,
        token_hash: hashedRefreshToken,
    });

    refresh_token.revokeRefreshToken.mockResolvedValue(true);
});

describe("POST /api/auth/register", () => {

    it("should register a new user successfully", async () => {

        User.getUserByEmail.mockResolvedValue(null);

        User.createUser.mockResolvedValue({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Mahmoud",
                email: "MAHMOUD@it.COM",
                password: "123456",
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.message).toBe(
            "User created successfully"
        );

        expect(response.body.accessToken).toBe(accessToken);

        expect(response.body.user).toEqual({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
        });

        // email should be lowercase
        expect(User.getUserByEmail).toHaveBeenCalledWith(
            "mahmoud@it.com"
        );

        // password should be hashed
        expect(bcrypt.hash).toHaveBeenCalledWith(
            "123456",
            10
        );

        expect(User.createUser).toHaveBeenCalledWith(
            "Mahmoud",
            "mahmoud@it.com",
            "hashedPassword"
        );

        expect(generateAccessToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
        });

        expect(generateRefreshToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
        });

        expect(hashRefreshToken).toHaveBeenCalledWith(
            refreshToken
        );

        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                mockUser.id,
                hashedRefreshToken
            );

        // Refresh token should be sent as cookie
        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.headers["set-cookie"][0])
            .toContain("refreshToken=");
    });

    it("should return 400 if email already exists", async () => {

        User.getUserByEmail.mockResolvedValue(mockUser);

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Mahmoud",
                email: "mahmoud@it.com",
                password: "123456",
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Email already exists"
        );

        expect(bcrypt.hash).not.toHaveBeenCalled();

        expect(User.createUser).not.toHaveBeenCalled();
    });
});

describe("POST /api/auth/login", () => {

    it("should login successfully", async () => {

        User.getUserByEmail.mockResolvedValue(mockUser);

        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "MAHMOUD@it.COM",
                password: "123456",
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.message).toBe(
            "User logged in successfully"
        );

        expect(response.body.accessToken).toBe(accessToken);

        expect(response.body.user).toEqual({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
        });

        // Email should be lowercase
        expect(User.getUserByEmail).toHaveBeenCalledWith(
            "mahmoud@it.com"
        );

        expect(bcrypt.compare).toHaveBeenCalledWith(
            "123456",
            mockUser.password
        );

        expect(generateAccessToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });

        expect(generateRefreshToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });

        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                mockUser.id,
                hashedRefreshToken
            );

        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.headers["set-cookie"][0])
            .toContain("refreshToken=");
    });

    it("should return 401 if user does not exist", async () => {

        User.getUserByEmail.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "notfound@it.com",
                password: "123456",
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid email or password"
        );

        expect(bcrypt.compare).not.toHaveBeenCalled();

        expect(generateAccessToken).not.toHaveBeenCalled();
    });

    it("should return 401 if password is incorrect", async () => {

        User.getUserByEmail.mockResolvedValue(mockUser);

        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "mahmoud@it.com",
                password: "wrongPassword",
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid email or password"
        );

        expect(generateAccessToken).not.toHaveBeenCalled();

        expect(generateRefreshToken).not.toHaveBeenCalled();

        expect(refresh_token.createRefreshToken)
            .not.toHaveBeenCalled();
    });

    it("should revoke old refresh token if cookie exists", async () => {

        User.getUserByEmail.mockResolvedValue(mockUser);

        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app)
            .post("/api/auth/login")
            .set(
                "Cookie",
                "refreshToken=old-refresh-token"
            )
            .send({
                email: "mahmoud@it.com",
                password: "123456",
            });

        expect(response.statusCode).toBe(200);

        expect(hashRefreshToken).toHaveBeenCalledWith(
            "old-refresh-token"
        );

        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                hashedRefreshToken
            );
    });
});

describe("POST /api/auth/refresh", () => {

    it("should refresh access token successfully", async () => {

        User.getUserById.mockResolvedValue(mockUser);

        const response = await request(app)
            .post("/api/auth/refresh")
            .set(
                "Cookie",
                "refreshToken=old-refresh-token"
            );

        expect(response.statusCode).toBe(200);

        expect(response.body.message).toBe(
            "User refresh successfully"
        );

        expect(response.body.accessToken).toBe(
            accessToken
        );

        expect(verifyRefreshToken).toHaveBeenCalledWith(
            "old-refresh-token"
        );

        expect(hashRefreshToken).toHaveBeenCalledWith(
            "old-refresh-token"
        );

        expect(refresh_token.getRefreshToken)
            .toHaveBeenCalledWith(
                hashedRefreshToken
            );

        expect(User.getUserById)
            .toHaveBeenCalledWith(
                mockUser.id
            );

        expect(generateAccessToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });

        // Old refresh token should be revoked
        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                hashedRefreshToken
            );

        // New refresh token should be created
        expect(generateRefreshToken).toHaveBeenCalledWith({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });

        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                mockUser.id,
                hashedRefreshToken
            );

        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.headers["set-cookie"][0])
            .toContain("refreshToken=");
    });

    it("should return 404 if refresh token is missing", async () => {

        const response = await request(app)
            .post("/api/auth/refresh");

        expect(response.statusCode).toBe(404);

        expect(response.body.message).toBe(
            "refresh token not found"
        );

        expect(verifyRefreshToken).not.toHaveBeenCalled();

        expect(refresh_token.getRefreshToken)
            .not.toHaveBeenCalled();
    });

    it("should return 401 if refresh token does not exist in database", async () => {

        refresh_token.getRefreshToken.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/auth/refresh")
            .set(
                "Cookie",
                "refreshToken=invalid-token"
            );

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid refresh token"
        );

        expect(User.getUserById).not.toHaveBeenCalled();
    });

    it("should return 404 if user does not exist", async () => {

        User.getUserById.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/auth/refresh")
            .set(
                "Cookie",
                "refreshToken=valid-token"
            );

        expect(response.statusCode).toBe(404);

        expect(response.body.message).toBe(
            "User not found"
        );
    });

    it("should return 401 if refresh token is invalid", async () => {

        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";

        verifyRefreshToken.mockImplementation(() => {
            throw error;
        });

        const response = await request(app)
            .post("/api/auth/refresh")
            .set(
                "Cookie",
                "refreshToken=invalid-token"
            );

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid or expired refresh token"
        );
    });

    it("should return 401 if refresh token is expired", async () => {

        const error = new Error("Token expired");
        error.name = "TokenExpiredError";

        verifyRefreshToken.mockImplementation(() => {
            throw error;
        });

        const response = await request(app)
            .post("/api/auth/refresh")
            .set(
                "Cookie",
                "refreshToken=expired-token"
            );

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid or expired refresh token"
        );
    });
});

describe("POST /api/auth/logout", () => {

    it("should logout successfully", async () => {

        const response = await request(app)
            .post("/api/auth/logout")
            .set(
                "Cookie",
                "refreshToken=refresh-token-123"
            );

        expect(response.statusCode).toBe(200);

        expect(response.body.msg).toBe(
            "Logged out successfully"
        );

        expect(hashRefreshToken).toHaveBeenCalledWith(
            "refresh-token-123"
        );

        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                hashedRefreshToken
            );

        // Cookie should be cleared
        expect(response.headers["set-cookie"]).toBeDefined();

        expect(
            response.headers["set-cookie"][0]
        ).toContain("refreshToken=;");
    });

    it("should return 401 if refresh token is missing", async () => {

        const response = await request(app)
            .post("/api/auth/logout");

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Refresh token not found"
        );

        expect(hashRefreshToken).not.toHaveBeenCalled();

        expect(refresh_token.revokeRefreshToken)
            .not.toHaveBeenCalled();
    });
});