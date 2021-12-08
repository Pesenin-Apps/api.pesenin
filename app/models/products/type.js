const { model, Schema } = require('mongoose');

const BELONG = {
    INSIDE_KITCHEN: 1,
    OUTSIDE_KITCHEN: 2,
}

const productTypeSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ],
        maxlength: [ 50, 'Panjang nama kategori maksimal 50 karakter' ]
    },
    belong: {
        type: Number,
        default: BELONG.INSIDE_KITCHEN,
    },
}, { timestamps: true });

productTypeSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'type'
});

module.exports = {
    PROCESSED_ON: BELONG,
    ProductType: model('ProductType', productTypeSchema),
}