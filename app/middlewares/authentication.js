const jwt = require('jsonwebtoken');

const config = require('../config/app');
const { User } = require('../models/user');
const { getToken } = require('../utils/get-token');

function authorize() {
    return async function(req, res, next) {
        try {
            let token = getToken(req);
            if (!token) return next();
            req.user = jwt.verify(token, config.secretkey);
            let user = await User.findOne({ token: {$in: [token]} });
            // if user token expired or with sign in
            if (!user) {
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

module.exports = {
    authorize,
    hasRole
}