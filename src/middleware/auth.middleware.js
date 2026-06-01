const {verifyToken} = require("../config/jwt");

const auth = (req,res,next)=>{
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
    req.user=verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports=auth;