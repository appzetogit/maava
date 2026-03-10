import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api/config';
import { restaurantAPI } from '@/lib/api';
import alertSound from '@/assets/audio/alert.mp3';

/**
 * Hook for restaurant to receive real-time order notifications with sound
 * @returns {object} - { newOrder, playSound, isConnected }
 */
export const useRestaurantNotifications = () => {
  const socketRef = useRef(null);
  const [newOrder, setNewOrder] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef(null);
  const userInteractedRef = useRef(false); // Track user interaction for autoplay policy
  const [restaurantId, setRestaurantId] = useState(null);
  const lastConnectErrorLogRef = useRef(0);
  const CONNECT_ERROR_LOG_THROTTLE_MS = 10000;

  // Get restaurant ID from API
  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const response = await restaurantAPI.getCurrentRestaurant();
        if (response.data?.success && response.data.data?.restaurant) {
          const restaurant = response.data.data.restaurant;
          const id = restaurant._id?.toString() || restaurant.restaurantId;
          setRestaurantId(id);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      }
    };
    fetchRestaurantId();
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      console.log('⏳ Waiting for restaurantId...');
      return;
    }

    // Normalize backend URL
    let backendUrl = API_BASE_URL;

    // Remove /api and trailing slashes reliably
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');

    // Safety check: ensure proto://
    if (!backendUrl.includes('://') && (backendUrl.startsWith('http') || backendUrl.startsWith('https'))) {
      backendUrl = backendUrl.replace(/^(https?):?\/?\/?/, '$1://');
    }

    // Detect environment
    const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendIsLocalhost = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');

    // Block localhost backend in production if frontend is not localhost
    if (isProduction && backendIsLocalhost && !isLocalhost) {
      console.error('❌ CRITICAL: Blocked Socket.IO connection to localhost in production.');
      setIsConnected(false);
      return;
    }

    if (!backendUrl.startsWith('http')) {
      console.error('❌ CRITICAL: Invalid backend URL:', backendUrl);
      setIsConnected(false);
      return;
    }


    // Construct Socket.IO URL
    const socketUrl = `${backendUrl}/restaurant`;

    // Validate socket URL format
    try {
      const urlTest = new URL(socketUrl); // This will throw if URL is invalid
      // Additional validation: ensure it's not localhost in production
      if (isProduction && !isLocalhost && (urlTest.hostname === 'localhost' || urlTest.hostname === '127.0.0.1')) {
        console.error('❌ CRITICAL: Socket URL contains localhost in production!');
        console.error('💡 Socket URL:', socketUrl);
        setIsConnected(false);
        return;
      }
    } catch (urlError) {
      console.error('❌ CRITICAL: Invalid Socket.IO URL:', socketUrl);
      console.error('💡 URL validation error:', urlError.message);
      console.error('💡 Backend URL:', backendUrl);
      console.error('💡 API_BASE_URL:', API_BASE_URL);
      setIsConnected(false);
      return; // Don't try to connect with invalid URL
    }

    console.log('🔌 Attempting to connect to Socket.IO:', socketUrl);
    console.log('🔌 Backend URL:', backendUrl);
    console.log('🔌 API_BASE_URL:', API_BASE_URL);
    console.log('🔌 Restaurant ID:', restaurantId);
    console.log('🔌 Environment:', import.meta.env.MODE);
    console.log('🔌 Is Production Build:', isProductionBuild);
    console.log('🔌 Is Production Deployment:', isProductionDeployment);

    // Initialize socket connection to restaurant namespace
    // Use polling only to avoid repeated "WebSocket connection failed" when backend is down
    socketRef.current = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'], // Allow websocket, fallback to polling
      upgrade: true, // Allow upgrade from polling to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      auth: {
        token: localStorage.getItem('restaurant_accessToken') || localStorage.getItem('accessToken')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Restaurant Socket connected, restaurantId:', restaurantId);
      console.log('✅ Socket ID:', socketRef.current.id);
      console.log('✅ Socket URL:', socketUrl);
      setIsConnected(true);

      // Join restaurant room immediately after connection with retry
      if (restaurantId) {
        const joinRoom = () => {
          console.log('📢 Joining restaurant room with ID:', restaurantId);
          socketRef.current.emit('join-restaurant', restaurantId);

          // Retry join after 2 seconds if no confirmation received
          setTimeout(() => {
            if (socketRef.current?.connected) {
              console.log('🔄 Retrying restaurant room join...');
              socketRef.current.emit('join-restaurant', restaurantId);
            }
          }, 2000);
        };

        joinRoom();
      } else {
        console.warn('⚠️ Cannot join restaurant room: restaurantId is missing');
      }
    });

    // Listen for room join confirmation
    socketRef.current.on('restaurant-room-joined', (data) => {
      console.log('✅ Restaurant room joined successfully:', data);
      console.log('✅ Room:', data?.room);
      console.log('✅ Restaurant ID in room:', data?.restaurantId);
    });

    // Listen for connection errors (throttle logs to avoid console spam on reconnect loops)
    socketRef.current.on('connect_error', (error) => {
      const now = Date.now();
      const shouldLog = now - lastConnectErrorLogRef.current >= CONNECT_ERROR_LOG_THROTTLE_MS;
      if (shouldLog) {
        lastConnectErrorLogRef.current = now;
        const isTransportError = error.type === 'TransportError' || error.message?.includes('xhr poll error');
        console.warn(
          'Restaurant Socket:',
          isTransportError
            ? `Cannot reach backend at ${backendUrl}. Ensure the backend is running (e.g. npm run dev in backend).`
            : error.message
        );
        if (!isTransportError) {
          console.warn('Details:', { type: error.type, socketUrl, backendUrl });
        }
      }
      if (error.message?.includes('CORS') || error.message?.includes('Not allowed')) {
        console.warn('💡 Add frontend URL to CORS_ORIGIN in backend .env');
      }
      setIsConnected(false);
    });

    // Listen for disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Restaurant Socket disconnected:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // Server disconnected the socket, reconnect manually
        socketRef.current.connect();
      }
    });

    // Listen for reconnection attempts
    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // Listen for successful reconnection
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);

      // Rejoin restaurant room after reconnection
      if (restaurantId) {
        socketRef.current.emit('join-restaurant', restaurantId);
      }
    });

    // Listen for new order notifications
    socketRef.current.on('new_order', (orderData) => {
      console.log('📦 New order received:', orderData);
      setNewOrder(orderData);

      // Play notification sound
      playNotificationSound();
    });

    // Listen for sound notification event
    socketRef.current.on('play_notification_sound', (data) => {
      console.log('🔔 Sound notification:', data);
      playNotificationSound();
    });

    // Listen for order status updates
    socketRef.current.on('order_status_update', (data) => {
      console.log('📊 Order status update:', data);
      // You can handle status updates here if needed
    });

    // Load notification sound
    audioRef.current = new Audio(alertSound);
    audioRef.current.volume = 0.7;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [restaurantId]);

  // Track user interaction for autoplay policy
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // Listen for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        // Only play if user has interacted with the page (browser autoplay policy)
        if (!userInteractedRef.current) {
          console.log('🔇 Audio playback skipped - user has not interacted with page yet');
          return;
        }

        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          // Don't log autoplay policy errors as they're expected
          if (!error.message?.includes('user didn\'t interact') && !error.name?.includes('NotAllowedError')) {
            console.warn('Error playing notification sound:', error);
          }
        });
      }
    } catch (error) {
      // Don't log autoplay policy errors
      if (!error.message?.includes('user didn\'t interact') && !error.name?.includes('NotAllowedError')) {
        console.warn('Error playing sound:', error);
      }
    }
  };

  const clearNewOrder = () => {
    setNewOrder(null);
  };

  return {
    newOrder,
    clearNewOrder,
    isConnected,
    playNotificationSound
  };
};

