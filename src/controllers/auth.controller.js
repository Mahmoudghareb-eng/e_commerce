const {generateToken} = require("../config/jwt");
const User = require("../model/user.model");
const bcrypt = require("bcrypt");
//rigster
const rigster = async(req,res)=>{
    try{
        const {name,email,password} = req.body;
        if(!name?.trim() || !email?.trim() || !password?.trim()){
            return res.status(400).json({ msg: "All fields are required" });
        }
        if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
        }
        const emailLower = email.toLowerCase();
    
        // check email exists
        const existingUser = await User.getUserByEmail(emailLower);
        if (existingUser) {
          return res.status(400).json({ msg: "Email already exists" });
        }
    
        //hash
        const hashPassword = await bcrypt.hash(password,10);
    
        const user = await User.createUser(name,emailLower,hashPassword);
        const token = generateToken({
            id:user.id,
            email:user.email
        });
        res.status(201).json({
        message: "User created successfully",
        token,
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
    // validation
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ msg: "All fields are required" });
    }
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
    const token = generateToken({
        id:user.id,
        email:user.email,
        role:user.role
    });    
    return res.status(200).json({
        message: "User logedin successfully",
        token,
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

module.exports={
    rigster,
    login
};