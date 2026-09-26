const {
  getMe,  
  getUsers,
  updateProfile,
  deleteUser
} = require("../controllers/user.controller");

const User = require("../model/user.model");
const { user } = require("./mock/user.mock");
const logger = require("../config/logger");
const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");

// MOCKS
jest.mock("../model/user.model");
jest.mock("../config/redis", () => ({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn()
}));
jest.mock("../utility/redis.util");
jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("Get Me Controller", () => {
    let req;
    let res;
    let next;
    beforeEach(()=>{
        jest.clearAllMocks();

        req={
            user:{
                id:user.id
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        next=jest.fn();
    });
    test("should return user from cache",async()=>{
            const cachedUser = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
        redis.get
        .mockResolvedValue(
            JSON.stringify(cachedUser)
        );
        await getMe(req,res,next);

        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(User.getUserById)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(cachedUser);

        expect(next)
            .not.toHaveBeenCalled()    
    });

    test("should get user from database when cache does not exist",async()=>{

        redis.get
            .mockResolvedValue(null);

        User.getUserById
            .mockResolvedValue(user);

        redis.setEx
            .mockResolvedValue();

        await getMe(req,res,next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(User.getUserById)
            .toHaveBeenCalledTimes(1);

        expect(User.getUserById)
            .toHaveBeenCalledWith(user.id);

        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                `user:${user.id}`,
                60,
                JSON.stringify({ user })
            );
        
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({ user });

        expect(next)
            .not.toHaveBeenCalled();

    });

    test("should return error if user is not found",async()=>{

        redis.get
            .mockResolvedValue(null); 

        User.getUserById
            .mockResolvedValue(null);
        
        await getMe(req,res,next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );


        expect(User.getUserById)
            .toHaveBeenCalledWith(
                user.id
            );

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledTimes(1);

        const error = next.mock.calls[0][0];

        expect(error.message)
            .toBe("User not found");

        expect(error.statusCode)
            .toBe(404);

    });
    test("should call next if redis get fails", async () => {

        const error = new Error(
            "Redis GET failed"
        );

        redis.get
            .mockRejectedValue(error);

        await getMe(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(User.getUserById)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });
    test("should call next if database fails", async () => {

        redis.get
            .mockResolvedValue(null);

        const error = new Error(
            "Database Error"
        );

        User.getUserById
            .mockRejectedValue(error);

        await getMe(req, res, next);

        expect(User.getUserById)
            .toHaveBeenCalledWith(
                user.id
            );

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });
    test("should call next if redis setEx fails", async () => {

        redis.get
            .mockResolvedValue(null);

        User.getUserById
            .mockResolvedValue(user);

        const error = new Error(
            "Redis SET failed"
        );

        redis.setEx
            .mockRejectedValue(error);

        await getMe(req, res, next);

        expect(User.getUserById)
            .toHaveBeenCalledWith(
                user.id
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                `user:${user.id}`,
                60,
                JSON.stringify({ user })
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });
});

describe("Get Users Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            query: {
                page: "1",
                limit: "10"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });

    test("should return users from cache", async () => {

        const cachedData = {
            users: [
                {
                    id: 1,
                    name: "Mahmoud",
                    email: "test@test.com"
                }
            ]
        };

        redis.get
            .mockResolvedValue(
                JSON.stringify(cachedData)
            );


        await getUsers(req, res, next);


        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "users:1:10"
            );

        expect(User.getUsers)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(
                cachedData
            );


        expect(next)
            .not.toHaveBeenCalled();
    });

    test("should get users from database when cache does not exist", async () => {

        const users = [
            {
                id: 1,
                name: "Mahmoud",
                email: "test@test.com"
            },
            {
                id: 2,
                name: "Ahmed",
                email: "ahmed@test.com"
            }
        ];


        redis.get
            .mockResolvedValue(null);

        User.getUsers
            .mockResolvedValue(users);

        redis.setEx
            .mockResolvedValue();

        await getUsers(req, res, next);

        // Redis
        expect(redis.get)
            .toHaveBeenCalledWith(
                "users:1:10"
            );


        // Database
        expect(User.getUsers)
            .toHaveBeenCalledTimes(1);

        expect(User.getUsers)
            .toHaveBeenCalledWith(
                10,
                0
            );


        // Save cache
        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "users:1:10",
                60,
                JSON.stringify({ users })
            );


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(
                users
            );


        expect(next)
            .not.toHaveBeenCalled();
    });


    test("should calculate limit and offset correctly", async () => {

        req.query = {
            page: "3",
            limit: "5"
        };


        redis.get
            .mockResolvedValue(null);


        const users = [
            {
                id: 11,
                name: "User 11"
            }
        ];


        User.getUsers
            .mockResolvedValue(users);


        redis.setEx
            .mockResolvedValue();


        await getUsers(req, res, next);


        // offset = (3 - 1) * 5
        expect(User.getUsers)
            .toHaveBeenCalledWith(
                5,
                10
            );


        expect(redis.get)
            .toHaveBeenCalledWith(
                "users:3:5"
            );


        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "users:3:5",
                60,
                JSON.stringify({ users })
            );


        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(
                users
            );
    });


    test("should use default page and limit", async () => {

        req.query = {};


        redis.get
            .mockResolvedValue(null);


        const users = [];

        User.getUsers
            .mockResolvedValue(users);


        redis.setEx
            .mockResolvedValue();


        await getUsers(req, res, next);


        // page = 1
        // limit = 10
        // offset = 0

        expect(User.getUsers)
            .toHaveBeenCalledWith(
                10,
                0
            );


        expect(redis.get)
            .toHaveBeenCalledWith(
                "users:1:10"
            );


        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(
                users
            );
    });


    test("should call next if redis get fails", async () => {

        const error = new Error(
            "Redis GET failed"
        );


        redis.get
            .mockRejectedValue(error);


        await getUsers(req, res, next);


        expect(redis.get)
            .toHaveBeenCalledWith(
                "users:1:10"
            );


        expect(User.getUsers)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });


    test("should call next if database fails", async () => {

        redis.get
            .mockResolvedValue(null);

        const error = new Error(
            "Database Error"
        );

        User.getUsers
            .mockRejectedValue(error);

        await getUsers(req, res, next);

        expect(User.getUsers)
            .toHaveBeenCalledWith(
                10,
                0
            );

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });

    test("should call next if redis setEx fails", async () => {

        redis.get
            .mockResolvedValue(null);

        const users = [
            {
                id: 1,
                name: "Mahmoud"
            }
        ];

        User.getUsers
            .mockResolvedValue(users);

        const error = new Error(
            "Redis SET failed"
        );

        redis.setEx
            .mockRejectedValue(error);

        await getUsers(req, res, next);

        expect(User.getUsers)
            .toHaveBeenCalledWith(
                10,
                0
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "users:1:10",
                60,
                JSON.stringify({ users })
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });

});

