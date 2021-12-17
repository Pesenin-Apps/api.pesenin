const { STATUS_ORDER, STATUS_PAYMENT, Order, TYPE_ORDER, ORDER_VIA } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const Product = require('../models/products/product');
const { Table } = require('../models/tables/tabel');
const { getUserSignedIn, getCustomerCheckedIn, getWaiterReadyToServe, getGuestCheckedIn } = require('../helpers/gets');
const { Waiter } = require('../models/waiter');
const { Customer, STATUS_CUSTOMER } = require('../models/customer');
const LinkedList = require('../helpers/queue');
const { useTable } = require('../helpers/table');
const queue = new LinkedList();


/* = = = = = = = = =   [ S T A R T ]   S O C K E T   = = = = = = = = = */

async function queues() {
    
    const listQueues = queue.print(section.toString());
    
    const orderItems = await OrderItem.find({ _id: { $in: listQueues } }).populate({
        path: 'order',
        select: 'table',
        populate: {
            path: 'table',
            select: 'name',
        }
    }).populate('product', 'name').select('-__v -price -total');
    
    const response = {
        count: orderItems.length,
        data: orderItems,
    };
    
    return response;
}

/* = = = = = = = = =   [ E N D ]   S O C K E T   = = = = = = = = = */


/* = = = = = = = = =   [ S T A R T ]   R E S T   A P I   = = = = = = = = = */

async function getQueues(req, res, next) {
    try {

        const { section } = req.query;
        const listQueues = queue.print(section.toString());
        
        const orderItems = await OrderItem.find({ _id: { $in: listQueues } }).populate({
            path: 'order',
            select: 'table',
            populate: {
                path: 'table',
                select: 'name',
            }
        }).populate('product', 'name').select('-__v -price -total');

        return res.status(200).json({
            message: 'Queues Retrived Successfully!',
            count: orderItems.length,
            data: orderItems
        });

    } catch (err) {
        next(err);
    }
}

async function getOrderCounts(req, res, next) {
    try {

        let data = {};
        const processed = [1, 2];
        const finished = [3];
        const all = [...processed, ...finished];
        let now = new Date();
        let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const allData = await Order.find({ status: {$in: all}, createdAt: {$gte: startOfToday} }).countDocuments();
        const processedData = await Order.find({ status: {$in: processed}, createdAt: {$gte: startOfToday} }).countDocuments();
        const finishedData = await Order.find({ status: {$in: finished}, createdAt: {$gte: startOfToday} }).countDocuments();

        data.all = allData;
        data.processed = processedData;
        data.finished = finishedData;

        return res.status(200).json({
            message: 'OrderCount Retrived Successfully!',
            data: data
        });

    } catch (err) {
        next(err);
    }    
}

