const mongoose = require('mongoose');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { STATUS_WAITER, Waiter } = require('../models/waiter');
const Product = require('../models/products/product');
const { getCustomerCheckedIn, getUserSignedIn, getWaiterReadyToServe } = require('../utils/get-anything');

// TODO: get data and make filters (query params)
async function getCustomerOrdersForWaiters(req, res, next) {
    try {
        let queryOrder = req.query.order, queryOrderItem = req.query.order_items;
        let user = await getUserSignedIn(req.user._id);
        queryOrder = {
            ...queryOrder,
            waiter: user.waiter._id
        }
        console.log(queryOrder);
        let orders = await Order.find(
            queryOrder ?? {
                    waiter: user.waiter._id,
                    status: {
                        $gte: STATUS_ORDER.STORE_ORDER,
                        $lte: STATUS_ORDER.ALREADY_PAID
                    }
                }
        ).populate({
            path: 'order_items',
            match: queryOrderItem,
            populate: {
                path: 'product'
            }
        }).populate('customer', 'name checkin_number')
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
        // check if waiter exist or not
        if (waiter === false) {
            return res.status(201).json({
                message: 'Waiter not found, no one is onduty yet!'
            });
        }
        // get customer has been ordered
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
                    status: STATUS_ORDER_ITEM.NEW
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
                    status: STATUS_ORDER_ITEM.NEW
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
    try {
        let orderItemIds = [];
        let user = await getUserSignedIn(req.user._id);
        let order = await Order.findOne({ 
            _id: req.params.id, 
            waiter: user.waiter._id
        }).populate({
            path: 'order_items',
            match: { 
                status: STATUS_ORDER_ITEM.NEW
            }
        });
        if (order.order_items.length == 0) {
            return res.status(400).json({
                message: 'Order In Process!'
            });
        }
        await order.updateOne({ status: STATUS_ORDER.PROCESSED });
        order.order_items.every(element => orderItemIds.push(element._id.toString()));
        await OrderItem.updateMany(
            { _id: { $in: orderItemIds } },
            { status: STATUS_ORDER_ITEM.IN_QUEUE }
        );
        // response
        return res.status(200).json({
            message: 'Order Verified Successfully!'
        });
    } catch (err) {
        next(err);
    }
}

// TODO: store for waiter (orders are forwarded directly to the kitchen)
async function storeForWaiter(req, res, next){
    try {
        const { table, items } = req.body;
        // product who ordered
        const productIds = items.map(item => item.product);
        const products = await Product.find({ _id: {$in: productIds} });
        // waiter serve
        let user = await getUserSignedIn(req.user._id);
        // order
        let order = new Order({
            _id: new mongoose.Types.ObjectId(),
            customer: null,
            status: STATUS_ORDER.STORE_ORDER,
            table: table,
            waiter: user.waiter
        });
        let orderItems = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item.product);
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: item.qty,
                total: relatedProduct.price * item.qty,
                status: STATUS_ORDER_ITEM.NEW
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
        next(err);
    }
}

module.exports = {
    getCustomerOrdersForWaiters,
    storeForCustomer,
    storeForWaiter,
    verifyCustomerOrders
}