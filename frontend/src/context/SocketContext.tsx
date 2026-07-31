import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

interface SocketContextValue {
  socket: Socket | null;
  latestNotification: Notification | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, latestNotification: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!token || !user) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, { auth: { token } });

    newSocket.on('notification:new', (notification: Notification) => {
      setLatestNotification(notification);
      toast(notification.title, { icon: '🔔' });
    });

    newSocket.on('notification:broadcast', (payload: Notification) => {
      setLatestNotification(payload);
      toast(payload.title, { icon: '📢' });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?._id]);

  return <SocketContext.Provider value={{ socket, latestNotification }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
