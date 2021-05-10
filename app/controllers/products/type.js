const Type = require('../../models/products/type');

async function index(req, res, next) {
    try {
        let types = await Type.find();
        return res.status(200).json({
            message: "Types Retrived Successfully!",
            types: types
        });
    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {
        let type = await Type.findById(req.params.id).populate('products');
        return res.status(200).json({
            message: "Type Retrived Successfully!",
            type: type
        });
    } catch (err) {
        next(err);
    }
}

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

async function update(req, res, next) {
    try {
        let payload = req.body;
        let type = await Type.findByIdAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            message: 'Type Updated Successfully!',
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

async function destroy(req, res, next) {
    try {
        let type = await Type.findOneAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'Type Deleted Successfully!',
            type: type
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    index,
    show,
    store,
    update,
    destroy
}