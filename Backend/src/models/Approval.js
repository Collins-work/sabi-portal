const mongoose = require('mongoose')

const approvalSchema = new mongoose.Schema(
    {
        voucher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PV',
            required: true,
            index: true
        },
        approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        stage: {
            type: String,
            enum: ['HOD', 'ICU', 'CFO', 'MD'],
            required: true
        },
        decision: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
            required: true
        },
        reason: {
            type: String,
            trim: true
        },
        decidedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

approvalSchema.index({ voucher: 1, stage: 1, approver: 1 }, { unique: true });

module.exports = mongoose.model('Approval', approvalSchema);
