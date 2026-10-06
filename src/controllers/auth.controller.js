const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken} = require("../config/jwt");
const User = require("../model/user.model");
const refresh_token = require("../model/refreshToken.model");
const bcrypt = require("bcrypt");
const hashRefreshToken = require("../utility/hash.utility");
const sendCode = require("../utility/sandCode.utility")
const { refreshCookieOptions, clearRefreshCookieOptions } = require("../config/cookie");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");
const { use } = require("../config/email");

//rigster
const register = async(req,res,next)=>{
    try{
        const {name,email,password} = req.body;

        const emailLower = email.toLowerCase();
    
        // check email exists
        const existingUser = await User.getUserByEmail(emailLower);
        if (existingUser) {
            logger.warn(`Register failed: Email already exists (${emailLower})`);
            throw new AppError("Email already exists",400);
        }
    
        //hash
        const hashPassword = await bcrypt.hash(password,10);
    
        const user = await User.createUser(name,emailLower,hashPassword);
        logger.info(`New user registered: ${user.email} (ID: ${user.id})`);
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
        logger.warn(`Login failed: User not found (${emailLower})`);
        throw new AppError("Invalid email or password",401);
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
        logger.warn(`Login failed: Wrong password (${emailLower})`);
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

    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);
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
    logger.info(`Access token refreshed for user ID: ${user.id}`);
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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailLower = email.toLowerCase();

    // Check if user exists
    const user = await User.getUserByEmail(emailLower);

    if (!user) {
      logger.warn(`Forgot Password failed: User not found (${emailLower})`);
      throw new AppError("Invalid email", 401);
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();

    // Code expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save code in database
    await User.setResetCode(user.id, code, expiresAt);

    // Send code to user's email
    await sendCode(emailLower, code);

    return res.status(200).json({msg: "Verification code sent successfully",code});
  } catch (err) {
    next(err);
  }
};

//reset password
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    const emailLower = email.toLowerCase();

    // Find user
    const user = await User.getUserByEmail(emailLower);

    if (!user) {
      throw new AppError("Invalid email", 401);
    }

    // Check maximum attempts
    if (user.reset_attempts >= 5) {
      logger.warn(`Reset Password failed: Too many attempts (${emailLower})`);
      throw new AppError("Too many attempts. Please request a new code",429);
    }

    // Check code expiration
    if (
      !user.reset_code_expires_at ||
      new Date() > new Date(user.reset_code_expires_at)
    ) {
      throw new AppError("Verification code expired", 401);
    }

    // Check code
    if (String(code) !== String(user.reset_code)) {
      const result = await User.incrementResetAttempts(user.id);

      logger.warn(`Reset Password failed: Invalid code (${emailLower})`);

      if (result.reset_attempts >= 5) {
        throw new AppError("Too many attempts. Please request a new code",429);
      }
      throw new AppError("Invalid code", 401);
    }
    
    // Hash new password
    const hashNewPassword = await bcrypt.hash(password,10);

    // Update password
    await User.updatePassword(user.id, hashNewPassword);
    return res.status(200).json({msg: "Reset password successfully"});

  } catch (err) {
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

        logger.info(`User logged out (ID: ${req.user?.id || "Unknown"})`);

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
    forgotPassword,
    resetPassword,
    logout
};