import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('vyom_token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => console.log('Socket connected'));
    newSocket.on('disconnect', () => console.log('Socket disconnected'));
    newSocket.on('connect_error', (err) => console.error('Socket error:', err.message));

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};
