const express = require('express')
const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/departments.controller')
const router = express.Router()

router.get('/departments',auth, controller.getDepartments)
router.post('/departments',auth, controller.createDepartment)
router.delete('/departments/:id', controller.deleteDepartment)



module.exports = router