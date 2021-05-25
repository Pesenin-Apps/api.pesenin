const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { STATUS, Customer } = require('../models/customer');
const Table = require('../models/tables/tabel');
const { getToken } = require('../utils/get-token');

async function me(req, res, next) {
    try {
        let customer = req.customer;
        let table = await Table.findOne({ _id: req.customer.table }).select('name');
        customer.table = table;
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
        payload.checkin_number = 'CHECKIN#' + Date.now();
        // relationship of table
        let table = await Table.findOne({ 
            _id: req.params.tableId
        });
        if (table) {
            payload = { ...payload, table: table._id }
        } else {
            delete payload.table
        }
        let customer = new Customer(payload);
        let checkedIn = jwt.sign(payload, config.secretkey);
        customer.status = STATUS.CHECK_IN;
        customer.checkin_token = checkedIn;
        if (customer.save()) {
            let table = await Table.findOne({ _id: payload.table });
            table.used = true;
            table.save();
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