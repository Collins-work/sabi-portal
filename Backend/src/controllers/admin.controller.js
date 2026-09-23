const User = require('../models/User')
const PaymentVoucher = require('../models/PaymentVoucher')
const Approval = require('../models/Approval')
const Department = require('../models/Department')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const getStaff = async (req, res)=>{
    try {
        const staff = await User.find().populate('department', 'name code');
        res.status(200).json({
            success: true,
            data: staff
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch staff'
        })
    }
}

const createStaff = async (req, res)=>{
    const { firstName, lastName, email, employeeId, department, temporaryPassword, role } = req.body
    const normalizedRole = String(role || '').trim().toUpperCase()
    const validRoles = ['STAFF', 'HOD', 'ICU', 'CFO', 'MD', 'ADMIN']

    if (!firstName || !lastName || !email || !employeeId || !department || !temporaryPassword || !role) {
        return res.status(400).json({
            success: false,
            message: 'First name, last name, email, employee ID, department, temporary password, and role are required'
        })
    }

    if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({
            success: false,
            message: 'Role must be STAFF, HOD, ICU, CFO, MD, or ADMIN'
        })
    }

    try {
        const selectedDepartment = mongoose.isValidObjectId(department)
            ? await Department.findById(department)
            : null
        if (!selectedDepartment) {
            return res.status(400).json({
                success: false,
                message: 'A valid department is required'
            })
        }
        const numCode = Math.floor(Math.random()*100)
        const username = `${firstName.trim()}${numCode}`.replace(/\s+/g, '').toLowerCase()
        const existingStaff = await User.findOne({ username })

        if (existingStaff) {
            return res.status(409).json({
                success: false,
                message: 'A staff member with this username already exists'
            })
        }

        const password = await bcrypt.hash(temporaryPassword, 10)
        const staff = await User.create({
            name: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim().toLowerCase(),
            username,
            password,
            employeeId: employeeId.trim(),
            department: selectedDepartment._id,
            role: normalizedRole,
            isActive: true
        })

        await staff.populate('department')

        return res.status(201).json({
            success: true,
            data: staff
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create staff'
        })
    }
}
const viewPV = async(req, res)=>{
    try{
        const pvs = await PaymentVoucher.find()
        if(pvs.length == 0){
            return res.status(200).json({
                success: true,
                message: "No Payment Vouchers"
            })
        }
        res.status(200).json({
            success: true,
            data: pvs
        })
    }catch (error){
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment vouchers"
        })
    }
}

const changeStatus = async (req, res)=>{
    try {
        const id = req.params.id
        const { isActive } = req.body
        const user = await User.findById(id)

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        await user.updateOne({ isActive })

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to change status'
        })
    }
    

}
const getVoucher = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid payment voucher ID' })
    }

    const voucher = await PaymentVoucher.findById(req.params.id).populate('department', 'name code').populate('createdBy', 'name username email').lean()
    if (!voucher) {
        return res.status(404).json({ success: false, message: 'Payment voucher not found' })
    }
    const approvals = await Approval.find({ voucher: voucher._id }).populate('approver', 'name username email').sort({ createdAt: 1 }).lean()
    return res.status(200).json({ success: true, data: { ...voucher, approvals } })
}
module.exports = { getStaff, createStaff, changeStatus, viewPV, getVoucher }