describe("Update Profile Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            user: {
                id: user.id
            },

            body: {
                name: "New Mahmoud",
                email: "new@test.com"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });

    test("should update profile successfully", async () => {

        const updatedUser = {
            ...user,
            name: "New Mahmoud",
            email: "new@test.com"
        };

        User.getUserById
            .mockResolvedValue(user);

        User.updateUser
            .mockResolvedValue(updatedUser);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await updateProfile(req, res, next);

        expect(User.getUserById)
            .toHaveBeenCalledTimes(1);

        expect(User.getUserById)
            .toHaveBeenCalledWith(
                user.id
            );

        expect(User.updateUser)
            .toHaveBeenCalledTimes(1);

        expect(User.updateUser)
            .toHaveBeenCalledWith(
                user.id,
                "New Mahmoud",
                "new@test.com"
            );

        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "users:*"
            );

        expect(logger.info)
            .toHaveBeenCalledTimes(1);

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "User updated successfully",
                user: updatedUser
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    test("should return error if user is not found", async () => {

        User.getUserById
            .mockResolvedValue(null);


        await updateProfile(req, res, next);


        // User update should NOT happen
        expect(User.updateUser)
            .not.toHaveBeenCalled();


        // Cache should NOT be deleted
        expect(redis.del)
            .not.toHaveBeenCalled();


        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Logger
        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        // Response should NOT be sent
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledTimes(1);


        const error = next.mock.calls[0][0];

        expect(error.message)
            .toBe("User not found");

        expect(error.statusCode)
            .toBe(404);
    });

    test("should keep old name and email if they are not provided", async () => {

        req.body = {};


        User.getUserById
            .mockResolvedValue(user);


        User.updateUser
            .mockResolvedValue(user);


        redis.del
            .mockResolvedValue();


        clearCacheByPattern
            .mockResolvedValue();


        await updateProfile(req, res, next);


        expect(User.updateUser)
            .toHaveBeenCalledWith(
                user.id,
                user.name,
                user.email
            );


        expect(next)
            .not.toHaveBeenCalled();
    });

    test("should call next if getUserById fails", async () => {

        const error = new Error(
            "Database Error"
        );

        User.getUserById
            .mockRejectedValue(error);

        await updateProfile(req, res, next);

        expect(User.updateUser)
            .not.toHaveBeenCalled();

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });
    test("should call next if updateUser fails", async () => {

        const error = new Error(
            "Update Database Error"
        );

        User.getUserById
            .mockResolvedValue(user);

        User.updateUser
            .mockRejectedValue(error);

        await updateProfile(req, res, next);

        expect(User.updateUser)
            .toHaveBeenCalledWith(
                user.id,
                "New Mahmoud",
                "new@test.com"
            );

        // Cache should NOT be cleared
        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    test("should call next if redis del fails", async () => {

        const error = new Error(
            "Redis DEL Error"
        );

        User.getUserById
            .mockResolvedValue(user);

        User.updateUser
            .mockResolvedValue(user);

        redis.del
            .mockRejectedValue(error);

        await updateProfile(req, res, next);

        expect(User.updateUser)
            .toHaveBeenCalled();

        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    test("should call next if clearCacheByPattern fails", async () => {

        const error = new Error(
            "Clear Cache Error"
        );

        User.getUserById
            .mockResolvedValue(user);

        User.updateUser
            .mockResolvedValue(user);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockRejectedValue(error);

        await updateProfile(req, res, next);

        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "users:*"
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

});

// =====================================
// DELETE USER CONTROLLER
// =====================================

describe("Delete User Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            user: {
                id: user.id
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should delete user successfully", async () => {

        const deletedUser = {
            ...user
        };

        User.deleteUser
            .mockResolvedValue(deletedUser);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();


        await deleteUser(req, res, next);


        // Delete user
        expect(User.deleteUser)
            .toHaveBeenCalledTimes(1);

        expect(User.deleteUser)
            .toHaveBeenCalledWith(
                user.id
            );


        // Delete single user cache
        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );


        // Clear users list cache
        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "users:*"
            );


        // Logger
        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "User deleted successfully"
            });


        // next should NOT be called
        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // User Not Found
    // =====================================

    test("should return error if user is not found", async () => {

        User.deleteUser
            .mockResolvedValue(null);


        await deleteUser(req, res, next);


        // Delete was attempted
        expect(User.deleteUser)
            .toHaveBeenCalledWith(
                user.id
            );


        // Cache should NOT be deleted
        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Warning logger
        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        // Response should NOT be sent
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        // Error
        expect(next)
            .toHaveBeenCalledTimes(1);

        const error = next.mock.calls[0][0];

        expect(error.message)
            .toBe("User not found");

        expect(error.statusCode)
            .toBe(404);
    });


    // =====================================
    // Database Error
    // =====================================

    test("should call next if deleteUser fails", async () => {

        const error = new Error(
            "Database Error"
        );


        User.deleteUser
            .mockRejectedValue(error);


        await deleteUser(req, res, next);


        expect(User.deleteUser)
            .toHaveBeenCalledWith(
                user.id
            );


        // Cache should NOT be touched
        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });


    // =====================================
    // Redis DEL Error
    // =====================================

    test("should call next if redis del fails", async () => {

        const error = new Error(
            "Redis DEL Error"
        );


        User.deleteUser
            .mockResolvedValue(user);


        redis.del
            .mockRejectedValue(error);


        await deleteUser(req, res, next);


        // User was deleted
        expect(User.deleteUser)
            .toHaveBeenCalledWith(
                user.id
            );


        // Redis failed
        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );


        // Pattern cache should not be reached
        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Response should not be sent
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });


    // =====================================
    // Clear Cache Error
    // =====================================

    test("should call next if clearCacheByPattern fails", async () => {

        const error = new Error(
            "Clear Cache Error"
        );


        User.deleteUser
            .mockResolvedValue(user);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockRejectedValue(error);


        await deleteUser(req, res, next);


        // User deleted
        expect(User.deleteUser)
            .toHaveBeenCalledWith(
                user.id
            );


        // User cache deleted
        expect(redis.del)
            .toHaveBeenCalledWith(
                `user:${user.id}`
            );


        // Users cache cleared
        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "users:*"
            );


        // Response should not be sent
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                error
            );
    });

});
