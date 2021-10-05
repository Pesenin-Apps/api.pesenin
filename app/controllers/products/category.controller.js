const ProductCategory = require('../../models/products/category');

async function index(req, res, next) {
    try {
        let categories = await ProductCategory.find();
        return res.status(200).json({
            message: "Categories Retrived Successfully!",
            data: categories
        });
    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {
        let productCategory = await ProductCategory.findById(req.params.id).populate('products');
        return res.status(200).json({
            message: "ProductCategory Retrived Successfully!",
            data: productCategory
        });
    } catch (err) {
        next(err);
    }
}

async function store(req, res, next) {
    try {
        let payload = req.body;
        let productCategory = new ProductCategory(payload);
        await productCategory.save();
        return res.status(201).json({
            message: 'ProductCategory Stored Successfully!',
            data: productCategory
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
        let productCategory = await ProductCategory.findByIdAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            message: 'ProductCategory Updated Successfully!',
            data: productCategory
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
        let productCategory = await ProductCategory.findOneAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'ProductCategory Deleted Successfully!',
            data: productCategory
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