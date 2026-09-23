const express = require('express')
const controller = require('../controllers/departments.controller')
const router = express.Router()

router.get('/departments', controller.getDepartments)
router.post('/departments', controller.createDepartment)
router.delete('/departments/:id', controller.deleteDepartment)



module.exports = router