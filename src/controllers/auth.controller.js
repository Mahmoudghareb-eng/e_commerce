const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken} = require("../config/jwt");
const User = require("../model/user.model");
const refresh_token = require("../model/refreshToken.model");
const bcrypt = require("bcrypt");
const hashRefreshToken = require("../utility/hash.utility");
const { refreshCookieOptions, clearRefreshCookieOptions } = require("../config/cookie");
const AppError = require("../middleware/error.middleware");

//rigster
const register = async(req,res,next)=>{
    try{
        const {name,email,password} = req.body;

        const emailLower = email.toLowerCase();
    
        // check email exists
        const existingUser = await User.getUserByEmail(emailLower);
        if (existingUser) {
            throw new AppError("Email already exists",400);
        }
    
        //hash
        const hashPassword = await bcrypt.hash(password,10);
    
        const user = await User.createUser(name,emailLower,hashPassword);
        const accessToken = generateAccessToken({
            id:user.id,
            email:user.email
        });
        const refreshToken = generateRefreshToken({
            id:user.id,
            email:user.email
        });

        const hashToken = hashRefreshToken(refreshToken);
        await refresh_token.createRefreshToken(user.id,hashToken);

        res.cookie("refreshToken",refreshToken,refreshCookieOptions);

        return res.status(201).json({
        message: "User created successfully",
        accessToken,
        user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
    }catch(err){
        next(err);
    }
};

//login
const login = async(req,res,next)=>{
    try{
    const {email,password} = req.body;

    const emailLower = email.toLowerCase();

    // check email exists
    const user = await User.getUserByEmail(emailLower);
    if (!user) {
        throw new AppError("Invalid email or password",401);
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password",401);
    }
    const accessToken = generateAccessToken({
        id:user.id,
        email:user.email,
        role:user.role
    });

    const oldRefreshToken = req.cookies?.refreshToken;

    if (oldRefreshToken) {
    const oldHashToken = hashRefreshToken(oldRefreshToken);

    await refresh_token.revokeRefreshToken(oldHashToken);
    }

    const refreshToken = generateRefreshToken({
        id:user.id,
        email:user.email,
        role:user.role
    });
    const hashToken = hashRefreshToken(refreshToken);
    await refresh_token.createRefreshToken(user.id,hashToken);
    res.cookie("refreshToken",refreshToken,refreshCookieOptions);

    return res.status(200).json({
        message: "User logged in successfully",
        accessToken,
        user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }        
    })
    }catch(err){
        next(err);
    }
};

//refresh
const refresh = async(req,res,next)=>{
    try{
     const RefreshToken = req.cookies?.refreshToken;

    if (!RefreshToken) {
        throw new AppError("refresh token not found",404);
    }  
    const payload = verifyRefreshToken(RefreshToken);
    const hashToken = hashRefreshToken(RefreshToken);

    const isExist = await refresh_token.getRefreshToken(hashToken);

    if(!isExist){
        throw new AppError("Invalid refresh token",401);
    }

    const user = await User.getUserById(payload.id);
    if (!user) {
        throw new AppError("User not found",404);
    }
    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role
    });
    
    await refresh_token.revokeRefreshToken(hashToken);

    const newRefreshToken = generateRefreshToken({
        id:user.id,
        email:user.email,
        role:user.role
    });
    const newHashToken = hashRefreshToken(newRefreshToken);
    await refresh_token.createRefreshToken(user.id,newHashToken);

    res.cookie("refreshToken",newRefreshToken,refreshCookieOptions);

    return res.status(200).json({
        message: "User refresh successfully",
        accessToken      
    })
    } catch(err){
    if (
        err.name === "TokenExpiredError" ||
        err.name === "JsonWebTokenError"
    ) {
        err.status = 401;
        err.message = "Invalid or expired refresh token";
    }
    next(err);
    }
};

//logout
const logout = async (req,res,next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new AppError("Refresh token not found",401);
        }

        const hashToken = hashRefreshToken(refreshToken);

        await refresh_token.revokeRefreshToken(hashToken);

        res.clearCookie("refreshToken", clearRefreshCookieOptions);

        return res.status(200).json({
            msg: "Logged out successfully"
        });

    } catch (err) {
        next(err);
    }
};

module.exports={
    register,
    login,
    refresh,
    logout
};