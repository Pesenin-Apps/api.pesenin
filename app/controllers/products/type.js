const Type = require('../../models/products/type');

async function store(req, res, next) {
    try {
        let payload = req.body;
        let type = new Type(payload);
        await type.save();
        return res.status(201).json({
            message: 'Type Stored Successfully!',
            type: type
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(404).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

module.exports = {
    store
}