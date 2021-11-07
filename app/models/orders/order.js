const { model, Schema } = require('mongoose');
const { OrderItem, STATUS_ORDER_ITEM } = require('./item');
const { getNumbering } = require('../../helpers/gets');
const { Waiter } = require('../waiter');

const STATUS = {
    STORE_ORDER: 1,
    PROCESSED: 2,
    // NOT_YET_PAID: 3,
    // ALREADY_PAID: 4,
    FINISH: 3,
    CANCEL: 4,
}

const PAID = {
    NOT_YET: false,
    ALREADY: true,
}

const orderSchema = Schema({
    order_number: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: 0
    },
    total_price: {
        type: Number,
        default: 0
    },
    tax: {
        type : Number,
        default: 0,
    },
    total_overall: {
        type : Number,
        default: 0,
    },
    customer: {
        type: Schema.Types.ObjectId, 
        ref: 'Customer'
    },
    is_paid: {
        type: Boolean,
        default: false,
    },
    waiter: {
        type: Schema.Types.ObjectId, 
        ref: 'Waiter'
    },
    table: {
        type: Schema.Types.ObjectId, 
        ref: 'Table'
    },
    order_items: [{
        type: Schema.Types.ObjectId, 
        ref: 'OrderItem'
    }]
}, { timestamps: true });

orderSchema.virtual('items_count').get(function(){
    return this.order_items.reduce((total, item) => { return total + parseInt(item.qty)}, 0)
});

orderSchema.pre('save', async function(next) {
    // first time for save it
    if (this.__v == 0) {
        // generate order numbering
        this.order_number = getNumbering('order');
        // serving waiter
        await Waiter.findOneAndUpdate(
            { _id: this.waiter },
            { $push: { served: this.table } },
            { useFindAndModify: false }
        );
    }
    const orderItems = await OrderItem.find({ _id: {$in: this.order_items} });
    orderItems.forEach((element) => {
        if (element.status == STATUS_ORDER_ITEM.NEW) {
            this.status = STATUS.STORE_ORDER;
        } else if (element.status == STATUS_ORDER_ITEM.IN_PROCESS || element.status == STATUS_ORDER_ITEM.IN_QUEUE) {
            this.status = STATUS.PROCESSED;
        } else {
            this.status = STATUS.FINISH;
        }
    });
    this.total_price = orderItems.reduce((sum, item) => sum += item.total, 0);
    this.tax = (10 / 100) * this.total_price;
    this.total_overall = this.total_price + this.tax;
    next();
});

module.exports = {
    STATUS_ORDER: STATUS,
    Order: model('Order', orderSchema),
    STATUS_PAYMENT: PAID,
}