const fs = require('fs')
const path = require('path');

const config = require('../config/app')
const Product = require('../models/product');
const Category = require('../models/category');

async function index(req, res, next) {
    try {
        let products = await Product.find()
            .populate('category')
        return res.status(200).json({
            message: "Products Retrieved Successfully!",
            products: products
        });
    } catch (err) {
        next(error)
    }
}

async function store(req, res, next) {
    try {
        // request 
        let payload = req.body;
        let file = req.file;
        // relationship of category
        if (payload.category) {
            let category = await Category.findOne({
                _id: payload.category
            });
            if (category) {
                payload = { ...payload, category: category._id }
            } else {
                delete payload.category
            }
        }
        // store and upload data
        if (file) {
            // file declaration
            let filePathTmp = file.path;
            let ogExtension = file.originalname.split('.')[file.originalname.split('.').length - 1];
            let fileName = file.filename + '.' + ogExtension;
            let filePathTarget = path.resolve(config.rootPath, `public/uploads/${fileName}`);
            // stream file
            const src = fs.createReadStream(filePathTmp);
            const dest = fs.createWriteStream(filePathTarget);
            src.pipe(dest);
            // save and upload data
            src.on('end', async () => {
                try {
                    let product = new Product({ ...payload, image_url: fileName });
                    await product.save();
                    return res.status(201).json({
                        message: 'Product Stored Successfully!',
                        product: product
                    });
                } catch (err) {
                    // if failed, destroy file uploaded
                    fs.unlinkSync(filePathTarget);
                    // check if error due MongoDB validation
                    if (err && err.name === 'ValidationError') {
                        return res.status(400).json({
                            message: err.message,
                            fields: err.errors
                        });
                    }
                    next(err);
                }
            });
            // error condition
            src.on('error', async () => {
                next(err);
            });
        } else {
            // if file not exists
            let product = new Product(payload);
            await product.save();
            return res.status(201).json({
                message: 'Product Stored Successfully!',
                product: product
            });
        }
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
    index,
    store
}