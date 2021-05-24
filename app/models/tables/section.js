const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const tableSectionSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    code: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 1, 'must be at least 1 characters in length.' ]
    }
}, { timestamps: true });

tableSectionSchema.virtual('tables', {
    ref: 'Table',
    localField: '_id',
    foreignField: 'section'
});

tableSectionSchema.set('toObject', { virtuals: true });
tableSectionSchema.set('toJSON', { virtuals: true });

module.exports = model('TableSection', tableSectionSchema);