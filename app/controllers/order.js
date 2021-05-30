const mongoose = require('mongoose');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const Product = require('../models/products/product');
const { getCustomerCheckedIn } = require('../utils/get-anything');

async function store(req, res, next) {
    try {
        // req body declaration
        const { items } = req.body;
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // save order
        const productIds = items.map(item => item.product);
        const products =  await Product.find({ _id: {$in: productIds} })
        let order = new Order({
            _id: new mongoose.Types.ObjectId(),
            customer: customer._id,
            status: STATUS_ORDER.STORE_ORDER,
            table: customer.table
        });
        // save items
        let orderItems = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item.product);
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: item.qty,
                total: relatedProduct.price * item.qty,
                status: STATUS_ORDER_ITEM.IN_QUEUE
            }
        });
        let orderedItems = await OrderItem.insertMany(orderItems);
        orderedItems.forEach(item => order.order_items.push(item));
        await order.save();
        // response
        return res.status(201).json({
            message: 'Order and OrderItem Stored Successfully!',
            order: order
        });
    } catch (err) {
        next(err)
    }
}

module.exports = {
    store
}