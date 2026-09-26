const {verifyToken} = require("../config/jwt");
const User = require("../model/user.model");

const auth = async(req,res,next)=>{
  const header = req.headers.authorization;

  if(!header){
    return res.status(401).json({ message: "No token provided" });
  }
  if(!header.startsWith("Bearer ")){
    return res.status(401).json({ message: "Invalid token format" });
  }
  const token = header.split(" ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  try{
    const decoded = verifyToken(token);
    const user = await User.getUserById(decoded.id);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports=auth;