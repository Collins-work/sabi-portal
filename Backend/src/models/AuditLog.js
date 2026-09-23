const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema(
    {
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            immutable: true
        },
        action: {
            type: String,
            required: true,
            immutable: true
        },
        entityType: {
            type: String,
            required: true,
            immutable: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            immutable: true
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
            immutable: true
        },
        ipAddress: {
            type: String,
            trim: true,
            immutable: true
        },
        userAgent: {
            type: String,
            trim: true,
            immutable: true
        }
    },
    {
        timestamps: true,
        strict: true
    }
);

const preventAuditModification = function (next) {
    next(new Error('Audit logs are append-only and cannot be modified or deleted'));
};

auditLogSchema.pre('updateOne', preventAuditModification);
auditLogSchema.pre('findOneAndUpdate', preventAuditModification);
auditLogSchema.pre('deleteOne', preventAuditModification);
auditLogSchema.pre('findOneAndDelete', preventAuditModification);

module.exports = mongoose.model('Auditlog', auditLogSchema);
