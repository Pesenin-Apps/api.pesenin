const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getToken } = require('../utils/get-token');
const { User } = require('../models/user');
const { STATUS_CUSTOMER, Customer } = require('../models/customer');
const { STATUS_GUEST, Guest } = require('../models/guest');

function authorize() {
    return async function(req, res, next) {
        try {
            let token = getToken(req);
            if (!token) return next();
            // for user
            req.user = jwt.verify(token, config.secretkey);
            let user = await User.findOne({ token: {$in: [token]} });
            // TODO: for customer (change as a member)
            req.customer = jwt.verify(token, config.secretkey);
            let customer = await Customer.findOne({ checkin_token: {$in: token} });
            // for guest
            req.guest = jwt.verify(token, config.secretkey);
            let guest = await Guest.findOne({ checkin_token: {$in: token} });
            // if user token expired or with sign in
            if (!user && !customer && !guest) {
                return res.status(401).json({
                    message: 'Sorry, You\'re Unauthorized or Token Expired'
                });
            }
        } catch (err) {
            if (err && err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: err.message
                });
            }
            next(err);
        }
        return next();
    }
}

function hasStaff(...roles) {
    return async function(req, res, next) {
        const { user } = req;
        if (user && roles.includes(user.role)) {
            next();
        } else {
            res.status(403).json({
                message: 'You\'re Forbidden'
            });
        }
    }
}

function hasRole(...roles) {
    return async function(req, res, next) {
        const { user } = req;
        if (user && roles.includes(user.role)) {
            next();
        } else {
            res.status(403).json({
                message: 'You\'re Forbidden'
            });
        }
    }
}

function hasCustomer() {
    return async function(req, res, next) {
        let customer = await Customer.findOne({ checkin_number: {$in: req.customer.checkin_number} });
        if (customer && customer.status === STATUS_CUSTOMER.CHECK_OUT) {
            res.status(401).json({
                message: 'You\'re Checked Out'
            });
        } else {
            next();
        } 
    }
}

function hasGuest() {
    return async function(req, res, next) {
        let guest = await Guest.findOne({ checkin_number: {$in: req.guest.checkin_number} });
        if (guest && guest.status === STATUS_GUEST.CHECK_OUT) {
            res.status(401).json({
                message: 'You\'re Checked-Out'
            });
        } else {
            next();
        } 
    }
}

module.exports = {
    authorize,
    hasRole,
    hasGuest,
    // role
    hasStaff,
    hasCustomer,
}