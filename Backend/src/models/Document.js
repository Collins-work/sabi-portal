const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            trim: true,
            required: true
        },
        fileType: {
            type: String,
            trim: true,
            required: true
        },
        fileSize: {
            type: Number,
            required: true,
            min: 0
        },
        storageLocation: {
            type: String,
            trim: true,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        voucher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentVoucher'
        },
        documentType: {
            type: String,
            enum: [
                'INVOICE',
                'RECEIPT',
                'QUOTATION',
                'MEMO',
                'PURCHASE_REQUEST',
                'OTHER'
            ],
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
