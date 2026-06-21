require("dotenv").config({ path: "../.env" });
const jwt = require("jsonwebtoken");

//generate token
const generateToken = (user)=>{
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

module.exports = {
    generateToken,
    verifyToken
}