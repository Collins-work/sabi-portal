const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true
        },
        code: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true
        },
        hod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);