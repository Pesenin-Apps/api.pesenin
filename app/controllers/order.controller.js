const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { Waiter } = require('../models/waiter');
const Product = require('../models/products/product');
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

// TODO : add ENDPOINT order for Kitchen and manage queue
async function getOrderForKitchen(req, res, next) {
    
}

async function createOrderForCustomer(req, res, next) {

    try {
        
        // req body
        const { items } = req.body;
        // get waiter is on duty
        const waiter = await getWaiterReadyToServe();
        // customer active
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // product who ordered
        const productIds = items.map(item => item.product);
        const products = await Product.find({ _id: {$in: productIds} });

        // check if waiter exist or not
        if (waiter === false) {
            return res.status(201).json({
                message: 'Waiter not found, no one is onduty yet!'
            });
        }

        // update waiter
        await Waiter.findOneAndUpdate(
            { _id: waiter },
            { $push: {served: customer.table } },
            { useFindAndModify: false }
        );

        // new order
        let newOrder = {
            customer: customer._id,
            status: STATUS_ORDER.STORE_ORDER,
            table: customer.table,
            waiter: waiter
        }

        // table (if dont found then insert else update)
        let order = await Order.findOneAndUpdate(
            { customer: customer._id },
            { $setOnInsert: newOrder },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

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

        // save order and order items
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
    getAllOrders,
    getOrderForWaiter,
    createOrderForCustomer
}