import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import SendNotification from './SendNotification';

const App = () => {
  return (
    <Router>
      <nav>
        {/* <Link to="/">Home</Link> | <Link to="/send-notification">Send Notification</Link> */}
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send-notification" element={<SendNotification />} />
      </Routes>
    </Router>
  );
};

export default App;
