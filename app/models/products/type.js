const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const productTypeSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ],
        maxlength: [ 50, 'Panjang nama kategori maksimal 50 karakter' ]
    }
}, { timestamps: true });

productTypeSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'type'
});

module.exports = model('ProductType', productTypeSchema);