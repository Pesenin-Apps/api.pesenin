const { model, Schema } = require('mongoose');
const { OrderItem } = require('./item');
const { getNumbering } = require('../../utils/get-anything');

const STATUS = {
    STORE_ORDER: 1,
    NOT_YET_PAID: 2,
    ALREADY_PAID: 3
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
    total_price: {
        type: Number,
        default: 0
    },
    customer: {
        type: Schema.Types.ObjectId, 
        ref: 'Customer'
    },
    table: {
        type: Schema.Types.ObjectId, 
        ref: 'Table'
    },
    order_items: [{
        type: Schema.Types.ObjectId, 
        ref: 'OrderItem'
    }]
});

orderSchema.virtual('items_count').get(function(){
    return this.order_items.reduce((total, item) => { return total + parseInt(item.qty)}, 0)
});

orderSchema.pre('save', async function(next) {
    const orderItems = await OrderItem.find({ _id: {$in: this.order_items} });
    this.total_price = orderItems.reduce((sum, item) => sum += item.total, 0);
    next();
});

module.exports = {
    STATUS_ORDER: STATUS,
    Order: model('Order', orderSchema)
}