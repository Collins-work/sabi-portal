const express = require('express')
const admin = require('../middlewares/admin.middleware')
const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/admin.controller')
const router = express.Router()

router.use(auth)
router.use(admin)

router.get('/staff',controller.getStaff)

router.post('/staff',controller.createStaff)
router.get('/payment-vouchers',controller.viewPV)
router.get('/payment-vouchers/:id', controller.getVoucher)
router.patch('/staff/:id/status',controller.changeStatus)




module.exports = router