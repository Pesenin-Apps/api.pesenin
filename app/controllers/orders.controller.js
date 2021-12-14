const { STATUS_ORDER, STATUS_PAYMENT, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const Product = require('../models/products/product');
const { Table } = require('../models/tables/tabel');
const { getUserSignedIn, getCustomerCheckedIn, getWaiterReadyToServe } = require('../helpers/gets');
const LinkedList = require('../helpers/queue');
const { Waiter } = require('../models/waiter');
const { Customer, STATUS_CUSTOMER } = require('../models/customer');
const queue = new LinkedList();

/* ========= START NO PART OF ENDPOINT ========= */

async function queues(section) {
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

async function countingOrder() {
    const processed = [1, 2];
    const finished = [3];
    const all = [...processed, ...finished];
    let now = new Date();
    let todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allData = await Order.find({ status: {$in: all}, createdAt: {$gte: todayDate} }).countDocuments();
    const processedData = await Order.find({ status: {$in: processed}, createdAt: {$gte: todayDate} }).countDocuments();
    const finishedData = await Order.find({ status: {$in: finished}, createdAt: {$gte: todayDate} }).countDocuments();

    const response = {
        all: allData,
        processed: processedData,
        finished: finishedData,
    };

    return response;
}

/* ========= END NO PART OF ENDPOINT ========= */


/* ========= START ENDPOINT ========= */

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

async function getCountOrders(req, res, next) {
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

async function getOrder(req, res, next) {
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

async function getOrderForCustomer(req, res, next) {
    try {
        
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        
        const order = await Order.findOne({
            customer: customer._id
        }).populate({
            path: 'order_items',
            select: '-order',
            populate: {
                path: 'product',
                select: 'name price image_url'
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

        let criteria = {};
        const { filters } = req.query;
        const waiter = await getUserSignedIn(req.user._id);
        let now = new Date();
        let todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (filters) {
            if (filters.status) {
                criteria = {
                    ...criteria,
                    status: filters.status
                };
            }
        }

        criteria = {
            ...criteria,
            waiter: waiter.waiter._id,
            createdAt: {$gte: todayDate},
        };

        const orders = await Order.find(criteria).populate('customer', 'name checkin_number').populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code',
            }
        }).select('-order_items -waiter').sort('status -createdAt'); // default `-createdAt`

        return res.status(200).json({
            message: 'Orders Retrived Successfully!',
            data: orders
        });
        

    } catch (err) {
        next(err);
    }
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
            return res.status(404).json({
                message: 'please try some more',
            });
        }

        // product who ordered
        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

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

        // check waiter status
        if (user.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        // product who ordered
        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        // set new order
        const newOrder = {
            customer: null,
            status: STATUS_ORDER.PROCESSED,
            table: table,
            waiter: user.waiter
        }

        // filter for update
        const filter = {
            table: table,
            is_paid: false,
            status : { $in: [1, 2, 3] },
        }

        // order (if dont found then insert else update)
        let order = await Order.findOneAndUpdate(
            filter,
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
        orderedItems.forEach(async (item) => {
            order.order_items.push(item);
            const product = await Product.findOne({_id: item.product}).populate('type', '_id');
            queue.push(item._id.toString(), product.type._id.toString());
        });

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

        // check waiter status
        if (user.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

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
        order.order_items.every(async (element) => {
            orderItemIds.push(element._id.toString());
            const product = await Product.findOne({_id: element.product}).populate('type', '_id');
            queue.push(element._id.toString(), product.type._id.toString());
        });

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

// TODO: NEED REVIEW
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

        // check waiter status
        if (staff.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

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
                let destoryItem = await OrderItem.findByIdAndDelete({ _id: element.item });
                if (destoryItem.status === STATUS_ORDER_ITEM.IN_QUEUE) {
                    queue.destroy(element.item.toString());
                }
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

async function destroyOrderItemForWaiter(req, res, next) {
    try {
        const { items } = req.body;
        
        // waiter who serve
        const staff = await getUserSignedIn(req.user._id);

        // check waiter status
        if (staff.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        // check if orders is empty
        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Not Found!'
            });
        }

        // variable for the item to be changed
        let destroyedItems = [];
        // get order
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');
        // order item to chenged
        const udeletedItemIds = items.map(e => e.item);
        const deletedItems = await OrderItem.find({ _id: { $in: udeletedItemIds } });

        // remove item when status more than status IN_QUEUE
        deletedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.IN_QUEUE) {
                object.splice(index, 1);
                items.splice(index, 1)
            }
        });

        // check order who serve
        if (order.waiter.toString() !== staff.waiter._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Dalete It, Only The Waiter Who Serves Can Delete It!'
            });
        }

        items.forEach(async (element) => {
            destroyedItems.push(element);
        });

        let orderedItems = destroyedItems.map((element) => {
            let relatedItem = deletedItems.find(orderItem => orderItem._id.toString() === element.item);
            if (relatedItem.status === STATUS_ORDER_ITEM.IN_QUEUE) {
                queue.destroy(relatedItem._id.toString());
            }
            return {
                "deleteOne": { 
                    "filter": { 
                        "_id": relatedItem._id,
                    },
                },
            }
        });

        // save order and order items
        await OrderItem.bulkWrite(orderedItems);
        await order.save();

        // response
        return res.status(200).json({
            message: 'Order Deleted Successfully!',
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

async function updateOrderItem(req, res, next) {
    try {
        
        const { id } = req.params;
        const payload = req.body;
        let orderItemStatuses = [];
        
        if (payload.status == STATUS_ORDER_ITEM.FINISH) {
            queue.destroy(id.toString());
        }

        let orderItem = await OrderItem.findByIdAndUpdate(
            { _id: id },
            payload,
            { new: false, runValidators: true }
        );

        let order = await Order.findById(orderItem.order).populate('order_items');
        order.order_items.forEach((element) => orderItemStatuses.push(element.status));
        let result = Math.min.apply(null, orderItemStatuses);

        if (result == STATUS_ORDER_ITEM.FINISH) {
            await order.updateOne({ status: STATUS_ORDER.FINISH });
        }

        return res.status(200).json({
            message: 'OrderItem Updated Successfully!',
            data: orderItem
        });

    } catch (err) {
        next(err);
    }
}

async function checkOutCustomerByWaiter(req, res, next) {
    try {
        
        let orderItemInProcess = [];
        const staff = await getUserSignedIn(req.user._id);

        // check waiter status
        if (staff.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        const order = await Order.findById(req.params.id).populate('order_items');

        // check if order empty
        if (!order) {
            return res.status(404).json({
                message: 'Order not Found',
            });
        }

        order.order_items.forEach((item) => {
            if (item.status >= STATUS_ORDER_ITEM.IN_PROCESS) {
                orderItemInProcess.push(item);
            }
        });

        // check if order exist
        if (order.status <= STATUS_ORDER.PROCESSED && orderItemInProcess.length == 0) {
            await Waiter.findOneAndUpdate(
                { _id: staff.waiter._id },
                { $pull: { "served": order.table } },
                { useFindAndModify: false }
            );
            await order.updateOne({ status: STATUS_ORDER.CANCEL });
            order.order_items.forEach(item => queue.destroy(item._id.toString()));
        } else {
            return res.status(400).json({
                message: 'Customer order has been processed, you cannot cancel it or customer are checked out!'
            });
        }
        
        if (order.customer !== null) {
            await Customer.findOneAndUpdate(
                { _id: order.customer },
                { status: STATUS_CUSTOMER.CHECK_OUT },
                { useFindAndModify: false }
            );
        }

        let table = await Table.findOneAndUpdate(
            { _id: order.table },
            { used: false },
            { useFindAndModify: false }
        );

        if (!table) {
            return res.status(404).json({
                message: 'Table not Found',
            });
        }

        return res.status(200).json({
            message: 'Cancel or Checked Out Successfully!'
        });

    } catch (err) {
        next(err);
    }
}

async function updateOrder(req, res, next) {
    try {

        const id = req.params.id;
        let payload = req.body;
        
        const order = await Order.findOneAndUpdate(
            { _id: id },
            payload,
            { new: true, runValidators: true },
        );

        if (payload.is_paid === STATUS_PAYMENT.ALREADY) {

            // update waiter
            await Waiter.findOneAndUpdate(
                { _id: order.waiter },
                { $pull: { "served": order.table } },
                { useFindAndModify: false }
            );

            // update customer
            if (order.customer != null) {
                await Customer.findOneAndUpdate(
                    { _id: order.customer },
                    { status: STATUS_CUSTOMER.CHECK_OUT },
                    { useFindAndModify: false }
                );
            }

            // update table
            await Table.findOneAndUpdate(
                { _id: order.table },
                { used: false },
                { useFindAndModify: false }
            );

        }

        return res.status(200).json({
            message: 'Order Updated Successfully!',
            data: order
        });

    } catch (err) {
        next(err);
    }
}

/* ========= END ENDPOINT ========= */


module.exports = {
    queues,
    countingOrder,
    getQueues,
    getCountOrders,
    getAllOrders,
    getOrder,
    getOrderForCustomer,
    getOrderForWaiter,
    createOrderForCustomer,
    createOrderForWaiter,
    verifyCustomerOrder,
    updateOrderForCustomer,
    updateOrderForWaiter,
    updateOrderItem,
    destroyOrderItemForWaiter,
    checkOutCustomerByWaiter,
    updateOrder,
}