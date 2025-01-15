import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Convert the public VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const App = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const publicVapidKey = 'BIOOXS25u5s7CIKwFvWHTf-k9tJn3aQKVp3vbJRu_lQ1Vk_rsKfHyAXnvkRgkU92eCO8mZ-Z8qyZ_H3oqw3fY5U'; // Same key as in backend
  const admin = localStorage.getItem('admin');
  useEffect(() => {
    // Check if user is already subscribed by checking localStorage
    const userId = localStorage.getItem('userId');
    const p256dh = localStorage.getItem('p256dh');
    const auth = localStorage.getItem('auth');

    if (userId && p256dh && auth) {
      setIsSubscribed(true); // User is already subscribed
    }
  }, []);

  // Request permission for push notifications
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permission granted for notifications');
      subscribeToPushNotifications();
    } else {
      console.error('Permission denied for notifications');
    }
  };

  // Subscribe user to push notifications
  const subscribeToPushNotifications = async () => {
    // Wait for service worker registration
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  
    // Subscribe the user to push notifications
    const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
  
    // The subscription object
    const subscription = {
      endpoint: pushSubscription.endpoint,
      keys: {
        p256dh: pushSubscription.getKey('p256dh'),
        auth: pushSubscription.getKey('auth'),
      },
    };
  
    // Log the subscription details to the console, including the endpoint
    console.log('Subscription:', subscription);
    console.log('Endpoint:', pushSubscription.endpoint);
    console.log('P256dh Key:', pushSubscription.getKey('p256dh'));
    console.log('Auth Key:', pushSubscription.getKey('auth'));
  
    // Base64 encode the p256dh and auth keys
    const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(subscription.keys.p256dh)));
    const authBase64 = btoa(String.fromCharCode(...new Uint8Array(subscription.keys.auth)));
  
    console.log("p256dh:", p256dhBase64);
    console.log("auth:", authBase64);
  
    // Generate a user ID (you can dynamically generate this or retrieve it from the app state)
    const userId = uuidv4();
  
    // Save the subscription details in localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('p256dh', p256dhBase64);
    localStorage.setItem('auth', authBase64);
    localStorage.setItem('endpoint', subscription.endpoint);
  
    // Send this subscription data to your backend
    await fetch('https://web-notification-worker-backend.vercel.app/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId,
      }),
    });
  };
  

  // Button click handler to request notifications
  const handleSubscribeButtonClick = () => {
    requestNotificationPermission();
  };

  // Send notification to all users
  const handleSendNotificationButtonClick = async () => {
    const title = 'New Notification';
    const message = 'You have a new notification!';

    try {
      const response = await fetch('https://web-notification-worker-backend.vercel.app/send-notification-to-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message }),
      });

      if (response.ok) {
        console.log('Notifications sent successfully');
      } else {
        console.error('Failed to send notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  return (
    <div>
      {!isSubscribed ? (
        <button onClick={handleSubscribeButtonClick}>Subscribe to Notifications</button>
      ) : (
        <p>You are subscribed to notifications!</p>
      )}
      <div>
          {admin === 'YES' && 
          <button onClick={handleSendNotificationButtonClick}>
            Send Notification to All Users
          </button>
          }
        </div>
    </div>
  );
};

export default App;