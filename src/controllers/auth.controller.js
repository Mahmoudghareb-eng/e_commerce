const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken} = require("../config/jwt");
const User = require("../model/user.model");
const refresh_token = require("../model/refreshToken.model");
const bcrypt = require("bcrypt");
const hashRefreshToken = require("../utility/hash.utility");
const { refreshCookieOptions, clearRefreshCookieOptions } = require("../config/cookie");

//rigster
const rigster = async(req,res)=>{
    try{
        const {name,email,password} = req.body;

        const emailLower = email.toLowerCase();
    
        // check email exists
        const existingUser = await User.getUserByEmail(emailLower);
        if (existingUser) {
          return res.status(400).json({ msg: "Email already exists" });
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
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

//login
const login = async(req,res)=>{
    try{
    const {email,password} = req.body;

    const emailLower = email.toLowerCase();

    // check email exists
    const user = await User.getUserByEmail(emailLower);
    if (!user) {
        return res.status(401).json({ msg: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
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
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

//refresh
const refresh = async(req,res)=>{
    try{
     const RefreshToken = req.cookies?.refreshToken;

    if (!RefreshToken) {
        return res.status(401).json({msg:"refresh token not exits"})
    }  
    const payload = verifyRefreshToken(RefreshToken);
    const hashToken = hashRefreshToken(RefreshToken);

    const isExist = await refresh_token.getRefreshToken(hashToken);

    if(!isExist)
        return res.status(401).json({ msg: "Invalid refresh token" });

    const user = await User.getUserById(payload.id);
    if (!user) {
        return res.status(404).json({msg: "User not found"});
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
        return res.status(401).json({
            msg: "Invalid or expired refresh token"
        });
    }

    console.error(err);
    return res.status(500).json({
        msg: "Server error"
    });
    }
};

//logout
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                msg: "Refresh token not found"
            });
        }

        const hashToken = hashRefreshToken(refreshToken);

        await refresh_token.revokeRefreshToken(hashToken);

        res.clearCookie("refreshToken", clearRefreshCookieOptions);

        return res.status(200).json({
            msg: "Logged out successfully"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: "Server error"
        });
    }
};

module.exports={
    rigster,
    login,
    refresh,
    logout
};