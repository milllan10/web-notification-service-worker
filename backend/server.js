const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize the app
const app = express();
const port = 5000;

// Set up MongoDB connection
// Set up MongoDB connection
mongoose.connect('mongodb+srv://milanhingu9987:Bpr5ZNzQ138elQMC@cluster0.gqudu.mongodb.net/web-notification')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define a subscription schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: false },
    auth: { type: String, required: false },
  },
  expirationTime: { type: Date, default: null },
});

// Create and export the Subscription model
const Subscription = mongoose.model('Subscription', subscriptionSchema);

const allowedOrigins = ['https://web-notification-worker-frontend.vercel.app'];

app.use(cors({
  origin: allowedOrigins, // Add the frontend URL here
  methods: ['GET', 'POST'], // Allow required HTTP methods
}));


// WebPush settings
const publicVapidKey = 'BIOOXS25u5s7CIKwFvWHTf-k9tJn3aQKVp3vbJRu_lQ1Vk_rsKfHyAXnvkRgkU92eCO8mZ-Z8qyZ_H3oqw3fY5U';
const privateVapidKey = 'VHrgOfWXZ1uF_HHYEF5TUURixCOJ5KyNPeLeTR4CPFs';

webPush.setVapidDetails('mailto:milan@uni5.tech', publicVapidKey, privateVapidKey);

// CORS preflight request handling
app.options('*', cors());

// Route to handle subscriptions from frontend
app.post('/subscribe', async (req, res) => {
  console.log(req.body)
  const { subscription_send:subscription, userId } = req.body;
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Subscription and userId are required' });
  }

  try {
    // Save the subscription to MongoDB
    const newSubscription = new Subscription({
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      expirationTime: subscription.expirationTime || null,
    });

    // Save the new subscription document
    await newSubscription.save();
    console.log(`User subscribed: ${userId}`);

    res.status(201).json({ message: 'Subscription added' });
  } catch (err) {
    console.error('Error saving subscription:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Route to send notifications to all users
app.post('/send-notification-to-all', async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).send('Title and message are required');
  }

  console.log('Sending notifications to all users...');

  try {
    // Fetch all subscriptions from MongoDB
    const subscriptions = await Subscription.find();

    // Loop through all subscriptions and send notifications
    const promises = subscriptions.map((subscription) => {
      const payload = JSON.stringify({ title, body: message });

      return webPush.sendNotification(subscription, payload)
        .catch(err => {
          console.error('Error sending notification:', err);
          return null;
        });
    });

    // Wait for all notifications to be sent
    await Promise.all(promises);
    res.status(200).send('Notifications sent successfully');
  } catch (err) {
    console.error('Error sending notifications:', err);
    res.status(500).send('Error sending notifications');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
