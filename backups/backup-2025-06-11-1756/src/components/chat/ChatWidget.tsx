import React, { useState } from 'react';
import { sendMessage } from '../../services/chatService';

const ChatWidget = () => {
  const [message, setMessage] = useState('');

  const handleMessageSubmit = async () => {
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Proper error handling code should be implemented here
    }
  };

  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleMessageSubmit}>Send</button>
    </div>
  );
};

export default ChatWidget;