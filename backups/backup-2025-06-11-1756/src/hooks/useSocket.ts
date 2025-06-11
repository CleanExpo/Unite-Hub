import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(userId: string) {
  // Initialize socket connection
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
    path: '/api/socket.io',
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Join user-specific room
  const joinUserRoom = useCallback(() => {
    if (userId && socket.connected) {
      socket.emit('join:user', userId);
    }
  }, [userId, socket]);

  // Join deal-specific room
  const joinDealRoom = useCallback((dealId: string) => {
    if (socket.connected) {
      socket.emit('join:deal', dealId);
    }
  }, [socket]);

  // Send message to room
  const sendMessage = useCallback((room: string, message: string) => {
    if (socket.connected) {
      socket.emit('send:message', { room, message });
    }
  }, [socket]);

  // Send notification to user
  const sendNotification = useCallback((userId: string, notification: string) => {
    if (socket.connected) {
      socket.emit('send:notification', { userId, notification });
    }
  }, [socket]);

  // Handle incoming messages
  const onMessage = useCallback((callback: (message: string) => void) => {
    socket.on('receive:message', callback);
    return () => socket.off('receive:message', callback);
  }, [socket]);

  // Handle incoming notifications
  const onNotification = useCallback((callback: (notification: string) => void) => {
    socket.on('receive:notification', callback);
    return () => socket.off('receive:notification', callback);
  }, [socket]);

  // Set up connection and clean up
  useEffect(() => {
    socket.connect();
    joinUserRoom();

    return () => {
      socket.disconnect();
    };
  }, [socket, joinUserRoom]);

  return {
    socket,
    joinDealRoom,
    sendMessage,
    sendNotification,
    onMessage,
    onNotification
  };
}