async function getOrders(req, res, next) {
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
				order_number: {$regex: `ORDER#${search}`, $options: 'i'}
			};
		}

        if (filters) {
            if (filters.status) {
                criteria = {
                    ...criteria,
                    status: filters.status
                };
            }
            if (filters.is_paid) {
                criteria = {
                    ...criteria,
                    is_paid: filters.is_paid
                };
            }
        }

        let orders = await Order.find(criteria).populate('customer', 'fullname email').populate('guest', 'name checkin_number').populate({
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

async function getOrder(req, res, next) {
    try {

        const { id } = req.params;

        // TODO: Add Populate Customer and Guest
        const order = await Order.findById(id).populate({
            path: 'order_items',
            select: '-order',
            populate: {
                path: 'product',
                select: 'name price'
            }
        }).populate('customer', 'fullname email').populate('guest', 'name checkin_number device_detection').populate({
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

/* === START FOR GUEST === */

async function getOrderByGuest(req, res, next) {
    try {
        
        const guest = await getGuestCheckedIn(req.guest.checkin_number);

        const order = await Order.findOne({
            guest: guest._id
        }).populate({
            path: 'order_items',
            select: '-order',
            populate: {
                path: 'product',
                select: 'name price image_url'
            }
        }).populate('guest', 'name checkin_number device_detection').populate({
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

async function createOrderByGuest(req, res, next) {
    try {
        
        const { orders } = req.body;
        const guest = await getGuestCheckedIn(req.guest.checkin_number);
        const waiter = await getWaiterReadyToServe();

        if (waiter === false) {
            return res.status(404).json({
                message: 'please try some more',
            });
        }

        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        // if order is newer
        const newOrderData = {
            guest: guest._id,
            customer: null,
            status: STATUS_ORDER.CREATE,
            table: guest.table,
            waiter: waiter,
            type: TYPE_ORDER.DINE_IN,
            via: ORDER_VIA.GUEST,
        }

        // if dont found then insert else update
        let order = await Order.findOneAndUpdate(
            { guest: guest._id },
            { $setOnInsert: newOrderData },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

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

        let orderedItems = await OrderItem.insertMany(orderItems);
        orderedItems.forEach(item => order.order_items.push(item));
        await order.save();

        return res.status(201).json({
            message: 'Order Created Successfully!',
            data: order
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

async function updateOrderModifyByGuest(req, res, next) {
    try {

        const { items } = req.body;
        const guest = await getGuestCheckedIn(req.guest.checkin_number);

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let changedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');

        if (order.guest.toString() !== guest._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Change It, You\'re Forbidden!'
            });
        }

        const updatedItemIds = items.map(e => e.item);
        const updatedItems = await OrderItem.find({ _id: { $in: updatedItemIds } });

        if (updatedItems.length === 0) {
            return res.status(400).json({
                message: 'Gagal, item tidak ditemukan!',
            });
        }

        updatedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.NEW) {
                object.splice(index, 1);
                items.splice(index, 1);
            }
        });

        if (items.length === 0) {
            return res.status(400).json({
                message: 'Pesanan anda telah diproses, anda tidak dapat mengubahnya!'
            });
        }

        items.forEach(async (element) => {
            if (element.qty === 0) {
                await order.updateOne(
                    { $pull: { order_items: element.item } },
                    { useFindAndModify: false },
                );
                await OrderItem.findByIdAndDelete({ _id: element.item });
            } else {
                changedItems.push(element);
            }
        });

        if (changedItems.length === 0) {
            return res.status(200).json({
                message: 'OrderItem Deleted Successfully!',
            });
        }

        let orderedItems = changedItems.map(element => {
            let relatedItem = updatedItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "updateOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },              
                    "update": { "$set": { 
                        "qty": element.qty,
                        "total": relatedItem.price * element.qty,
                    } } 
                }
            }
        });

        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        return res.status(200).json({
            message: 'Order Updated Successfully!',
            data: order,
        });
        
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
}

async function updateOrderDeleteByGuest(req, res, next) {
    try {

        const { items } = req.body;
        const guest = await getGuestCheckedIn(req.guest.checkin_number);

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let destroyedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');

        if (order.guest.toString() !== guest._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Delete It, You\'re Forbidden!'
            });
        }

        const deletedItemIds = items.map(e => e.item);
        const deletedItems = await OrderItem.find({ _id: { $in: deletedItemIds } });

        deletedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.NEW) {
                object.splice(index, 1);
                items.splice(index, 1);
            }
        });

        if (items.length === 0) {
            return res.status(400).json({
                message: 'Pesanan anda telah diproses, anda tidak dapat menghapusnya!'
            });
        }

        items.forEach(async (element) => {
            destroyedItems.push(element);
            await order.updateOne(
                { $pull: { order_items: element.item } },
                { useFindAndModify: false },
            );
        });

        let orderedItems = destroyedItems.map((element) => {
            let relatedItem = deletedItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "deleteOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },
                },
            }
        });

        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        return res.status(200).json({
            message: 'OrderItem Deleted Successfully!',
            data: order,
        });
        
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
}

/* === END FOR GUEST === */

/* === START FOR CUSTOMER === */

async function getOrdersByCustomer(req, res, next) {
    try {
        
        let criteria = {};
        const { filters } = req.query;
        const customer = await getUserSignedIn(req.user._id);

        criteria = {
            ...criteria,
            customer: customer._id,
        };

        if (filters) {
            if (filters.status) {
                criteria = {
                    ...criteria,
                    status: filters.status
                };
            }
            if (filters.is_paid) {
                criteria = {
                    ...criteria,
                    is_paid: filters.is_paid
                };
            }
        }

        const orders = await Order.find(criteria).populate('customer', 'fullname email').populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code',
            }
        }).sort('-createdAt');

        return res.status(200).json({
            message: 'Orders Retrived Successfully!',
            data: orders
        });

    } catch (err) {
        next(err);
    }
}

