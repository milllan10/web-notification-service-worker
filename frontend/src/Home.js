import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Home = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const publicVapidKey = 'BIOOXS25u5s7CIKwFvWHTf-k9tJn3aQKVp3vbJRu_lQ1Vk_rsKfHyAXnvkRgkU92eCO8mZ-Z8qyZ_H3oqw3fY5U';
  const backendUrl = 'https://web-notification-worker-backend.vercel.app';

  useEffect(() => {
    const userId = localStorage.getItem('userId1');
    const p256dh = localStorage.getItem('p256dh');
    const auth = localStorage.getItem('auth');

    if (userId && p256dh && auth) {
      setIsSubscribed(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        subscribeToPushNotifications();
      } else {
        console.error('Permission denied for notifications');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      setLoading(true);

      const serviceWorkerRegistration = await navigator.serviceWorker.ready;

      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      const subscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: pushSubscription.getKey('p256dh'),
          auth: pushSubscription.getKey('auth'),
        },
      };

      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(subscription.keys.p256dh)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(subscription.keys.auth)));
      const userId = uuidv4();

      const subscription_send = {
        userId,
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: p256dhBase64,
          auth: authBase64,
        },
      };

      localStorage.setItem('userId1', userId);
      localStorage.setItem('p256dh', p256dhBase64);
      localStorage.setItem('auth', authBase64);
      localStorage.setItem('endpoint', subscription.endpoint);

      await fetch(`${backendUrl}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_send, userId }),
      });

      setIsSubscribed(true);
      console.log('User subscribed successfully');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : !isSubscribed ? (
          <button onClick={requestNotificationPermission}>
            Subscribe to Notifications
          </button>
        ) : (
          <p>You are subscribed to notifications!</p>
        )}
      </div>
    </div>
  );
};

export default Home;
