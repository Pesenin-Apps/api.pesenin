const mongoose = require('mongoose');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { STATUS_WAITER, Waiter } = require('../models/waiter');
const Product = require('../models/products/product');
const { getCustomerCheckedIn, getUserSignedIn, getWaiterReadyToServe } = require('../utils/get-anything');

// TODO: get data and make filters (query params)
async function getCustomerOrdersForWaiters(req, res, next) {
    try {
        const payload = req.params;
        let user = await getUserSignedIn(req.user._id);
        let orders = await Order.find({ 
                waiter: user.waiter._id,
                status: {
                    $gte: STATUS_ORDER.STORE_ORDER,
                    $lte: STATUS_ORDER.ALREADY_PAID
                }
            })
            .populate({
                path: 'order_items',
                populate: {
                    path: 'product'
                }
            })
            .populate('customer', 'name checkin_number')
            .populate('table', 'name section number');
        return res.status(200).json({
            message: "CustomerOrders Retrived Successfully!",
            orders: orders
        });
    } catch (err) {
        next(err);
    }
}

async function storeForCustomer(req, res, next) {
    try {
        // req body declaration
        const { items } = req.body;
        // customer active
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // product who ordered
        const productIds = items.map(item => item.product);
        const products = await Product.find({ _id: {$in: productIds} });
        // get waiter is on duty
        let waiter = await getWaiterReadyToServe();
        // check customer has been ordered or not
        let customerOrders = await Order.findOne({ customer: customer._id });
        // if customerOrders is null then save order and order item, else only order items will be saved
        if (customerOrders === null) {
            // update waiter
            await Waiter.findOneAndUpdate(
                { _id: waiter },
                { $push: {served: customer.table } },
                { useFindAndModify: false }
            );
            // order
            let order = new Order({
                _id: new mongoose.Types.ObjectId(),
                customer: customer._id,
                status: STATUS_ORDER.STORE_ORDER,
                table: customer.table,
                waiter: waiter
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

// TODO: verify customer orders
async function verifyCustomerOrders(req, res, next) {

}

// TODO: store for waiter (orders are forwarded directly to the kitchen)
async function storeForWaiter(req, res, next){

}

module.exports = {
    getCustomerOrdersForWaiters,
    storeForCustomer
}