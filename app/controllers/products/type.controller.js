const ProductType = require('../../models/products/type');

async function index(req, res, next) {
    try {

        let productTypes = await ProductType.find().sort('name');
        return res.status(200).json({
            message: "ProductTypes Retrived Successfully!",
            data: productTypes
        });

    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {

        let productType = await ProductType.findById(req.params.id).populate('products');
        return res.status(200).json({
            message: "ProductType Retrived Successfully!",
            data: productType
        });

    } catch (err) {
        next(err);
    }
}

async function store(req, res, next) {
    try {

        let payload = req.body;
        let productType = new ProductType(payload);

        await productType.save();

        return res.status(201).json({
            message: 'ProductType Stored Successfully!',
            data: productType
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
        let productType = await ProductType.findByIdAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: 'ProductType Updated Successfully!',
            data: productType
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

        let productType = await ProductType.findOneAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'ProductType Deleted Successfully!',
            data: productType
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