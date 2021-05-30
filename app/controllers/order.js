const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_ORDER_ITEM, OrderItem } = require('../models/orders/item');
const Product = require('../models/products/product');
const { getCustomerCheckedIn } = require('../utils/get-anything');

async function store(req, res, next) {
    try {
        let totalPrice = 0;
        // req body declaration
        const { items } = req.body;
        const customer = await getCustomerCheckedIn(req.customer.checkin_number);
        // save order
        let order = new Order();
        order.customer = customer._id;
        order.status = STATUS_ORDER.STORE_ORDER;
        order.table = customer.table;
        await order.save();
        // save items
        const productIds = items.map(item => item.product);
        const products =  await Product.find({ _id: {$in: productIds} })
        let orderItems = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item.product);
            totalPrice += relatedProduct.price * item.qty;
            return {
                order: order._id,
                product: relatedProduct.id,
                price: relatedProduct.price,
                qty: item.qty,
                total: relatedProduct.price * item.qty,
                status: STATUS_ORDER_ITEM.IN_QUEUE
            }
        });
        await OrderItem.insertMany(orderItems);
        // update total price
        await Order.findOneAndUpdate(
            { _id: order._id },
            { total_price: totalPrice },
            { useFindAndModify: false }
        );
        order.order_items = orderItems;
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