const User = require('../models/User')
const bcrypt = require('bcrypt')
const generateToken = require('../utils/generateTokens')

const publicUser = (user) => {
	const result = user.toObject ? user.toObject() : { ...user };
	delete result.password;
	return result;
};

const loginUser = async (req, res)=>{
    const { email, password } = req.body
    const user = await User.findOne({ email: (email || '').trim().toLowerCase() })
    
    if(!user || !(await bcrypt.compare(password || '', user.password ))){
        return res.status(401).json({
            success: false,
            message: "Invalid Username or Password",
        });
    }
    if(!user.isActive){
        return res.status(403).json({
            success: false,
            message: "Contact the admin for Access",
        }); 
    }
    res.status(200).json({
        success: true,
        data: {
            user: publicUser(user),
            token: generateToken(user),
            role: user.role
        }
    })
}

module.exports = { loginUser }