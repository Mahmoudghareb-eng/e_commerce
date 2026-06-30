require("dotenv").config({ path: "../.env" });
const jwt = require("jsonwebtoken");

//generate token
const generateAccessToken  = (user)=>{
    const {id,email,role='user'} = user;
     
    return jwt.sign({id,email,role},
        process.env.JWT_SECRET,{expiresIn:"10m"});
};

//verify
const verifyToken = (token)=>{
    try{
        return jwt.verify(token,process.env.JWT_SECRET);
    }catch(err){
        throw new Error("Invalid or expired token");
    }
};

const generateRefreshToken = (user)=>{
   const {id,email,role='user'} = user;
    return jwt.sign({id,email,role},
        process.env.JWT_REFRESH_SECRET,{expiresIn: "7d"});
}

const verifyRefreshToken = (token)=>{
    try{
        return jwt.verify(token,process.env.JWT_REFRESH_SECRET);
    }catch(err){
        throw new Error("Invalid or expired token");
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
}