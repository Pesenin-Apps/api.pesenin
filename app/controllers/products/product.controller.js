const fs = require('fs')
const path = require('path');
const Product = require('../../models/products/product');
const ProductCategory = require('../../models/products/category');
const ProductType = require('../../models/products/type');
const config = require('../../config/config')

async function index(req, res, next) {
    try {
        let { page = 1, limit = 10, skip = 0, search = '' } = req.query;
        let criteria = {};

        if(search.length){
			criteria = {
				...criteria, 
				name: {$regex: `${search}`, $options: 'i'}
			}
		}

        let products = await Product.find(criteria)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('category', 'name')
            .populate('type', 'name')
            .sort('name');
        let countAll = await Product.find().countDocuments();
        
        return res.status(200).json({
            message: "Products Retrived Successfully!",
            countAll: countAll,
            countDisplay: products.length,
            pageCurrent: page,
            pageMaximum: Math.ceil(countAll / limit),
            data: products
        });
    } catch (err) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        let product = await Product.findById(req.params.id).populate('category').populate('type');
        return res.status(200).json({
            message: "Product Retrived Successfully!",
            data: product
        });
    } catch (err) {
        next(err);
    }
}

async function store(req, res, next) {
    try {
        // request 
        let payload = req.body;
        let file = req.file;
        // relationship of category
        if (payload.category) {
            let category = await ProductCategory.findOne({
                _id: payload.category
            });
            if (category) {
                payload = { ...payload, category: category._id }
            } else {
                delete payload.category
            }
        }
        // relationship of type
        if (payload.type) {
            let type = await ProductType.findOne({
                _id: payload.type
            });
            if (type) {
                payload = { ...payload, type: type._id }
            } else {
                delete payload.type
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
                data: product
            });
        }
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        // request 
        let payload = req.body;
        let file = req.file;
        // relationship of category
        if (payload.category) {
            let category = await ProductCategory.findOne({
                _id: payload.category
            });
            if (category) {
                payload = { ...payload, category: category._id }
            } else {
                delete payload.category
            }
        }
        // relationship of type
        if (payload.type) {
            let type = await ProductType.findOne({
                _id: payload.type
            });
            if (type) {
                payload = { ...payload, type: type._id }
            } else {
                delete payload.type
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
                    // fetch data
                    let product = await Product.findOne({ _id: req.params.id });
                    let fileCurrent = `${config.rootPath}/public/uploads/${product.image_url}`;
                    // destroy file current
                    if (fs.existsSync(fileCurrent)) {
                        fs.unlinkSync(fileCurrent);
                    }
                    // save
                    product = await Product.findOneAndUpdate(
                        { _id: req.params.id },
                        { ...payload, image_url: fileName },
                        { new: true, runValidators: true }
                    );
                    res.status(200).json({
                        message: 'Product Updated Successfully!',
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
            let product = await Product.findOneAndUpdate(
                { _id: req.params.id },
                payload,
                { new: true, runValidators: true}
            );
            res.status(200).json({
                message: 'Product Updated Successfully!',
                data: product
            });
        }
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }

}

async function destroy(req, res, next) {
    try {
        let product = await Product.findOneAndDelete({ _id: req.params.id });
        let fileCurrent = `${config.rootPath}/public/uploads/${product.image_url}`;
        // destroy file current
        if (fs.existsSync(fileCurrent)) {
            fs.unlinkSync(fileCurrent);
        }
        res.status(200).json({
            message: 'Product Deleted Successfully!',
            data: product
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