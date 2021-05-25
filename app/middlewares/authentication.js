const jwt = require('jsonwebtoken');

const config = require('../config/app');
const { User } = require('../models/user');
const { STATUS, Customer } = require('../models/customer');
const { getToken } = require('../utils/get-token');

function authorize() {
    return async function(req, res, next) {
        try {
            let token = getToken(req);
            if (!token) return next();
            // for user
            req.user = jwt.verify(token, config.secretkey);
            let user = await User.findOne({ token: {$in: [token]} });
            // for customer
            req.customer = jwt.verify(token, config.secretkey);
            let customer = await Customer.findOne({ checkin_token: {$in: token} });
            // if user token expired or with sign in
            if (!user && !customer) {
                return res.status(404).json({
                    message: 'Sorry, You\'re Unauthorized or Token Expired'
                });
            }
        } catch (err) {
            if (err && err.name === 'JsonWebTokenError') {
                return res.status(403).json({
                    message: err.message
                });
            }
            next(err);
        }
        return next();
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
        if (customer && customer.status === STATUS.CHECK_OUT) {
            res.status(403).json({
                message: 'You\'re Checked Out'
            });
        } else {
            next();
        } 
    }
}

module.exports = {
    authorize,
    hasRole,
    hasCustomer
}