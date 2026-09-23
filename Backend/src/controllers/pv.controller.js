const PaymentVoucher = require('../models/PaymentVoucher')
const Approval = require('../models/Approval')
const User = require('../models/User')

const getPrevVouchers = async (req, res)=>{
    try{
        const vouchers = await PaymentVoucher.find()

        if(!vouchers){
            return res.status(200).json({
                success: true,
                message: "Not payment voucher available",
                data: null
            })
        }

        res.status(200).json({
            success: true,
            data: vouchers
        })
    }catch(error){
        throw new Error('Failed to get previous vouchers')
    }

}

const newVoucher = async (req, res)=>{
    try {
        const data = { ...req.body, createdBy: req.user.id || req.user._id }

        if(!data){
            return res.status(404).json({message: "Details required!"})
        }
        const voucher = await PaymentVoucher.create(data)
        const hods = await User.find({ role: 'HOD', department: voucher.department, isActive: true }).select('_id')

        if (!hods.length) {
            await PaymentVoucher.findByIdAndDelete(voucher._id)
            return res.status(409).json({ success: false, message: 'No active HOD is configured for this department' })
        }

        voucher.status = 'PENDING_HOD'
        await voucher.save()
        await Approval.insertMany(hods.map(hod => ({ voucher: voucher._id, approver: hod._id, stage: 'HOD', decision: 'PENDING', decidedAt: null })))

        return res.status(201).json({
            success: true,
            message: "Payment Voucher created",
            data: voucher
        })

    } catch (error) {
        throw new Error(`Failed to create Payment Voucher: ${error}`)
    }
}

const generatePvNo = (req, res)=>{
    const year = new Date().getFullYear();
    const number = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return res.status(200).json({ 
        success: true, 
        data: {pvNO: `PV-${year}-${number}`}
    });
}
module.exports = {getPrevVouchers, newVoucher, generatePvNo}