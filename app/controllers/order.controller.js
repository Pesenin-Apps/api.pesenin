const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { Waiter } = require('../models/waiter');
const Product = require('../models/products/product');
const Table = require('../models/tables/tabel');
const { getUserSignedIn, getCustomerCheckedIn, getWaiterReadyToServe } = require('../helpers/gets');

async function getAllOrders(req, res, next) {
    try {
        
        let criteria = {};
        let skipCol, limitCol  = 0;
        let { page, limit } = req.query;
        const { filters, search = '', period } = req.query;

        if (period !== "all") {
            if (!page || !limit) {
                return res.status(400).json({
                    message: 'Enter Params Page and Limit!'
                });
            }
            skipCol = (parseInt(page) - 1) * parseInt(limit);
            limitCol = parseInt(limit);
        }

        if(search.length){
			criteria = {
				...criteria,
				order_number: {$regex: `${search}`, $options: 'i'}
			};
		}

        if (filters) {
            if (filters.status) {
                criteria = {
                    ...criteria,
                    status: filters.status
                };
            }
        }

        let orders = await Order.find(criteria).populate('customer', 'name checkin_number').populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code',
            }
        }).sort('-createdAt').skip(skipCol).limit(limitCol);

        let count = await Order.find(criteria).countDocuments();

        return res.status(200).json({
            message: 'Orders Retrived Successfully!',
            count: count,
            pageCurrent: parseInt(page),
            pageMaximum: Math.ceil(count / limit),
            data: orders
        });

    } catch (err) {
        next(err);
    }
}

