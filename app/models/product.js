const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const productSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    description: {
        type: String,
        maxlength: [ 1000, 'cannot exceed 1000 characters in length.' ],
    },
    price: {
        type: Number,
        default: 0,
        required: [ true, 'is required.' ],
    },
    image_url: String
}, { timestamps: true });

module.exports = model('Product', productSchema);