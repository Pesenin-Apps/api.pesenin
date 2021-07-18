const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { getUserSignedIn, getCustomerCheckedIn, getWaiterReadyToServe } = require('../helpers/gets');

async function getAllOrders(req, res, next) {

    try {
        
        let filters = req.query.filters;

        if (Object.keys(req.query).length === 0) {
            filters = new Object();
        }

        let orders = await Order.find(filters.order).populate({
            path: 'order_items',
            match: filters.order_item,
            populate: {
                path: 'product'
            }
        }).populate('customer', 'name checkin_number').populate('table', 'name section number');

        return res.status(200).json({
            message: 'Orders Retrived Successfully!',
            orders: orders
        });

    } catch (err) {
        next(err);
    }

}

async function getOrderForWaiter(req, res, next) {

    try {

        let filters = req.query.filters;
        const waiter = await getUserSignedIn(req.user._id);

        
        if (Object.keys(req.query).length === 0) {
            filters = new Object();
            filters.order = {};
            filters.order_item = {};
        }
        
        filters.order = {
            ...filters.order,
            waiter: waiter.waiter._id
        }

        let orders = await Order.find(filters.order).populate({
            path: 'order_items',
            match: filters.order_item,
            populate: {
                path: 'product'
            }
        }).populate('customer', 'name checkin_number').populate('table', 'name section number');

        return res.status(200).json({
            message: 'Orders Retrived Successfully!',
            orders: orders
        });
        

    } catch (err) {
        next(err);
    }

}

module.exports = {
    getAllOrders,
    getOrderForWaiter
}