const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { STATUS, Customer } = require('../models/customer');
const Table = require('../models/tables/tabel');
const { getNumbering } = require('../utils/get-anything');
const { getToken } = require('../utils/get-token');

async function me(req, res, next) {
    let customer = await Customer.findOne({ checkin_number: req.customer.checkin_number }).populate('table', 'name');
    return res.status(200).json({
        message: 'MyData Retrived Successfully!',
        customer: customer
    });
}

async function checkIn(req, res, next) {
    try {
        // request
        let payload = req.body;
        payload.checkin_number = getNumbering('checkin');
        // relationship of table
        let table = await Table.findOne({ 
            _id: req.params.tableId
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
        customer.status = STATUS.CHECK_IN;
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
            customer: customer
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
    let token = getToken(req);
    let customer = await Customer.findOneAndUpdate(
        { checkin_token: token },
        { status: STATUS.CHECK_OUT },
        { useFindAndModify: false }
    );
    let table = await Table.findOneAndUpdate(
        { _id: customer.table },
        { used: false },
        { useFindAndModify: false }
    );
    if (!token || !customer || !table) {
        return res.status(403).json({
            message: 'Customer Not Found'
        });
    }
    return res.status(200).json({
        message: 'Checked Out Successfully!'
    });
}

module.exports = {
    me,
    checkIn,
    checkOut
}