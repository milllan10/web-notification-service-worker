const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize the app
const app = express();
const port = process.env.PORT || 5000; // Use environment port for deployment

// Middleware for JSON parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up MongoDB connection

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://milanhingu9987:Bpr5ZNzQ138elQMC@cluster0.gqudu.mongodb.net/web-notification', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

// Create the Subscription model
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Allowed origins for CORS
const allowedOrigins = [
  'https://web-notification-worker-frontend.vercel.app',
  'http://localhost:3000', // Add this for local testing
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
}));

// WebPush settings
const publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'your_public_vapid_key_here';
const privateVapidKey = process.env.PRIVATE_VAPID_KEY || 'your_private_vapid_key_here';

webPush.setVapidDetails('mailto:your_email@example.com', publicVapidKey, privateVapidKey);

// Route to handle subscriptions
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription_send: subscription, userId } = req.body;

    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Subscription and userId are required' });
    }

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
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    console.log('Sending notifications to all users...');

    // Fetch all subscriptions from MongoDB
    const subscriptions = await Subscription.find();

    const promises = subscriptions.map((subscription) => {
      const payload = JSON.stringify({ title, body: message });

      return webPush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      }, payload).catch(err => {
        console.error('Error sending notification:', err);
      });
    });

    await Promise.all(promises);
    res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (err) {
    console.error('Error sending notifications:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Health check route (optional)
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Export the app for serverless deployment
module.exports = app;

// Start the server if not in a serverless environment
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
