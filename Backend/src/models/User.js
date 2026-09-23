const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            unique: true
        },
        username: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            required: true,
        },
        employeeId: {
            type: String,
            trim: true,
            required: true,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true
        },
        role: {
            type: String,
            enum: ['STAFF', 'HOD', 'ICU', 'CFO', 'MD', 'ADMIN'],
            default: 'STAFF'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);