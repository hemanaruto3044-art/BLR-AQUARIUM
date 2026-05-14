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
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const pendingAlertRef = useRef(false);
  const lastPlayedTime = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext and enable audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('AudioContext resumed via interaction');
          setIsAudioEnabled(true);
          if (pendingAlertRef.current) {
            console.log('Playing pending alert after interaction');
            playAlert();
            pendingAlertRef.current = false;
          }
        });
      } else {
        setIsAudioEnabled(true);
        if (pendingAlertRef.current) {
          console.log('Playing pending alert after interaction');
          playAlert();
          pendingAlertRef.current = false;
        }
      }
    };

    const handleInteraction = () => {
      enableAudio();
      // Keep listeners if you want to keep resuming, or remove if one-time is enough
      // Removing for performance, but adding keydown too
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const playAlert = useCallback(() => {
    // Only play sound if user is an admin
    if (!isAdmin) return;

    // Prevent overlapping alerts within 5 seconds
    const now = Date.now();
    if (now - lastPlayedTime.current < 5000) {
      console.log('Skipping overlapping alert (throttled)');
      return;
    }
    
    console.log('Attempting to play alert sound sequence...');

    const playSound = async () => {
      const audio = new Audio(ALERT_SOUND_URL);
      audio.volume = 1.0;
      let playCount = 0;
      const MAX_PLAYS = 5;

      const playNextCycle = () => {
        if (playCount >= MAX_PLAYS) {
          console.log('Alert sequence completed.');
          return;
        }

        audio.currentTime = 0;
        audio.play().then(() => {
          console.log(`Alert cycle ${playCount + 1}/${MAX_PLAYS} playing`);
          playCount++;
          lastPlayedTime.current = Date.now(); // Only update lastPlayed if successful
          pendingAlertRef.current = false;
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Playback blocked by browser policy. Queuing for first interaction.');
            pendingAlertRef.current = true;
            setIsAudioEnabled(false);
            
            // Only show toast once
            toast.error('Notification sound blocked. Click anywhere on the page to enable alerts.', {
              id: 'audio-blocked',
              duration: 8000,
              icon: '🔊'
            });
          } else {
            console.error('Audio playback error:', err);
          }
        });
      };

      audio.onended = () => {
        if (playCount < MAX_PLAYS) {
          setTimeout(playNextCycle, 800);
        }
      };

      playNextCycle();
    };

    playSound();

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
        border: '4px solid #fff',
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
      
      // Check for existing pending items upon opening/becoming admin
      const checkExisting = async () => {
        try {
          const { getDocs, where } = await import('firebase/firestore');
          
          // Check for pending orders
          const ordersSnap = await getDocs(query(collection(db, 'orders'), where('paymentStatus', '==', 'pending_verification'), limit(1)));
          if (!ordersSnap.empty) {
            console.log('Initial pending order found');
            playAlert();
            return;
          }

          // Check for pending calls
          const callsSnap = await getDocs(query(collection(db, 'live_calls'), where('status', '==', 'pending'), limit(1)));
          if (!callsSnap.empty) {
            console.log('Initial pending call found');
            playAlert();
            return;
          }

          // Check for pending payments
          const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('status', '==', 'pending'), limit(1)));
          if (!paymentsSnap.empty) {
            console.log('Initial pending payment found');
            playAlert();
            return;
          }
        } catch (error) {
          console.error('Error checking initial pending items:', error);
        }
      };

      // Slight delay to ensure UI is ready
      setTimeout(checkExisting, 2000);
    }
  }, [isAdmin, playAlert]);

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
