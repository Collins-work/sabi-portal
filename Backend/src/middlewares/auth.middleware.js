const jwt = require('jsonwebtoken')

module.exports = (req, res, next)=>{
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    const token = authHeader.split(' ')[1];

    if(token == null) return res.status(401).json({ success: false, message: 'Authentication required' })

    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if(err) return res.status(401).json({ success: false, message: 'Invalid or expired token' })

        req.user = user
        next()

    })
}