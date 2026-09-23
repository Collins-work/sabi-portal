const mongoose = require('mongoose')

const pvSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        payee: {
            type: String,
            lowercase: true,
            required: true
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true
        },
        pvNO: {
            type: String,
            trim: true,
            required: true,
            unique: true
        },
        particulars: {
            type: [
            {
                name: {
                    type: String,
                    trim: true,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
            ],
            required: true,
            validate: {
                validator: value => value.length > 0,
                message: 'At least one particular is required'
            }
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        amountInWords: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum:[
                'Draft',
                'PENDING_HOD',
                'PENDING_ICU',
                'PENDING_CFO',
                'PENDING_MD',
                'APPROVED',
                'REJECTED'
            ],
            default: 'Draft'
        }

    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('PV', pvSchema);