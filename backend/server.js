const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors('http://localhost:3000/'));
app.use(bodyParser.json());

const publicVapidKey = 'BIOOXS25u5s7CIKwFvWHTf-k9tJn3aQKVp3vbJRu_lQ1Vk_rsKfHyAXnvkRgkU92eCO8mZ-Z8qyZ_H3oqw3fY5U';
const privateVapidKey = 'VHrgOfWXZ1uF_HHYEF5TUURixCOJ5KyNPeLeTR4CPFs';

webPush.setVapidDetails('mailto:milan@uni5.tech', publicVapidKey, privateVapidKey);

// Array to store subscriptions (in production, this should be a database)
let subscriptions = [
  {
    userId: 'ecb274d3-66f8-4310-a0e3-8ba276cd5571',
    endpoint: 'https://fcm.googleapis.com/fcm/send/dsDo55l0GuI:APA91bEyFBPaKgBugPS69OLqLQ49yZMh8NyfXdbKpSpU8EtSuAxAvTJMLF1K0hXXglU5P3sHxzK4ZhrGoyKw1Gd3JdgmkD-X_dyzCyGvPbUGei9sVsgVrfd-76edxUzHhMg99vN5vMH-',
    expirationTime: null,
    keys: {
      p256dh: 'BE3kUrNX1o/ZJ3BB78v20PnjTIHGaiBXju5IhsCT0+DbO3F5DY+nOlPv8fTLDsCFGNK5DGrS39g0dxnvWqzL6k0=',
      auth: 'UZPnb3Qi8Cj3rkjzE5RxvQ=='
    }
  },
  {
    userId: '83414c58-4a72-45c3-94d0-bfb3afc5839b',
    endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABnh4Ni-BGp0pOStQOipxUDhCCSph8nERgmb8bbJEJU52l9pgJmBd3Y8Xt3IsPzhDxOUBUZpIidXo_HMq_Ynw4pruHwMNPDpyvRXjz-tbl-V5e4ywYg39KniTkbxfka39-_3I1YwR84iW-fE-oZJjGckITOIpTs3GUBoQYfUoN9w6RxNo4',
    expirationTime: null,
    keys: {
      p256dh: 'BOdqL0n7UXg3Y90JFaybLqt3iLAOLYPs8YaGi1lR/zEzIin3UNQRPx/WF5478zPPe+JIhMozUDQzQFf1pO2EH4w=',
      auth: 'i/aFEv+VW+baekJTtyhPEg=='
    }
  },
];

// Handle preflight OPTIONS requests (for CORS)
app.options('*', cors());  // This will allow preflight requests

// Route to handle subscriptions from frontend
app.post('/subscribe', (req, res) => {
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
        return res.status(400).json({ error: 'Subscription and userId are required' });
    }

    // Store the subscription along with userId
    subscriptions.push({ ...subscription, userId });
    console.log(`User subscribed: ${userId}`);
    res.status(201).json({ message: 'Subscription added' });
});

// Route to send notifications to all users
app.post('/send-notification-to-all', (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).send('Title and message are required');
    }

    console.log('Sending notifications to all users...');

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
    Promise.all(promises)
        .then(() => res.status(200).send('Notifications sent successfully'))
        .catch(err => res.status(500).send('Error sending notifications'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
