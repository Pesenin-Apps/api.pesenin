const jwt = require('jsonwebtoken');
const config = require('../config/app');
const User = require('../models/user');

const { getToken } = require('../utils/get-token');

function decodeToken() {
    return async function(req, res, next) {
        try {
            let token = getToken(req);
            if (!token) return next();
            req.user = jwt.verify(token, config.secretkey);
            let user = await User.findOne({ token: {$in: [token]} });
            // if user token expired
            if (!user) {
                return res.status(404).json({
                    message: 'Token Expired'
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
        next();
    }
}

module.exports = {
    decodeToken
}