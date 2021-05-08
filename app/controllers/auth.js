const User = require('../models/user');

async function signUp(req, res, next) {
    try {
        const payload = req.body;
        let user = new User(payload);
        await user.save();
        return res.status(201).json({
            message: 'User Registered Successfully!',
            user: user
        });
    } catch (err) {
        if (err && err.name == 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

module.exports = {
    signUp
}