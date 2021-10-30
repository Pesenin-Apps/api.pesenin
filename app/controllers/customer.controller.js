const jwt = require('jsonwebtoken');
const { STATUS_CUSTOMER, Customer } = require('../models/customer');
const { Waiter } = require('../models/waiter');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const Table = require('../models/tables/tabel');
const config = require('../config/config');
const { getNumbering, getCustomerCheckedIn } = require('../helpers/gets');
const { getToken } = require('../utils/get-token');

async function me(req, res, next) {
    try {

        let customer = await Customer.findOne({
            checkin_number: req.customer.checkin_number
        }).populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code'
            }
        });

        return res.status(200).json({
            customer: customer
        });

    } catch (err) {
        next(err);
    }
}

async function checkIn(req, res, next) {
    try {

        // request
        let payload = req.body;
        payload.checkin_number = getNumbering('checkin');

        // relationship of table
        let table = await Table.findOne({ 
            _id: payload.table
        });

        // check table used or not
        if (table.used === true) {
            return res.status(404).json({
                message: 'This table is already occupied by other customers, please choose another'
            });
        }

        // add table to payload 
        if (table) {
            payload = { ...payload, table: table._id }
        } else {
            delete payload.table
        }

        // save data
        let checkedIn = jwt.sign(payload, config.secretkey);
        let customer = new Customer(payload);
        customer.status = STATUS_CUSTOMER.CHECK_IN;
        customer.checkin_token = checkedIn;

        if (await customer.save()) {
            await Table.findOneAndUpdate(
                { _id: payload.table },
                { used: true },
                { useFindAndModify: false }
            );
        }

        return res.status(201).json({
            message: 'Customer Checked In Successfully!',
            customer: customer,
            token: checkedIn,
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

async function checkOut(req, res, next) {
    try {

        const token = getToken(req);
        const customerCheckedIn = await getCustomerCheckedIn(req.customer.checkin_number);
        const order = await Order.findOne({ customer: customerCheckedIn._id });

        // check if order exist
        if (order) {
            if (order.status <= STATUS_ORDER.STORE_ORDER) {
                await Waiter.findOneAndUpdate(
                    { _id: order.waiter },
                    { $pull: { "served": customerCheckedIn.table } },
                    { useFindAndModify: false }
                );
                await order.updateOne({ status: STATUS_ORDER.CANCEL })
            } else {
                return res.status(400).json({
                    message: 'Your order has been processed, you cannot cancel it or checkout!'
                });
            }
        }

        // update some model
        let customer = await Customer.findOneAndUpdate(
            { checkin_token: token },
            { status: STATUS_CUSTOMER.CHECK_OUT },
            { useFindAndModify: false }
        );

        let table = await Table.findOneAndUpdate(
            { _id: customer.table },
            { used: false },
            { useFindAndModify: false }
        );

        if (!token || !customer || !table) {
            return res.status(404).json({
                message: 'Customer Not Found'
            });
        }

        return res.status(200).json({
            message: 'Checked Out Successfully!'
        });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    me,
    checkIn,
    checkOut
}