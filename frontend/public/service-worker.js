// service-worker.js

self.addEventListener('push', (event) => {
    const payload = event.data ? event.data.json() : {};
    console.log('Payload',payload)
    const title = payload.title || 'New Notification';
    const body = payload.body || 'You have a new notification!';
    const options = {
      body: body,
      icon: '/icon.png', // Make sure you have an icon
      badge: '/badge.png', // Make sure you have a badge
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification);
    event.notification.close();
    // Optionally handle notification click
  });
  