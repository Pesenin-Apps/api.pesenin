const { model, Schema } = require('mongoose');

const productSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    description: {
        type: String,
        maxlength: [ 1000, 'cannot exceed 1000 characters in length.' ]
    },
    price: {
        type: Number,
        default: 0,
        required: [ true, 'is required.' ]
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: [ true, 'is required.' ]
    },
    type: {
        type: Schema.Types.ObjectId,
        ref: 'ProductType',
        required: [ true, 'is required.' ]
    },
    is_ready: {
        type: Boolean,
        default: false
    },
    image_url: {
        type: String,
        default: null,
    }
}, { timestamps: true });

module.exports = model('Product', productSchema);