async function getAllOrder(req, res, next) {
    try {
        
        const { id } = req.params;

        const order = await Order.findById(id).populate({
            path: 'order_items',
            select: '-order',
            populate: {
                path: 'product',
                select: 'name price'
            }
        }).populate('customer', 'name checkin_number device_detection').populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code'
            }
        }).populate({
            path: 'waiter',
            select: 'waiter',
            populate: {
                path: 'users',
                select: 'fullname email'
            }
        });

        return res.status(200).json({
            message: 'Order Retrived Successfully!',
            data: order,
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
        const { orders } = req.body;
        // customer active
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);

        // get waiter is on duty
        const waiter = await getWaiterReadyToServe();
        // check if waiter exist or not
        if (waiter === false) {
            return res.status(201).json({
                message: 'Waiter not found, no one is onduty yet!'
            });
        }

        // product who ordered
        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        // update waiter
        await Waiter.findOneAndUpdate(
            { _id: waiter },
            { $push: { served: customer.table } },
            { useFindAndModify: false }
        );

        // new order
        const newOrder = {
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
        let orderItems = orders.map(element => {
            let relatedProduct = products.find(product => product._id.toString() === element.item);
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: element.qty,
                total: relatedProduct.price * element.qty,
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
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function createOrderForWaiter(req, res, next) {
    try {
        
        // request body
        const { table, orders } = req.body;
        // waiter serve
        const user = await getUserSignedIn(req.user._id);
        // product who ordered
        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        // update waiter
        await Waiter.findOneAndUpdate(
            { _id: user.waiter },
            { $push: {served: table } },
            { useFindAndModify: false }
        );

        // set new order
        const newOrder = {
            customer: null,
            status: STATUS_ORDER.PROCESSED,
            table: table,
            waiter: user.waiter
        }

        // order (if dont found then insert else update)
        let order = await Order.findOneAndUpdate(
            { table: table },
            { $setOnInsert: newOrder },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        // order items
        let orderItems = orders.map(element => {
            let relatedProduct = products.find(product => product._id.toString() === element.item);
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: element.qty,
                total: relatedProduct.price * element.qty,
                status: STATUS_ORDER_ITEM.IN_QUEUE
            }
        });

        // save order and order items
        let orderedItems = await OrderItem.insertMany(orderItems);
        orderedItems.forEach(item => order.order_items.push(item));

        if (await order.save()) {
            await Table.findOneAndUpdate(
                { _id: table },
                { used: true },
                { useFindAndModify: false }
            );
        }

        // response
        return res.status(201).json({
            message: 'Order and OrderItem Stored Successfully!',
            order: order
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function verifyCustomerOrder(req, res, next) {
    try {
        
        // variable for save order item ids
        let orderItemIds = [];
        // waiter serve
        const user = await getUserSignedIn(req.user._id);

        // get order
        let order = await Order.findOne({ 
            _id: req.params.id, 
            waiter: user.waiter._id
        }).populate({
            path: 'order_items',
            match: { 
                status: STATUS_ORDER_ITEM.NEW
            }
        });

        // check if order items empty
        if (order.order_items.length == 0) {
            return res.status(400).json({
                message: 'Order In Process!'
            });
        }

        // update order and order items
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
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function updateOrderForCustomer(req, res, next) {
    try {
        
        // variable set will be updated
        let updatedItems = [];
        // req body
        const { orders } = req.body;

        // check if orders is empty
        if (!orders || orders.length === 0) {
            return res.status(400).json({
                message: 'Order Items Not Found!'
            });
        }

        // customer active
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // get order
        let order = await Order.findOne({ 
            customer: customer._id,
            table: customer.table
        });
        
        // check if order more than store status
        if (order.status > STATUS_ORDER.STORE_ORDER) {
            return res.status(400).json({
                message: 'You Can\'t Change It Anymore, Only The Waiter Can Change!'
            });
        }

        // // product who ordered
        const orderItemIds = orders.map(e => e.item);
        const orderItems = await OrderItem.find({ _id: {$in: orderItemIds} });

        orders.forEach(async (element) => {
            updatedItems.push(element);
            if (element.qty === 0) {
                await order.updateOne(
                    { $pull: { "order_items": element.item } },
                    { useFindAndModify: false }
                );
                await OrderItem.findByIdAndDelete({ _id: element.item });
            }
        });

        // // order items
        let orderedItems = updatedItems.map(element => {
            let relatedItem = orderItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "updateOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },              
                    "update": { "$set": { 
                        "qty": element.qty,
                        "total": relatedItem.price * element.qty
                    } } 
                }
            }
        });

        // save order and order items
        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        // response
        return res.status(200).json({
            message: 'Order Updated Successfully!',
            order: order
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function updateOrderForWaiter(req, res, next) {
    try {
        
        // request body
        const { items } = req.body;
        // waiter who serve
        const staff = await getUserSignedIn(req.user._id);

        // check if orders is empty
        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Not Found!'
            });
        }

        // variable for the item to be changed
        let changedItems = [];
        // get order
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');
        // order item to chenged
        const updatedItemIds = items.map(e => e.item);
        const updatedItems = await OrderItem.find({ _id: { $in: updatedItemIds } });

        // remove item when status more than status IN_QUEUE
        updatedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.IN_QUEUE) {
                object.splice(index, 1);
                items.splice(index, 1)
            }
        });

        // check order who serve
        if (order.waiter.toString() !== staff.waiter._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Change It, Only The Waiter Who Serves Can Change!'
            });
        }

        items.forEach(async (element) => {
            changedItems.push(element);
            if (element.qty === 0) {
                await order.updateOne(
                    { $pull: { "order_items": element.item } },
                    { useFindAndModify: false }
                );
                await OrderItem.findByIdAndDelete({ _id: element.item });
            }
        });

        // order items
        let orderedItems = changedItems.map(element => {
            let relatedItem = updatedItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "updateOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },              
                    "update": { "$set": { 
                        "qty": element.qty,
                        "total": relatedItem.price * element.qty
                    } } 
                }
            }
        });

        // save order and order items
        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        // response
        return res.status(200).json({
            message: 'Order Updated Successfully!',
            order: order
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function updateOrderForKitchen(req, res, next) {
    try {
        
        const { item } = req.body;

        let orderItem = await OrderItem.findOne({ _id: item });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllOrders,
    getAllOrder,
    getOrderForWaiter,
    createOrderForCustomer,
    createOrderForWaiter,
    verifyCustomerOrder,
    updateOrderForCustomer,
    updateOrderForWaiter
}