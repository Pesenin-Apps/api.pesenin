const { model, Schema } = require('mongoose');

const orderItemSchema = Schema({
    price: {
        type: Number, 
        required: [ true, 'is required.' ]
    },
    qty: {
        type: Number, 
        required: [ true, 'is required.' ],
        min: [ 1, 'must be a minimum value of 1.' ]
    },
    products: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    order: {
        type: Schema.Types.ObjectId, 
        ref: 'Order'
    }
});

module.exports = model('OrderItem', orderItemSchema);