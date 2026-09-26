const {
    register,
    login,
    refresh,
    logout
} = require("../controllers/auth.controller");

const User = require("../model/user.model");
const refresh_token = require("../model/refreshToken.model");

const {
    refreshCookieOptions,
    clearRefreshCookieOptions
} = require("../config/cookie");

const {
    user
} = require("./mock/user.mock");

const bcrypt = require("bcrypt");

const {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken
} = require("../config/jwt");

const hashRefreshToken = require("../utility/hash.utility");

const logger = require("../config/logger");


// =====================================================
// MOCKS
// =====================================================

jest.mock("../model/user.model");

jest.mock("../model/refreshToken.model");

jest.mock("bcrypt");

jest.mock("../config/jwt", () => ({
    verifyRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
}));

jest.mock("../utility/hash.utility");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));


// =====================================================
// REGISTER CONTROLLER
// =====================================================

describe("Register Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            body: {
                name: "Mahmoud",
                email: "TEST@TEST.COM",
                password: "123456"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn()
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should register user successfully", async () => {

        User.getUserByEmail
            .mockResolvedValue(null);

        bcrypt.hash
            .mockResolvedValue("hashedPassword");

        User.createUser
            .mockResolvedValue(user);

        generateAccessToken
            .mockReturnValue("access-token");

        generateRefreshToken
            .mockReturnValue("refresh-token");

        hashRefreshToken
            .mockReturnValue("hashed-refresh");

        refresh_token.createRefreshToken
            .mockResolvedValue();


        await register(req, res, next);


        expect(User.getUserByEmail)
            .toHaveBeenCalledTimes(1);

        expect(User.getUserByEmail)
            .toHaveBeenCalledWith(
                "test@test.com"
            );


        expect(bcrypt.hash)
            .toHaveBeenCalledTimes(1);

        expect(bcrypt.hash)
            .toHaveBeenCalledWith(
                "123456",
                10
            );


        expect(User.createUser)
            .toHaveBeenCalledTimes(1);

        expect(User.createUser)
            .toHaveBeenCalledWith(
                "Mahmoud",
                "test@test.com",
                "hashedPassword"
            );


        expect(generateAccessToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email
            });


        expect(generateRefreshToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email
            });


        expect(hashRefreshToken)
            .toHaveBeenCalledWith(
                "refresh-token"
            );


        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                user.id,
                "hashed-refresh"
            );


        expect(res.cookie)
            .toHaveBeenCalledWith(
                "refreshToken",
                "refresh-token",
                refreshCookieOptions
            );


        expect(res.status)
            .toHaveBeenCalledWith(201);


        expect(res.json)
            .toHaveBeenCalledWith({
                message: "User created successfully",
                accessToken: "access-token",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });


        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Email Already Exists
    // =====================================

    test("should return error if email already exists", async () => {

        User.getUserByEmail
            .mockResolvedValue(user);


        await register(req, res, next);


        expect(User.createUser)
            .not.toHaveBeenCalled();


        expect(bcrypt.hash)
            .not.toHaveBeenCalled();


        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Email already exists",
                    statusCode: 400
                })
            );
    });


    // =====================================
    // bcrypt Error
    // =====================================

    test("should call next when bcrypt hash fails", async () => {

        const error = new Error("Hash Failed");


        User.getUserByEmail
            .mockResolvedValue(null);

        bcrypt.hash
            .mockRejectedValue(error);


        await register(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);


        expect(User.createUser)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Create User Error
    // =====================================

    test("should call next when create user fails", async () => {

        const error = new Error("Database Error");


        User.getUserByEmail
            .mockResolvedValue(null);

        bcrypt.hash
            .mockResolvedValue("hashedPassword");

        User.createUser
            .mockRejectedValue(error);


        await register(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

});


// =====================================================
// LOGIN CONTROLLER
// =====================================================

describe("Login Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            body: {
                email: "TEST@TEST.COM",
                password: "123456"
            },
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should login user successfully", async () => {

        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockResolvedValue(true);

        generateAccessToken
            .mockReturnValue("access-token");

        generateRefreshToken
            .mockReturnValue("refresh-token");

        hashRefreshToken
            .mockReturnValue("hashed-refresh");

        refresh_token.createRefreshToken
            .mockResolvedValue();


        await login(req, res, next);


        expect(User.getUserByEmail)
            .toHaveBeenCalledWith(
                "test@test.com"
            );


        expect(bcrypt.compare)
            .toHaveBeenCalledWith(
                "123456",
                user.password
            );


        expect(generateAccessToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email,
                role: user.role
            });


        expect(generateRefreshToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email,
                role: user.role
            });


        expect(hashRefreshToken)
            .toHaveBeenCalledWith(
                "refresh-token"
            );


        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                user.id,
                "hashed-refresh"
            );


        expect(res.cookie)
            .toHaveBeenCalledWith(
                "refreshToken",
                "refresh-token",
                refreshCookieOptions
            );


        expect(res.status)
            .toHaveBeenCalledWith(200);


        expect(res.json)
            .toHaveBeenCalledWith({
                message: "User logged in successfully",
                accessToken: "access-token",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });


        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // User Not Found
    // =====================================

    test("should return error if user does not exist", async () => {

        User.getUserByEmail
            .mockResolvedValue(null);


        await login(req, res, next);


        expect(bcrypt.compare)
            .not.toHaveBeenCalled();


        expect(generateAccessToken)
            .not.toHaveBeenCalled();


        expect(generateRefreshToken)
            .not.toHaveBeenCalled();


        expect(refresh_token.createRefreshToken)
            .not.toHaveBeenCalled();


        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Invalid email or password",
                    statusCode: 401
                })
            );
    });


    // =====================================
    // Wrong Password
    // =====================================

    test("should return error if password is wrong", async () => {

        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockResolvedValue(false);


        await login(req, res, next);


        expect(bcrypt.compare)
            .toHaveBeenCalledWith(
                "123456",
                user.password
            );


        expect(generateAccessToken)
            .not.toHaveBeenCalled();


        expect(generateRefreshToken)
            .not.toHaveBeenCalled();


        expect(refresh_token.createRefreshToken)
            .not.toHaveBeenCalled();


        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Invalid email or password",
                    statusCode: 401
                })
            );
    });


    // =====================================
    // Old Refresh Token
    // =====================================

    test("should revoke old refresh token before creating a new one", async () => {

        req.cookies = {
            refreshToken: "old-refresh-token"
        };


        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockResolvedValue(true);

        generateAccessToken
            .mockReturnValue("access-token");

        generateRefreshToken
            .mockReturnValue("new-refresh-token");


        hashRefreshToken
            .mockReturnValueOnce("old-hashed-token")
            .mockReturnValueOnce("new-hashed-token");


        refresh_token.revokeRefreshToken
            .mockResolvedValue();

        refresh_token.createRefreshToken
            .mockResolvedValue();


        await login(req, res, next);


        expect(hashRefreshToken)
            .toHaveBeenNthCalledWith(
                1,
                "old-refresh-token"
            );


        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                "old-hashed-token"
            );


        expect(hashRefreshToken)
            .toHaveBeenNthCalledWith(
                2,
                "new-refresh-token"
            );


        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                user.id,
                "new-hashed-token"
            );


        expect(res.cookie)
            .toHaveBeenCalledWith(
                "refreshToken",
                "new-refresh-token",
                refreshCookieOptions
            );


        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // bcrypt.compare Error
    // =====================================

    test("should call next when password comparison fails", async () => {

        const error = new Error("Compare Failed");


        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockRejectedValue(error);


        await login(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // Create Refresh Token Error
    // =====================================

    test("should call next when creating refresh token fails", async () => {

        const error = new Error("Database Error");


        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockResolvedValue(true);

        generateAccessToken
            .mockReturnValue("access-token");

        generateRefreshToken
            .mockReturnValue("refresh-token");

        hashRefreshToken
            .mockReturnValue("hashed-refresh");


        refresh_token.createRefreshToken
            .mockRejectedValue(error);


        await login(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // Revoke Refresh Token Error
    // =====================================

    test("should call next when revoking old refresh token fails", async () => {

        req.cookies = {
            refreshToken: "old-refresh-token"
        };


        User.getUserByEmail
            .mockResolvedValue(user);

        bcrypt.compare
            .mockResolvedValue(true);

        generateAccessToken
            .mockReturnValue("access-token");

        hashRefreshToken
            .mockReturnValue("old-hashed-token");


        const error = new Error("Revoke Failed");


        refresh_token.revokeRefreshToken
            .mockRejectedValue(error);


        await login(req, res, next);


        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                "old-hashed-token"
            );


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

});


// =====================================================
// REFRESH CONTROLLER
// =====================================================

describe("Refresh Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should refresh token successfully", async () => {

        req.cookies = {
            refreshToken: "old-refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
                id: user.id
            });


        hashRefreshToken
            .mockReturnValueOnce("old-hashed-token")
            .mockReturnValueOnce("new-hashed-token");


        refresh_token.getRefreshToken
            .mockResolvedValue({
                id: 1,
                user_id: user.id,
                token_hash: "old-hashed-token"
            });


        User.getUserById
            .mockResolvedValue(user);


        generateAccessToken
            .mockReturnValue("new-access-token");


        refresh_token.revokeRefreshToken
            .mockResolvedValue();


        generateRefreshToken
            .mockReturnValue("new-refresh-token");


        refresh_token.createRefreshToken
            .mockResolvedValue();


        await refresh(req, res, next);


        // Verify token
        expect(verifyRefreshToken)
            .toHaveBeenCalledTimes(1);

        expect(verifyRefreshToken)
            .toHaveBeenCalledWith(
                "old-refresh-token"
            );


        // Hash old token
        expect(hashRefreshToken)
            .toHaveBeenNthCalledWith(
                1,
                "old-refresh-token"
            );


        // Check token in database
        expect(refresh_token.getRefreshToken)
            .toHaveBeenCalledWith(
                "old-hashed-token"
            );


        // Get user
        expect(User.getUserById)
            .toHaveBeenCalledWith(
                user.id
            );


        // Generate access token
        expect(generateAccessToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email,
                role: user.role
            });


        // Revoke old token
        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                "old-hashed-token"
            );


        // Generate new refresh token
        expect(generateRefreshToken)
            .toHaveBeenCalledWith({
                id: user.id,
                email: user.email,
                role: user.role
            });


        // Hash new token
        expect(hashRefreshToken)
            .toHaveBeenNthCalledWith(
                2,
                "new-refresh-token"
            );


        // Save new token
        expect(refresh_token.createRefreshToken)
            .toHaveBeenCalledWith(
                user.id,
                "new-hashed-token"
            );


        // Cookie
        expect(res.cookie)
            .toHaveBeenCalledWith(
                "refreshToken",
                "new-refresh-token",
                refreshCookieOptions
            );


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "User refresh successfully",
                accessToken: "new-access-token"
            });


        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // No Refresh Token
    // =====================================

    test("should return error if refresh token is missing", async () => {

    req.cookies = {};

    await refresh(req, res, next);

    expect(verifyRefreshToken)
        .not.toHaveBeenCalled();

    expect(refresh_token.getRefreshToken)
        .not.toHaveBeenCalled();

    expect(User.getUserById)
        .not.toHaveBeenCalled();

    expect(next)
        .toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.message)
        .toBe("refresh token not found");

    expect(error.statusCode)
        .toBe(404);
});


    // =====================================
    // Invalid Refresh Token
    // =====================================

    test("should return error if refresh token is not in database", async () => {

        req.cookies = {
            refreshToken: "invalid-refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
                id: user.id
            });


        hashRefreshToken
            .mockReturnValue(
                "invalid-hashed-token"
            );


        refresh_token.getRefreshToken
            .mockResolvedValue(null);


        await refresh(req, res, next);


        expect(verifyRefreshToken)
            .toHaveBeenCalledWith(
                "invalid-refresh-token"
            );


        expect(refresh_token.getRefreshToken)
            .toHaveBeenCalledWith(
                "invalid-hashed-token"
            );


        expect(User.getUserById)
            .not.toHaveBeenCalled();


        expect(generateAccessToken)
            .not.toHaveBeenCalled();


        expect(refresh_token.revokeRefreshToken)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Invalid refresh token",
                    statusCode: 401
                })
            );
    });


    // =====================================
    // User Not Found
    // =====================================

    test("should return error if user is not found", async () => {

        req.cookies = {
            refreshToken: "refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
                id: 999
            });


        hashRefreshToken
            .mockReturnValue(
                "hashed-refresh-token"
            );


        refresh_token.getRefreshToken
            .mockResolvedValue({
                id: 1,
                user_id: 999,
                token_hash: "hashed-refresh-token"
            });


        User.getUserById
            .mockResolvedValue(null);


        await refresh(req, res, next);


        expect(User.getUserById)
            .toHaveBeenCalledWith(999);


        expect(generateAccessToken)
            .not.toHaveBeenCalled();


        expect(generateRefreshToken)
            .not.toHaveBeenCalled();


        expect(refresh_token.revokeRefreshToken)
            .not.toHaveBeenCalled();


        expect(refresh_token.createRefreshToken)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "User not found",
                    statusCode: 404
                })
            );
    });


    // =====================================
    // Invalid JWT
    // =====================================

