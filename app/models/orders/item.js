const { model, Schema } = require('mongoose');

const STATUS = {
    NEW: 1,
    IN_QUEUE: 2,
    IN_PROCESS: 3,
    FINISH: 4
}

const orderItemSchema = Schema({
    status: {
        type: Number, 
        default: 0
    },
    price: {
        type: Number, 
        required: [ true, 'is required.' ]
    },
    qty: {
        type: Number, 
        required: [ true, 'is required.' ],
        min: [ 1, 'must be a minimum value of 1.' ]
    },
    total: {
        type: Number, 
        required: [ true, 'is required.' ]
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    order: {
        type: Schema.Types.ObjectId, 
        ref: 'Order'
    }
});

module.exports = {
    STATUS_ORDER_ITEM: STATUS,
    OrderItem: model('OrderItem', orderItemSchema)
}