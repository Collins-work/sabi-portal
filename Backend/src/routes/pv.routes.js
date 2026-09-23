const express = require('express')
const controller  = require('../controllers/pv.controller')
const auth = require('../middlewares/auth.middleware')
const router = express.Router()

router.get('/payment-vouchers', auth, controller.getPrevVouchers)
router.post('/payment-vouchers', auth, controller.newVoucher)
router.get('/payment-vouchers/next-number',auth, controller.generatePvNo)


module.exports = router