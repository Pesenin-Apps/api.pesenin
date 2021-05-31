const mongoose = require('mongoose');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const Product = require('../models/products/product');
const { getCustomerCheckedIn } = require('../utils/get-anything');

async function storeForCustomer(req, res, next) {
    try {
        // req body declaration
        const { items } = req.body;
        // customer active
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // product who ordered
        const productIds = items.map(item => item.product);
        const products = await Product.find({ _id: {$in: productIds} });
        // check customer has been ordered or not
        let customerOrders = await Order.findOne({ customer: customer._id });
        // if customerOrders is null then save order and order item, else only order items will be saved
        if (customerOrders === null) {
            // order
            let order = new Order({
                _id: new mongoose.Types.ObjectId(),
                customer: customer._id,
                status: STATUS_ORDER.STORE_ORDER,
                table: customer.table
            });
            //  order items
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
        } else {
            // order items
            let orderItems = items.map(item => {
                let relatedProduct = products.find(product => product._id.toString() === item.product);
                return {
                    order: customerOrders.customer,
                    product: relatedProduct.id,
                    price: relatedProduct.price,
                    qty: item.qty,
                    total: relatedProduct.price * item.qty,
                    status: STATUS_ORDER_ITEM.IN_QUEUE
                }
            });
            let orderedItems = await OrderItem.insertMany(orderItems);
            orderedItems.forEach(item => customerOrders.order_items.push(item));
            await customerOrders.save();
            // response
            return res.status(201).json({
                message: 'OrderItem Stored Successfully!',
                order: customerOrders
            });
        }
    } catch (err) {
        next(err)
    }
}

module.exports = {
    storeForCustomer
}