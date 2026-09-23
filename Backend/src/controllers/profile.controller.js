const User = require('../models/User')
const bcrypt = require('bcrypt')

const changePassword = async (req, res)=>{
    const { currentPassword, newPassword, confirmPassword } = req.body
    const userId = req.user.id || req.user._id

    const user = await User.findById(userId)

    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    if(!(await bcrypt.compare((currentPassword || ""), user.password))){
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect"
        })
    }
    if(newPassword === currentPassword){
        return res.status(401).json({
            success: false,
            message: "New password is the same as the old one"
        })
    }
    if(newPassword !== confirmPassword){
        return res.status(401).json({
            success: false,
            message: "New passwords do not match"
        })
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10)

    await user.updateOne({ password: newHashedPassword })
    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    })
}
module.exports = { changePassword }