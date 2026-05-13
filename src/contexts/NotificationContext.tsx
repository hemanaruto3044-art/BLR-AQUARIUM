import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth, ADMIN_EMAILS } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  fcmToken: string | null;
  permission: NotificationPermission;
  playAlert: () => void;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
  const lastPlayedTime = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first user interaction to help bypass browser blocks
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext initialized');
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playAlert = useCallback(() => {
    // Only play sound if user is an admin
    if (!isAdmin) {
      console.log('playAlert called but user is not admin');
      return;
    }

    // Prevent overlapping alerts within 3 seconds
    const now = Date.now();
    if (now - lastPlayedTime.current < 3000) {
      console.log('Skipping overlapping alert');
      return;
    }
    lastPlayedTime.current = now;

    console.log('Playing alert sound sequence...');

    const playSound = () => {
      const audio = new Audio(ALERT_SOUND_URL);
      audio.volume = 1.0;
      let playCount = 0;
      const MAX_PLAYS = 5;

      const playCycle = () => {
        audio.play().then(() => {
          console.log(`Alert cycle ${playCount + 1}/${MAX_PLAYS} playing`);
        }).catch(e => {
          console.error('Failed to play alert sound:', e);
          toast.error('Notification sound blocked. Click anywhere to enable sound.', {
            id: 'audio-blocked'
          });
        });
      };

      audio.onended = () => {
        playCount++;
        if (playCount < MAX_PLAYS) {
          setTimeout(playCycle, 800);
        }
      };

      playCycle();
    };

    // Try to resume AudioContext if it exists
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(playSound);
    } else {
      playSound();
    }

    toast.error('NEW ADMIN ACTION REQUIRED!', {
      duration: 15000,
      position: 'top-right',
      icon: '🚨',
      style: {
        background: '#dc2626',
        color: '#fff',
        fontWeight: '900',
        padding: '20px',
        borderRadius: '16px',
        fontSize: '18px',
        border: '4px solid #fff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }
    });
  }, [isAdmin]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined' || !messaging) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BMT-tH_XN3Z9G4_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q' // This usually needs a real VAPID key from Firebase console
        });
        
        if (token) {
          setFcmToken(token);
          // Store token in user profile if logged in
          if (auth.currentUser) {
            if (ADMIN_EMAILS.includes(auth.currentUser.email || '')) {
              await setDoc(doc(db, 'fcm_tokens', auth.currentUser.uid), {
                token,
                email: auth.currentUser.email,
                userId: auth.currentUser.uid,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          }
        }
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      toast(payload.notification?.title || 'New Alert!', {
        icon: '🔔',
        duration: 6000
      });
      playAlert();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Re-sync token if permission is already granted but user just logged in
    const syncToken = async () => {
      if (permission === 'granted' && auth.currentUser && messaging) {
        try {
          const token = await getToken(messaging, {
            vapidKey: 'BMT-tH_XN3Z9G4_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q_X9Q'
          });
          if (token) {
            if (ADMIN_EMAILS.includes(auth.currentUser.email || '')) {
              await setDoc(doc(db, 'fcm_tokens', auth.currentUser.uid), {
                token,
                email: auth.currentUser.email,
                userId: auth.currentUser.uid,
                updatedAt: serverTimestamp()
              }, { merge: true });
              console.log('FCM Token synced for admin');
            }
          }
        } catch (error) {
          console.error('Token sync error:', error);
        }
      }
    };
    syncToken();
  }, [auth.currentUser, permission]);

  useEffect(() => {
    if (isAdmin) {
      startTimeRef.current = Date.now();
      console.log('Admin session active. Monitoring from:', new Date(startTimeRef.current).toLocaleTimeString());
    }
  }, [isAdmin]);

  // Listen for new orders to play alert for admins
  useEffect(() => {
    if (!isAdmin || !user) return;

    console.log('System-wide admin listeners enabled');

    const startTime = startTimeRef.current;
    
    // Listen for new orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Skip if missing createdAt or too old
          if (!data.createdAt) return;
          
          const createdAt = data.createdAt.toMillis?.() || new Date(data.createdAt).getTime();
          if (createdAt >= startTime) {
            console.log('Real-time order detected:', change.doc.id);
            playAlert();
          }
        }
      });
    }, (error) => {
      console.error('Orders snapshot error:', error);
    });

    // Listen for new live calls
    const qCalls = query(collection(db, 'live_calls'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribeCalls = onSnapshot(qCalls, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data.createdAt) return;

          const createdAt = data.createdAt.toMillis?.() || new Date(data.createdAt).getTime();
          if (createdAt >= startTime && data.status === 'pending') {
            console.log('Real-time live call detected:', change.doc.id);
            playAlert();
          }
        }
      });
    }, (error) => {
      console.error('Calls snapshot error:', error);
    });

    // Listen for new payments
    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data.createdAt) return;

          const createdAt = data.createdAt.toMillis?.() || new Date(data.createdAt).getTime();
          if (createdAt >= startTime && data.status === 'pending') {
            console.log('Real-time payment detected:', change.doc.id);
            playAlert();
          }
        }
      });
    }, (error) => {
      console.error('Payments snapshot error:', error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCalls();
      unsubscribePayments();
      console.log('Admin notification listeners deactivated');
    };
  }, [isAdmin, user, playAlert]);

  return (
    <NotificationContext.Provider value={{ fcmToken, permission, playAlert, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
