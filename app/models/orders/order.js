const { model, Schema } = require('mongoose');
const { getNumbering } = require('../utils/get-anything');

const STATUS = {
    NOT_YET_PAID: 1,
    ALREADY_PAID: 2
}

const orderSchema = Schema({
    order_number: {
        type: String,
        default: getNumbering('order')
    },
    status: {
        type: Number,
        default: 0
    },
    customer: {
        type: Schema.Types.ObjectId, 
        ref: 'Customer'
    }
});

module.exports = {
    STATUS: STATUS,
    Order: model('Order', orderSchema)
}