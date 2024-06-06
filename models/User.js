// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    discordId: String,
    avatar: String,
    balance: { type: Number, default: 0 },
    accountType: { type: String, default: 'standard' },
    verified: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    loginDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
