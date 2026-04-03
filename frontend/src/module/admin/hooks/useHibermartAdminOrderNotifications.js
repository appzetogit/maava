import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api/config';

const buildBackendRoot = () => {
  let backendUrl = API_BASE_URL || '';
  backendUrl = backendUrl.replace(/\/api\/?$/, '');
  backendUrl = backendUrl.replace(/\/+$/, '');
  return backendUrl;
};

export const useHibermartAdminOrderNotifications = ({ onNewOrder } = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const backendRoot = buildBackendRoot();
    if (!backendRoot || !backendRoot.startsWith('http')) return;

    const socketUrl = `${backendRoot}/admin`;
    socketRef.current = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      auth: {
        token: localStorage.getItem('admin_accessToken') || localStorage.getItem('accessToken')
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-admin', { scope: 'hibermart' });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('hibermart_new_order', (payload) => {
      if (typeof onNewOrder === 'function') onNewOrder(payload);
    });

    socketRef.current.on('connect_error', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [onNewOrder]);

  return { isConnected };
};

