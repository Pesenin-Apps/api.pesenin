const { model, Schema } = require('mongoose');

const productCategorySchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ],
        maxlength: [ 50, 'Panjang nama kategori maksimal 50 karakter' ]
    }
}, { timestamps: true });

productCategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category'
});

productCategorySchema.set('toObject', { virtuals: true });
productCategorySchema.set('toJSON', { virtuals: true });

module.exports = model('ProductCategory', productCategorySchema);