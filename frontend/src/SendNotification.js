import React, { useState } from 'react';
import './index.css'; // Import the CSS file

const SendNotification = () => {
  const [title, setTitle] = useState('Test');
  const [message, setMessage] = useState('Desctiption');
  const [loading, setLoading] = useState(false);
//   const backendUrl = 'http://localhost:5000';
  const backendUrl = 'https://web-notification-worker-backend.vercel.app'; // Use environment variable

  const handleSendNotification = async () => {
    if (!title || !message) {
      alert('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/send-notification-to-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });

      if (response.ok) {
        // setTitle('');
        // setMessage('');
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Send Notification</h1>
        <input
          type="text"
          placeholder="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Notification Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSendNotification} disabled={loading}>
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  );
};

export default SendNotification;
