const express = require('express')
const controller = require('../controllers/approval.controller')
const auth = require('../middlewares/auth.middleware')
const router = express.Router()

router.post('/approvals', auth, controller.createApproval)
router.get('/approvals/pending', auth, controller.getPendingApprovals)
router.post('/approvals/:approvalId/decision', auth, controller.decideApproval)

module.exports = router