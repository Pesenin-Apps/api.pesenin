const Category = require('../models/category');

// TODO: Get all data categories
async function index(req, res, next) {
    
}

// TODO: Get one data category by id
async function show(req, res, next) {

}

async function store(req, res, next) {
    try {
        let payload = req.body;
        let category = new Category(payload);
        await category.save();
        return res.status(201).json({
            message: 'Category Stored Successfully!',
            category: category
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
        let category = await Category.findByIdAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            message: 'Category Updated Successfully!',
            category: category
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
        let category = await Category.findOneAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'Category Deleted Successfully!',
            category: category
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