test("should return 401 if refresh token is invalid", async () => {

    req.cookies = {
        refreshToken: "invalid-token"
    };

    const error = new Error("Invalid token");

    error.name = "JsonWebTokenError";

    verifyRefreshToken.mockImplementation(() => {
        throw error;
    });

    await refresh(req, res, next);

    expect(next)
        .toHaveBeenCalledTimes(1);

    const receivedError = next.mock.calls[0][0];

    expect(receivedError.name)
        .toBe("JsonWebTokenError");

    expect(receivedError.message)
        .toBe("Invalid or expired refresh token");

    expect(receivedError.status)
        .toBe(401);
});


    // =====================================
    // Expired JWT
    // =====================================

   test("should return 401 if refresh token is expired", async () => {

    req.cookies = {
        refreshToken: "expired-token"
    };

    const error = new Error("Token expired");

    error.name = "TokenExpiredError";

    verifyRefreshToken.mockImplementation(() => {
        throw error;
    });

    await refresh(req, res, next);

    expect(next)
        .toHaveBeenCalledTimes(1);

    const receivedError = next.mock.calls[0][0];

    expect(receivedError.name)
        .toBe("TokenExpiredError");

    expect(receivedError.message)
        .toBe("Invalid or expired refresh token");

    expect(receivedError.status)
        .toBe(401);
});


    // =====================================
    // getRefreshToken Error
    // =====================================

    test("should call next if getRefreshToken fails", async () => {

        req.cookies = {
            refreshToken: "refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
                id: user.id
            });


        hashRefreshToken
            .mockReturnValue(
                "hashed-refresh-token"
            );


        const error = new Error("Database Error");


        refresh_token.getRefreshToken
            .mockRejectedValue(error);


        await refresh(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // revokeRefreshToken Error
    // =====================================

    test("should call next if revokeRefreshToken fails", async () => {

        req.cookies = {
            refreshToken: "refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
            id: user.id
        });


        hashRefreshToken
            .mockReturnValueOnce(
                "old-hashed-token"
            )
            .mockReturnValueOnce(
                "new-hashed-token"
            );


        refresh_token.getRefreshToken
            .mockResolvedValue({
                id: 1,
                user_id: user.id,
                token_hash: "old-hashed-token"
            });


        User.getUserById
            .mockResolvedValue(user);


        generateAccessToken
            .mockReturnValue(
                "access-token"
            );


        const error = new Error(
            "Revoke Failed"
        );


        refresh_token.revokeRefreshToken
            .mockRejectedValue(error);


        await refresh(req, res, next);


        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                "old-hashed-token"
            );


        expect(next)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // createRefreshToken Error
    // =====================================

    test("should call next if createRefreshToken fails", async () => {

        req.cookies = {
            refreshToken: "refresh-token"
        };


        verifyRefreshToken
            .mockReturnValue({
                id: user.id
            });


        hashRefreshToken
            .mockReturnValueOnce(
                "old-hashed-token"
            )
            .mockReturnValueOnce(
                "new-hashed-token"
            );


        refresh_token.getRefreshToken
            .mockResolvedValue({
                id: 1,
                user_id: user.id,
                token_hash: "old-hashed-token"
            });


        User.getUserById
            .mockResolvedValue(user);


        generateAccessToken
            .mockReturnValue(
                "access-token"
            );


        refresh_token.revokeRefreshToken
            .mockResolvedValue();


        generateRefreshToken
            .mockReturnValue(
                "new-refresh-token"
            );


        const error = new Error(
            "Create Refresh Token Failed"
        );


        refresh_token.createRefreshToken
            .mockRejectedValue(error);


        await refresh(req, res, next);


        expect(next)
            .toHaveBeenCalledTimes(1);


        expect(next)
            .toHaveBeenCalledWith(error);
    });

});

