const mongoose = require('mongoose');

// Define a subscription schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  expirationTime: { type: Date, default: null },
});

// Create and export the model
const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
