const Product = require('../models/products/product');
const { STATUS_ORDER, STATUS_PAYMENT, TYPE_ORDER, ORDER_VIA, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const { STATUS_RESERVATION, SERVING_TYPE, RESERVATION_CONFIRM, Reservation } = require('../models/orders/reservation');
const { STATUS_GUEST, Guest } = require('../models/guest');
const { PROCESSED_ON } = require('../models/products/type');
const { getUserSignedIn, getWaiterReadyToServe, getGuestCheckedIn, getNumbering } = require('../helpers/gets');
const { useTable, clearTable } = require('../helpers/table');
const { waiterUnserve } = require('../helpers/waiter');
const LinkedList = require('../helpers/queue');
const queue = new LinkedList();


/* = = = = = = = = =   [ S T A R T ]   S O C K E T   = = = = = = = = = */

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

        const order = await Order.findById(id).populate({
            path: 'order_items',
            select: '-order',
            populate: {
                path: 'product',
                select: 'name price image_url',
                populate: {
                    path: 'type',
                    select: 'name belong',
                }
            },
        }).populate('customer', 'fullname email phone').populate('guest', 'name checkin_number device_detection').populate({
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

async function updateOrder(req, res, next) {
    try {

        let payload = req.body;
        const { id } = req.params;

        const order = await Order.findOneAndUpdate(
            { _id: id },
            payload,
            { new: true, runValidators: true },
        );

        if (payload.is_paid === STATUS_PAYMENT.ALREADY) {

            await waiterUnserve(order.waiter, order.table);

            if (order.guest !== null) {
                await Guest.findOneAndUpdate(
                    { _id: order.guest },
                    { status: STATUS_GUEST.CHECK_OUT },
                    { useFindAndModify: false }
                );
            }

            await clearTable(order.table);

        }

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

async function updateOrderItem(req, res, next) {
    try {
        
        const { id } = req.params;
        const payload = req.body;
        
        let orderItemStatuses = [];

        let orderItem = await OrderItem.findByIdAndUpdate(
            { _id: id },
            payload,
            { new: false, runValidators: true }
        ).populate({
            path: 'product',
            select: 'type',
            populate: {
                path: 'type',
                select: 'belong',
            }
        });

        if (payload.status == STATUS_ORDER_ITEM.FINISH && orderItem.product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
            queue.destroy(id.toString());
        }

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

/* === END FOR GUEST === */

/* === START FOR CUSTOMER === */

async function getOrdersByCustomer(req, res, next) {
    try {
        
        let criteria = {};
        let limitCol = 0;
        const { filters, limit } = req.query;
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

        if (limit) {
            limitCol = parseInt(limit);
        }

        const orders = await Order.find(criteria).populate('customer', 'fullname email').populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code',
            }
        }).select('-order_items -waiter').sort('-createdAt').limit(limitCol);

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

async function cancelOrderByCustomer(req, res, next) {
    try {
        
        const { id } = req.params;
        const customer = await getUserSignedIn(req.user._id);

        let countItemProcessed = 0;
        const order = await Order.findOne({ _id: id }).populate('order_items');

        if (order.customer.toString() !== customer._id.toString()) {
            return res.status(403).json({
                message: 'You Can\'t Cancel It, You\'re Forbidden!'
            });
        }

        order.order_items.forEach((element) => {
            if (element.status > STATUS_ORDER_ITEM.NEW) {
                countItemProcessed++;
            }
        });

        if (order.status <= STATUS_ORDER.CREATE && countItemProcessed === 0) {
            await waiterUnserve(order.waiter, order.table);
            await order.updateOne({ status: STATUS_ORDER.CANCEL });
            await clearTable(order.table);
        } else {
            return res.status(400).json({
                message: 'Pesanan anda telah diproses, anda tidak dapat membatalkannya!',
            });
        }

        return res.status(200).json({
            message: 'Order Canceled Successfully!',
        });

    } catch (err) {
        next(err);
    }
}

// START RESERVATION FEATURES //

async function createReservationByCustomer(req, res, next) {
    try {

        let payload = req.body;
        const customer = await getUserSignedIn(req.user._id);

        const productIds = payload.orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        const dataOrder = {
            order_number: getNumbering('order'),
            guest: null,
            customer: customer._id,
            status: STATUS_ORDER.CREATE,
            table: null,
            waiter: null,
            type: TYPE_ORDER.RESERVATION,
            via: ORDER_VIA.CUSTOMER,
        }

        let order = new Order(dataOrder);
        
        const dataReservation = {
            order: order._id,
            datetime_plan: payload.datetime_plan,
            number_of_people: payload.number_of_people,
            section_table: payload.section_table,
            status: STATUS_RESERVATION.CREATE,
            serving_type: payload.serving_type,
            reservartion_confirm: null,
        }
        
        if (payload.serving_type === SERVING_TYPE.BY_CONFIRMATION) {
            dataReservation.reservartion_confirm = RESERVATION_CONFIRM.WAITING;
        }

        let reservation = new Reservation(dataReservation);

        let orderItems = payload.orders.map(element => {
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

        await order.save();
        await reservation.save();

        return res.status(201).json({
            message: 'Reservation Stored Successfully!',
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

// END RESERVATION FEATURES //

/* === END FOR CUSTOMER === */

/* === START FOR WAITER === */

async function getOrdersByWaiter(req, res, next) {
    try {
        
        let criteria = {};
        const { filters } = req.query;
        const waiter = await getUserSignedIn(req.user._id);

        let now = new Date();
        let todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        criteria = {
            ...criteria,
            waiter: waiter.waiter._id,
            createdAt: { $gte: todayDate },
        };

        if (filters) {
            if (filters.status) {
                criteria = {
                    ...criteria,
                    status: filters.status
                };
            }
        }

        const orders = await Order.find(criteria).populate('customer', 'fullname email').populate('guest', 'name checkin_number').populate({
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

async function verifyOrderByWaiter(req, res, next) {
    try {
        
        let orderItemIds = [];
        const { id } = req.params;
        const waiter = await getUserSignedIn(req.user._id);

        if (waiter.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        let order = await Order.findOne({ 
            _id: id, 
            waiter: waiter.waiter._id
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
        order.order_items.every(async (element) => {
            orderItemIds.push(element._id.toString());
            const product = await Product.findOne({_id: element.product}).populate('type', '_id belong');
            if (product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
                queue.push(element._id.toString(), product.type._id.toString());
            }
        });

        await OrderItem.updateMany(
            { _id: { $in: orderItemIds } },
            { status: STATUS_ORDER_ITEM.IN_QUEUE }
        );

        return res.status(200).json({
            message: 'Order Verified Successfully!'
        });

    } catch (err) {
        next(err);
    }
}

async function createOrderByWaiter(req, res, next) {
    try {
        
        const { table, orders } = req.body;
        const waiter = await getUserSignedIn(req.user._id);

        if (waiter.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        const productIds = orders.map(e => e.item);
        const products = await Product.find({ _id: {$in: productIds} });

        const newOrderData = {
            guest: null,
            customer: null,
            status: STATUS_ORDER.PROCESSED,
            table: table,
            waiter: waiter.waiter._id,
            type: TYPE_ORDER.DINE_IN,
            via: ORDER_VIA.WAITER,
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

        let orderItems = orders.map((element) => {
            let relatedProduct = products.find((product) => product._id.toString() === element.item);
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: element.qty,
                total: relatedProduct.price * element.qty,
                status: STATUS_ORDER_ITEM.IN_QUEUE
            }
        });

        let orderedItems = await OrderItem.insertMany(orderItems);
        orderedItems.forEach(async (item) => {
            order.order_items.push(item);
            const product = await Product.findOne({_id: item.product}).populate('type', '_id belong');
            if (product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
                queue.push(item._id.toString(), product.type._id.toString());
            }
        });

        if (await order.save()) {
            await useTable(table);
        }

        return res.status(201).json({
            message: 'Order Stored Successfully!',
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

async function updateOrderModifyByWaiter(req, res, next) {
    try {

        const { items } = req.body;
        const waiter = await getUserSignedIn(req.user._id);

        if (waiter.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let changedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');
        
        if (order.waiter.toString() !== waiter.waiter._id.toString()) {
            return res.status(403).json({
                message: 'Anda tidak dapat mengubah, anda tidak memiliki hak akses!'
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
            if (element.status > STATUS_ORDER_ITEM.IN_QUEUE) {
                object.splice(index, 1);
                items.splice(index, 1);
            }
        });

        if (items.length === 0) {
            return res.status(400).json({
                message: 'Pesanan telah diproses, anda tidak dapat mengubahnya!',
            });
        }

        items.forEach(async (element) => {
            if (element.qty === 0) {
                await order.updateOne(
                    { $pull: { order_items: element.item } },
                    { useFindAndModify: false },
                );
                let destoryItem = await OrderItem.findByIdAndDelete({ _id: element.item }).populate({
                    path: 'product',
                    select: 'type',
                    populate: {
                        path: 'type',
                        select: 'belong',
                    }
                });
                if (destoryItem.status === STATUS_ORDER_ITEM.IN_QUEUE && destoryItem.product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
                    queue.destroy(element.item.toString());
                }
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

async function updateOrderDeleteByWaiter(req, res, next) {
    try {

        const { items } = req.body;
        const waiter = await getUserSignedIn(req.user._id);

        if (waiter.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Order Items Is Empty!'
            });
        }

        let destroyedItems = [];
        let order = await Order.findOne({ _id: req.params.id }).populate('order_items');

        if (order.waiter.toString() !== waiter.waiter._id.toString()) {
            return res.status(403).json({
                message: 'Anda tidak dapat menghapus, anda tidak memiliki hak akses!'
            });
        }

        const deletedItemIds = items.map(e => e.item);
        const deletedItems = await OrderItem.find({ _id: { $in: deletedItemIds } }).populate({
            path: 'product',
            select: 'type',
            populate: {
                path: 'type',
                select: 'belong',
            }
        });

        if (deletedItems.length === 0) {
            return res.status(400).json({
                message: 'Gagal, item tidak ditemukan!',
            });
        }

        deletedItems.forEach((element, index, object) => {
            if (element.status > STATUS_ORDER_ITEM.IN_QUEUE) {
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
            let relatedItem = deletedItems.find((orderItem) => orderItem._id.toString() === element.item);
            if (relatedItem.status === STATUS_ORDER_ITEM.IN_QUEUE && relatedItem.product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
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

async function cancelOrderByWaiter(req, res, next) {
    try {
        
        const { id } = req.params;
        const waiter = await getUserSignedIn(req.user._id);

        if (waiter.waiter.status === false) {
            return res.status(403).json({
                message: 'You\'re off duty now'
            });
        }

        let countItemProcessed = 0;
        const order = await Order.findOne({ _id: id }).populate({
            path: 'order_items',
            populate: {
                path: 'product',
                select: 'type',
                populate: {
                    path: 'type',
                    select: 'belong',
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                message: 'Pesanan tidak ditemukan!',
            });
        }

        if (order.waiter.toString() !== waiter.waiter._id.toString()) {
            return res.status(403).json({
                message: 'Tidak dapat membatalkan, anda tidak memiliki hak akses!'
            });
        }

        order.order_items.forEach((element) => {
            if (element.status > STATUS_ORDER_ITEM.IN_PROCESS) {
                countItemProcessed++;
            }
        });

        if (order.status <= STATUS_ORDER.PROCESSED && countItemProcessed === 0) {
            await waiterUnserve(waiter.waiter._id, order.table);
            await order.updateOne({ status: STATUS_ORDER.CANCEL });
            order.order_items.forEach((item) => {
                if (item.status === STATUS_ORDER_ITEM.IN_QUEUE && item.product.type.belong === PROCESSED_ON.INSIDE_KITCHEN) {
                    queue.destroy(item._id.toString());
                }
            });
        } else {
            return res.status(400).json({
                message: 'Pesanan telah diproses, anda tidak dapat membatalkannya!',
            });
        }

        if (order.guest !== null) {
            await Guest.findOneAndUpdate(
                { _id: order.guest },
                { status: STATUS_GUEST.CHECK_OUT },
                { useFindAndModify: false }
            );
        }

        await clearTable(order.table);

        return res.status(200).json({
            message: 'Order Canceled Successfully!',
        });

    } catch (err) {
        next(err);
    }
}

/* === END FOR WAITER === */

/* = = = = = = = = =   [ E N D ]   R E S T   A P I   = = = = = = = = = */


module.exports = {
    queues,
    getQueues,
    getOrderCounts,
    getOrders,
    getOrder,
    updateOrder,
    updateOrderItem,
    getOrderByGuest,
    createOrderByGuest,
    updateOrderModifyByGuest,
    updateOrderDeleteByGuest,
    getOrdersByCustomer,
    createOrderByCustomer,
    updateOrderModifyByCustomer,
    updateOrderDeleteByCustomer,
    cancelOrderByCustomer,
    createReservationByCustomer,
    getOrdersByWaiter,
    verifyOrderByWaiter,
    createOrderByWaiter,
    updateOrderModifyByWaiter,
    updateOrderDeleteByWaiter,
    cancelOrderByWaiter,
}