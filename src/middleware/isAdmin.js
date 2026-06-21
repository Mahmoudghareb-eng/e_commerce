const isAdmin = async(req,res,next)=>{
    try{
        if(req.user.role !== 'admin')
            return res.status(403).json({ msg: 'Admin access required' });
        next();
    }catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = isAdmin;