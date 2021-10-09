const { model, Schema } = require('mongoose');

const STATUS = {
    ON_DUTY: true,
    OFF_DUTY: false
}

const waiterSchema = Schema({
    waiter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: Boolean,
        default: false
    },
    served: [{
        type: Schema.Types.ObjectId, 
        ref: 'Table'
    }],
});

waiterSchema.virtual('users', {
    ref: 'User',
    localField: 'waiter',
    foreignField: '_id',
    justOne: true
});

waiterSchema.set('toObject', { virtuals: true });
waiterSchema.set('toJSON', { virtuals: true });

module.exports = {
    STATUS_WAITER: STATUS,
    Waiter: model('Waiter', waiterSchema)
}