const express = require('express')
const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/profile.controller')
const router = express.Router()

router.patch('/password', auth, controller.changePassword)

module.exports = router