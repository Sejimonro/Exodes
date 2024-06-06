// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    pending: {
        type: Number,
        default: 0
    },
    successful: {
        type: Number,
        default: 0
    },
    canceled: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
