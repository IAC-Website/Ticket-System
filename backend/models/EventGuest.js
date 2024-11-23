const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isIacStudent: { type: Boolean, default: false },
    rollNo: { type: String, unique: true },
    cnic: { type: String, unique: true },
    qrCode: { type: String },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Guest = mongoose.model('Guest', guestSchema);
module.exports = Guest;