// =====================================================
// LOGOUT CONTROLLER
// =====================================================

describe("Logout Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.resetAllMocks();

        req = {
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn()
        };

        next = jest.fn();
    });

    // =====================================
    // Success
    // =====================================

    test("should logout successfully", async () => {
        req.cookies = {
            refreshToken: "refresh-token"
        };

        hashRefreshToken
            .mockReturnValue("hashed-token");

        refresh_token.revokeRefreshToken
            .mockResolvedValue();

        await logout(req, res, next);

        expect(hashRefreshToken)
            .toHaveBeenCalledWith("refresh-token");

        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith("hashed-token");

        expect(res.clearCookie)
            .toHaveBeenCalledWith(
                "refreshToken",
                clearRefreshCookieOptions
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                msg: "Logged out successfully"
            });

        expect(logger.info)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .not.toHaveBeenCalled();
    });
    // =====================================
    // No Refresh Token
    // =====================================

    test("should return error if refresh token is missing", async () => {

    req.cookies = {};

    await logout(req, res, next);

    expect(refresh_token.revokeRefreshToken)
        .not.toHaveBeenCalled();

    expect(next)
        .toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.message)
        .toBe("Refresh token not found");

    expect(error.statusCode)
        .toBe(401);
});
    // =====================================
    // revokeRefreshToken Error
    // =====================================

    test("should call next if revokeRefreshToken fails", async () => {

        req.cookies = {
            refreshToken: "refresh-token"
        };

        hashRefreshToken
            .mockReturnValueOnce(
                "hashed-token"
            );

        const error = new Error(
            "Revoke Failed"
        );

        refresh_token.revokeRefreshToken
            .mockRejectedValue(error);

        await logout(req, res, next);

        expect(refresh_token.revokeRefreshToken)
            .toHaveBeenCalledWith(
                "hashed-token"
            );

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

});