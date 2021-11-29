// Package
const jwt = require('jsonwebtoken');
// Model
const { STATUS_GUEST, Guest } = require('../models/guest');
const { STATUS_ORDER, Order } = require('../models/orders/order');
const { STATUS_TABLE, Table } = require('../models/tables/tabel');
// Config, Helper & Util
const config = require('../config/config');
const { getNumbering, getGuestCheckedIn } = require('../helpers/gets');
const { useTable, clearTable } = require('../helpers/table');
const guestCheckOut = require('../helpers/guest');
const { getToken } = require('../utils/get-token');


async function me(req, res, next) {
    try {
        const guest = await Guest.findOne({
            checkin_number: req.guest.checkin_number
        }).populate({
            path: 'table',
            select: 'name section number',
            populate: {
                path: 'section',
                select: 'name code',
            }
        });
  
        return res.status(200).json({
            data: guest,
        });
    } catch (err) {
        next(err);
    }
}

async function checkIn(req, res, next) {
    try {
        // request
        let payload = req.body;
        const table = await Table.findById(payload.table);
        payload.checkin_number = getNumbering('checkin');

        // check table exist
        if (!table) {
            return res.status(404).json({
                message: 'Table Not Found'
            });
        }

        // check status table
        if (table.status === STATUS_TABLE.USED) {
            return res.status(400).json({
                message: 'This Table has been used by another customer'
            });
        } else if (table.status === STATUS_TABLE.RESERVED) {
            return res.status(400).json({
                message: 'This Table has been reserved'
            });
        }

        // add table to payload
        if (table) {
            payload = { ...payload, table: table._id }
        } else {
            delete payload.table
        }

        // generate token check-in
        const tokenCheckIn = jwt.sign(payload, config.secretkey);

        // save data
        let guest = new Guest(payload);
        guest.status = STATUS_GUEST.CHECK_IN;
        guest.checkin_token = tokenCheckIn;

        if (await guest.save()) {
            await useTable(payload.table);
        }

        return res.status(201).json({
            message: 'Guest Checked-In Successfully!',
            data: guest,
            token: tokenCheckIn,
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
        // request data
        const token = getToken(req);
        const guestCheckedIn = await getGuestCheckedIn(req.customer.checkin_number);
        console.log(guestCheckedIn);

        // check guest has ordered
        const order = await Order.findOne({ guest: guestCheckedIn._id });
        if (order) {
            if (order.status <= STATUS_ORDER.STORE_ORDER) {
                await waiterUnserve(order.waiter, customerCheckedIn.table);
                await order.updateOne({ status: STATUS_ORDER.CANCEL });
            } else {
                return res.status(400).json({
                    message: 'Your order has been processed, you cannot cancel it or check-out!'
                });
            }
        }

        await guestCheckOut(token);
        await clearTable(guestCheckedIn.table);

        return res.status(200).json({
            message: 'Checked-Out Successfully!'
        });
    } catch (err) {
        
    }
}


module.exports = {
    me,
    checkIn,
    checkOut,
}