async function createOrderByCustomer(req, res, next) {
    try {
        
        const { table, orders } = req.body;
        const customer = await getUserSignedIn(req.user._id);
        const waiter = await getWaiterReadyToServe();
        
        if (waiter === false) {
            return res.status(404).json({
                message: 'please try some more',
            });
        }

        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        const newOrderData = {
            guest: null,
            customer: customer._id,
            status: STATUS_ORDER.CREATE,
            table: table,
            waiter: waiter,
            type: TYPE_ORDER.DINE_IN,
            via: ORDER_VIA.CUSTOMER,
        }

        const filter = {
            table: table,
            is_paid: false,
            status : { $in: [ STATUS_ORDER.CREATE, STATUS_ORDER.PROCESSED, STATUS_ORDER.FINISH ] },
        }

        const options = {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
        
        let order = await Order.findOneAndUpdate(
            filter,
            { $setOnInsert: newOrderData },
            options,
        );

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

        let orderedItems = await OrderItem.insertMany(orderItems);
        orderedItems.forEach(async (item) => {
            order.order_items.push(item);
        });

        if (await order.save()) {
            await useTable(table);
        }

        return res.status(201).json({
            message: 'Order Stored Successfully!',
            data: order
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
}

async function updateOrderModifyByCustomer(req, res, next) {
    try {
        
        const { items } = req.body;
        const customer = await getUserSignedIn(req.user._id);

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let changedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');

        if (order.customer.toString() !== customer._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Change It, You\'re Forbidden!'
            });
        }

        const updatedItemIds = items.map(e => e.item);
        const updatedItems = await OrderItem.find({ _id: { $in: updatedItemIds } });

        if (updatedItems.length === 0) {
            return res.status(400).json({
                message: 'Gagal, item tidak ditemukan!',
            });
        }

        updatedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.NEW) {
                object.splice(index, 1);
                items.splice(index, 1);
            }
        });

        if (items.length === 0) {
            return res.status(400).json({
                message: 'Pesanan anda telah diproses, anda tidak dapat mengubahnya!',
            });
        }

        items.forEach(async (element) => {
            if (element.qty === 0) {
                await order.updateOne(
                    { $pull: { order_items: element.item } },
                    { useFindAndModify: false },
                );
                await OrderItem.findByIdAndDelete({ _id: element.item });
            } else {
                changedItems.push(element);
            }
        });

        if (changedItems.length === 0) {
            return res.status(200).json({
                message: 'OrderItem Deleted Successfully!',
            });
        }

        let orderedItems = changedItems.map(element => {
            let relatedItem = updatedItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "updateOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },              
                    "update": { "$set": { 
                        "qty": element.qty,
                        "total": relatedItem.price * element.qty,
                    } } 
                }
            }
        });

        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        return res.status(200).json({
            message: 'Order Updated Successfully!',
            data: order,
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
}

async function updateOrderDeleteByCustomer(req, res, next) {
    try {
        
        const { items } = req.body;
        const customer = await getUserSignedIn(req.user._id);


        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let destroyedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');

        if (order.customer.toString() !== customer._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Delete It, You\'re Forbidden!'
            });
        }

        const deletedItemIds = items.map(e => e.item);
        const deletedItems = await OrderItem.find({ _id: { $in: deletedItemIds } });

        if (deletedItems.length === 0) {
            return res.status(400).json({
                message: 'Gagal, item tidak ditemukan!',
            });
        }

        deletedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.NEW) {
                object.splice(index, 1);
                items.splice(index, 1);
            }
        });

        if (items.length === 0) {
            return res.status(400).json({
                message: 'Pesanan anda telah diproses, anda tidak dapat menghapusnya!'
            });
        }

        items.forEach(async (element) => {
            destroyedItems.push(element);
            await order.updateOne(
                { $pull: { order_items: element.item } },
                { useFindAndModify: false },
            );
        });

        let orderedItems = destroyedItems.map((element) => {
            let relatedItem = deletedItems.find(orderItem => orderItem._id.toString() === element.item);
            return {
                "deleteOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },
                },
            }
        });

        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        return res.status(200).json({
            message: 'OrderItem Deleted Successfully!',
            data: order,
        });

    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
}

/* === END FOR CUSTOMER === */

/* = = = = = = = = =   [ E N D ]   R E S T   A P I   = = = = = = = = = */


module.exports = {
    queues,
    getQueues,
    getOrderCounts,
    getOrders,
    getOrder,
    getOrderByGuest,
    createOrderByGuest,
    updateOrderModifyByGuest,
    updateOrderDeleteByGuest,
    getOrdersByCustomer,
    createOrderByCustomer,
    updateOrderModifyByCustomer,
    updateOrderDeleteByCustomer,
}