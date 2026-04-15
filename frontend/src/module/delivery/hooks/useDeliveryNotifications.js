import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api/config';
import { deliveryAPI } from '@/lib/api';
import alertSound from '@/assets/audio/alert.mp3';
import originalSound from '@/assets/audio/original.mp3';

export const useDeliveryNotifications = () => {
  // CRITICAL: All hooks must be called unconditionally and in the same order every render
  // Order: useRef -> useState -> useEffect -> useCallback

  // Step 1: All refs first (unconditional)
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const lastNotifiedOrderIdRef = useRef(null); // Deduplicate: track last notified order ID

  // Step 2: All state hooks (unconditional)
  const [newOrder, setNewOrder] = useState(null);
  const [orderReady, setOrderReady] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deliveryPartnerId, setDeliveryPartnerId] = useState(null);

  // Step 3: All callbacks before effects (unconditional)
  // Track user interaction for autoplay policy
  const userInteractedRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    try {
      // Get current selected sound preference from localStorage
      const selectedSound = localStorage.getItem('delivery_alert_sound') || 'zomato_tone';
      const soundFile = selectedSound === 'original' ? originalSound : alertSound;

      // Update audio source if preference changed or initialize if not exists
      if (audioRef.current) {
        const currentSrc = audioRef.current.src;
        const newSrc = soundFile;
        // Check if source needs to be updated
        if (!currentSrc.includes(newSrc.split('/').pop())) {
          audioRef.current.pause();
          audioRef.current.src = newSrc;
          audioRef.current.load();
          console.log('🔊 Audio source updated to:', selectedSound === 'original' ? 'Original' : 'Tone');
        }
      } else {
        // Initialize audio if not exists
        audioRef.current = new Audio(soundFile);
        audioRef.current.volume = 0.7;
      }

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
  }, []);

  // Step 4: All effects (unconditional hook calls, conditional logic inside)
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

  // Initialize audio on mount - use selected preference from localStorage
  useEffect(() => {
    // Get selected alert sound preference from localStorage
    const selectedSound = localStorage.getItem('delivery_alert_sound') || 'zomato_tone';
    const soundFile = selectedSound === 'original' ? originalSound : alertSound;

    if (!audioRef.current) {
      audioRef.current = new Audio(soundFile);
      audioRef.current.volume = 0.7;
      console.log('🔊 Audio initialized with:', selectedSound === 'original' ? 'Original' : 'Tone');
    } else {
      // Update audio source if preference changed
      const currentSrc = audioRef.current.src;
      const newSrc = soundFile;
      if (!currentSrc.includes(newSrc.split('/').pop())) {
        audioRef.current.pause();
        audioRef.current.src = newSrc;
        audioRef.current.load();
        console.log('🔊 Audio updated to:', selectedSound === 'original' ? 'Original' : 'Tone');
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // Note: This runs once on mount. To update dynamically, we'd need to listen to storage events

  // Fetch delivery partner ID
  useEffect(() => {
    const fetchDeliveryPartnerId = async () => {
      try {
        const response = await deliveryAPI.getCurrentDelivery();
        if (response.data?.success && response.data.data) {
          const deliveryPartner = response.data.data.user || response.data.data.deliveryPartner;
          if (deliveryPartner) {
            const id = deliveryPartner.id?.toString() ||
              deliveryPartner._id?.toString() ||
              deliveryPartner.deliveryId;
            if (id) {
              setDeliveryPartnerId(id);
              console.log('✅ Delivery Partner ID fetched:', id);
            } else {
              console.warn('⚠️ Could not extract delivery partner ID from response');
            }
          } else {
            console.warn('⚠️ No delivery partner data in API response');
          }
        } else {
          console.warn('⚠️ Could not fetch delivery partner ID from API');
        }
      } catch (error) {
        console.error('Error fetching delivery partner:', error);
      }
    };
    fetchDeliveryPartnerId();
  }, []);

  // Socket connection effect
  useEffect(() => {
    if (!deliveryPartnerId) {
      console.log('⏳ Waiting for deliveryPartnerId...');
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
    const socketUrl = `${backendUrl}/delivery`;


    // Validate socket URL format
    try {
      new URL(socketUrl); // This will throw if URL is invalid
    } catch (urlError) {
      console.error('❌ CRITICAL: Invalid Socket.IO URL:', socketUrl);
      console.error('💡 URL validation error:', urlError.message);
      console.error('💡 Backend URL:', backendUrl);
      console.error('💡 API_BASE_URL:', API_BASE_URL);
      return; // Don't try to connect with invalid URL
    }

    socketRef.current = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      upgrade: true, // Allow upgrade from polling to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      auth: {
        token: localStorage.getItem('delivery_accessToken') || localStorage.getItem('accessToken')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Delivery Socket connected, deliveryPartnerId:', deliveryPartnerId);
      setIsConnected(true);

      if (deliveryPartnerId) {
        console.log('📢 Joining delivery room with ID:', deliveryPartnerId);
        socketRef.current.emit('join-delivery', deliveryPartnerId);
      }
    });

    socketRef.current.on('delivery-room-joined', (data) => {
      console.log('✅ Delivery room joined successfully:', data);
    });

    socketRef.current.on('connect_error', (error) => {
      // Only log if it's not a network/polling/websocket error (backend might be down or WebSocket not available)
      // Socket.IO will automatically retry connection and fall back to polling
      const isTransportError = error.type === 'TransportError' ||
        error.message === 'xhr poll error' ||
        error.message?.includes('WebSocket') ||
        error.message?.includes('websocket') ||
        error.description === 0; // WebSocket upgrade failures

      if (!isTransportError) {
        console.error('❌ Delivery Socket connection error:', error);
      } else {
        // Silently handle transport errors - backend might not be running or WebSocket not available
        // Socket.IO will automatically retry with exponential backoff and fall back to polling
        // Only log in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('⏳ Delivery Socket: WebSocket upgrade failed, using polling fallback');
        }
      }
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Delivery Socket disconnected:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);

      if (deliveryPartnerId) {
        socketRef.current.emit('join-delivery', deliveryPartnerId);
      }
    });

    socketRef.current.on('new_order', (orderData) => {
      console.log('📦 New order received via socket:', orderData);
      
      // Check if delivery partner is already on a trip
      const hasActiveOrder = localStorage.getItem('activeOrder') || localStorage.getItem('deliveryActiveOrder');
      if (hasActiveOrder) {
        console.log('🚫 Ignoring new order request - delivery partner is already on an active trip');
        return;
      }

      // Deduplicate: ignore if we already showed this order
      const incomingId = orderData?.orderId || orderData?.mongoId || orderData?.orderMongoId;
      if (incomingId && lastNotifiedOrderIdRef.current === incomingId) {
        console.log('⚠️ Duplicate new_order event ignored for order:', incomingId);
        return;
      }
      if (incomingId) lastNotifiedOrderIdRef.current = incomingId;
      setNewOrder(orderData);
      playNotificationSound();
    });

    // Listen for priority-based order notifications (new_order_available)
    socketRef.current.on('new_order_available', (orderData) => {
      console.log('📦 New order available (priority notification):', orderData);
      console.log('📦 Notification phase:', orderData.phase || 'unknown');

      // Check if delivery partner is already on a trip
      const hasActiveOrder = localStorage.getItem('activeOrder') || localStorage.getItem('deliveryActiveOrder');
      if (hasActiveOrder) {
        console.log('🚫 Ignoring new order available - delivery partner is already on an active trip');
        return;
      }

      // Deduplicate: ignore if we already showed this order
      const incomingId = orderData?.orderId || orderData?.mongoId || orderData?.orderMongoId;
      if (incomingId && lastNotifiedOrderIdRef.current === incomingId) {
        console.log('⚠️ Duplicate new_order_available event ignored for order:', incomingId);
        return;
      }
      if (incomingId) lastNotifiedOrderIdRef.current = incomingId;
      // Treat it the same as new_order - delivery boy can accept it
      setNewOrder(orderData);
      playNotificationSound();
    });

    socketRef.current.on('play_notification_sound', (data) => {
      console.log('🔔 Sound notification:', data);
      playNotificationSound();
    });

    socketRef.current.on('order_ready', (orderData) => {
      console.log('✅ Order ready notification received via socket:', orderData);
      // Only set orderReady if the order isn't already out for delivery or delivered
      const currentStatus = orderData?.status;
      if (currentStatus === 'ready' || currentStatus === 'preparing') {
        setOrderReady(orderData);
        playNotificationSound();
      }
    });

    socketRef.current.on('stop_notification_sound', (data) => {
      console.log('🔇 Stopping notification sound:', data);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setNewOrder(null); // Clear the alert
    });

    socketRef.current.on('stop_sound', (data) => {
      console.log('🔇 Stopping sound:', data);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    });

    socketRef.current.on('order_accepted_by_other', (data) => {
      console.log('🔇 Order accepted by another partner:', data);
      const acceptedOrderId = data?.orderId || data?.mongoId || data?.orderMongoId;
      
      setNewOrder(prev => {
        if (!prev) return null;
        const currentId = prev.orderId || prev.mongoId || prev.orderMongoId;
        
        // Match order ID from any of the possible fields
        if (currentId === acceptedOrderId || 
            prev.orderId === data.orderId || 
            (prev.orderMongoId && prev.orderMongoId === data.orderId)) {
          console.log('✅ Clearing current order notification - already accepted by someone else');
          // Stop sound if playing
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          return null;
        }
        return prev;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [deliveryPartnerId, playNotificationSound]);

  // Helper functions
  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
    // Reset deduplication ref when order is cleared so a NEW order can be displayed
    // (but don't reset for same orderId - prevents reshowing same order from broadcast)
    lastNotifiedOrderIdRef.current = null;
  }, []);

  const clearOrderReady = useCallback(() => {
    setOrderReady(null);
  }, []);

  return {
    newOrder,
    clearNewOrder,
    orderReady,
    clearOrderReady,
    isConnected,
    playNotificationSound
  };
};
