const mongoose = require('mongoose')
const Approval = require('../models/Approval')
const PaymentVoucher = require('../models/PaymentVoucher')
const User = require('../models/User')

const stages = [
    { role: 'HOD', voucherStatus: 'PENDING_HOD', nextRole: 'ICU', nextStatus: 'PENDING_ICU' },
    { role: 'ICU', voucherStatus: 'PENDING_ICU', nextRole: 'CFO', nextStatus: 'PENDING_CFO' },
    { role: 'CFO', voucherStatus: 'PENDING_CFO', nextRole: 'MD', nextStatus: 'PENDING_MD' },
    { role: 'MD', voucherStatus: 'PENDING_MD', nextRole: null, nextStatus: 'APPROVED' }
]

const getUserId = req => req.user?.id || req.user?._id
const getStage = role => stages.find(stage => stage.role === role)

const findApprovers = async (role, voucher) => {
    const query = { role, isActive: true }
    if (role === 'HOD') query.department = voucher.department
    return User.find(query).select('_id role department')
}

const assignStage = async (voucher, stage) => {
    const approvers = await findApprovers(stage.role, voucher)
    if (!approvers.length) throw new Error(`No active ${stage.role} approver is configured`)

    await Approval.bulkWrite(approvers.map(approver => ({
        updateOne: {
            filter: { voucher: voucher._id, approver: approver._id, stage: stage.role },
            update: {
                $setOnInsert: {
                    voucher: voucher._id,
                    approver: approver._id,
                    stage: stage.role,
                    decision: 'PENDING',
                    decidedAt: null
                }
            },
            upsert: true
        }
    })))

    return Approval.find({ voucher: voucher._id, stage: stage.role })
}

const createApproval = async (req, res) => {
    try {
        const paymentVoucherId = req.body.paymentVoucherId || req.params.paymentVoucherId
        if (!paymentVoucherId || !mongoose.isValidObjectId(paymentVoucherId)) {
            return res.status(400).json({ success: false, message: 'A valid paymentVoucherId is required' })
        }

        const voucher = await PaymentVoucher.findById(paymentVoucherId)
        if (!voucher) return res.status(404).json({ success: false, message: 'Payment voucher not found' })
        if (voucher.status !== 'Draft') return res.status(409).json({ success: false, message: 'Only draft vouchers can enter approval' })
        if (await Approval.exists({ voucher: voucher._id })) return res.status(409).json({ success: false, message: 'This voucher is already in approval' })

        const approvals = await assignStage(voucher, stages[0])
        voucher.status = stages[0].voucherStatus
        await voucher.save()

        return res.status(201).json({ success: true, data: approvals })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to create approval' })
    }
}

const getPendingApprovals = async (req, res) => {
    try {
        const role = String(req.user?.role || '').toUpperCase()
        const stage = getStage(role)
        if (!stage) return res.status(403).json({ success: false, message: 'Your role cannot approve vouchers' })

        const activeVouchers = await PaymentVoucher.find({ status: stage.voucherStatus })
        for (const voucher of activeVouchers) {
            await assignStage(voucher, stage)
        }

        const approvals = await Approval.find({ approver: getUserId(req), stage: role, decision: 'PENDING' })
            .populate({ path: 'voucher', populate: { path: 'department', select: 'name code' } })
            .sort({ createdAt: 1 })

        return res.status(200).json({ success: true, data: approvals })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' })
    }
}

const decideApproval = async (req, res) => {
    try {
        const role = String(req.user?.role || '').toUpperCase()
        const stage = getStage(role)
        const decision = String(req.body.decision || '').toUpperCase()
        const reason = String(req.body.reason || '').trim()

        if (!stage) return res.status(403).json({ success: false, message: 'Your role cannot approve vouchers' })
        if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ success: false, message: 'Decision must be APPROVED or REJECTED' })
        if (decision === 'REJECTED' && !reason) return res.status(400).json({ success: false, message: 'A rejection reason is required' })

        const approval = await Approval.findOne({
            _id: req.params.approvalId,
            approver: getUserId(req),
            stage: role,
            decision: 'PENDING'
        }).populate('voucher')

        if (!approval) return res.status(404).json({ success: false, message: 'Pending approval not found for your role' })
        if (!approval.voucher || approval.voucher.status !== stage.voucherStatus) {
            return res.status(409).json({ success: false, message: 'This voucher is not currently at your approval stage' })
        }

        if (decision === 'APPROVED' && stage.nextRole && !(await findApprovers(stage.nextRole, approval.voucher)).length) {
            return res.status(409).json({ success: false, message: `No active ${stage.nextRole} approver is configured` })
        }

        const voucher = approval.voucher
        const nextStatus = decision === 'REJECTED' ? 'REJECTED' : stage.nextStatus
        const claimedVoucher = await PaymentVoucher.findOneAndUpdate(
            { _id: voucher._id, status: stage.voucherStatus },
            { $set: { status: nextStatus } },
            { returnDocument: 'after' }
        )
        if (!claimedVoucher) {
            return res.status(409).json({ success: false, message: 'This voucher has already been decided at this stage' })
        }

        approval.decision = decision
        approval.reason = reason || undefined
        approval.decidedAt = new Date()
        await approval.save()
        await Approval.updateMany(
            { voucher: voucher._id, stage: stage.role, decision: 'PENDING', _id: { $ne: approval._id } },
            { $set: { decision: 'CANCELLED', decidedAt: new Date(), reason: 'Another authorized reviewer completed this stage' } }
        )

        if (decision === 'REJECTED') {
            return res.status(200).json({ success: true, message: 'Voucher rejected', data: await approval.populate('voucher') })
        }

        if (stage.nextRole) await assignStage(claimedVoucher, getStage(stage.nextRole))

        return res.status(200).json({
            success: true,
            message: stage.nextRole ? `Voucher sent to ${stage.nextRole}` : 'Voucher approved',
            data: await approval.populate('voucher')
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to submit approval decision' })
    }
}

module.exports = { createApproval, getPendingApprovals, decideApproval }
