const { ROLE } = require('../models/user');

function me(req, res, next) {
    if (!req.user) {
        return res.status(403).json({
            message: 'Your\'re not signin or token expired',
        });
    }
    return res.status(200).json({
        user: req.user,
        token: req.headers.authorization,
        role: ROLE.CASHIER
    });
}

module.exports = {
    me
}