const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const typeSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ],
        maxlength: [ 50, 'Panjang nama kategori maksimal 50 karakter' ]
    }
}, { timestamps: true });

typeSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'type'
});

typeSchema.set('toObject', { virtuals: true });
typeSchema.set('toJSON', { virtuals: true });

module.exports = model('Type', typeSchema);