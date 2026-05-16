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

const ALERT_SOUND_URL = 'https://raw.githubusercontent.com/Hemanth-22/assets/main/emergency-alert.mp3'; // Using a more reliable raw github asset or similar if possible. Actually let's use a very short system sound.
// Fallback to a different reliable URL
const RELIABLE_SOUND_URL = 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3';

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
      // Force interaction check
      const audio = new Audio();
      audio.play().then(() => {
        console.log('Audio playback capability verified');
        setIsAudioEnabled(true);
        if (pendingAlertRef.current) {
          playAlert();
          pendingAlertRef.current = false;
        }
      }).catch(() => {
        console.log('Audio still blocked');
      });
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

    // Prevent overlapping alert sessions within 15 seconds (to allow 5 cycles to finish)
    const now = Date.now();
    if (now - lastPlayedTime.current < 15000) {
      console.log('An alert session is already active or recently finished. Skipping.');
      return;
    }
    
    console.log('Initiating 5-cycle emergency alert sequence...');
    lastPlayedTime.current = now;

    const playSound = async () => {
      let playCount = 0;
      const MAX_PLAYS = 5;

      const playNextCycle = async () => {
        if (playCount >= MAX_PLAYS) {
          console.log('5-cycle alert sequence completed.');
          return;
        }

        try {
          // A more attention-grabbing alert sound URL
          const audio = new Audio('https://raw.githubusercontent.com/Hemanth-22/assets/main/emergency-alert.mp3');
          audio.volume = 1.0;
          
          audio.onended = () => {
            playCount++;
            if (playCount < MAX_PLAYS) {
              setTimeout(playNextCycle, 500); // 0.5s gap between siren bursts
            }
          };

          await audio.play();
          console.log(`EMERGENCY SIREN CYCLE ${playCount + 1}/${MAX_PLAYS}`);
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'NotReadableError') {
            console.warn('Audio blocked. Click anywhere to activate.');
            pendingAlertRef.current = true;
            setIsAudioEnabled(false);
            
            toast.error('EMERGENCY ALERT BLOCKED! Click anywhere on page to enable siren.', {
              id: 'audio-blocked-notice',
              duration: 8000,
              icon: '🔊'
            });
          } else {
            console.error('Audio failure, trying fallback beep:', err);
            try {
              const fallbackAudio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
              fallbackAudio.play();
            } catch (f) {
              console.error('All audio attempts failed');
            }
          }
        }
      };

      playNextCycle();
    };

    playSound();

    toast.error('EMERGENCY: ACTION REQUIRED IN ADMIN PANEL!', {
      duration: 12000,
      position: 'top-right',
      icon: '🚨',
      style: {
        background: '#7f1d1d',
        color: '#fff',
        fontWeight: '900',
        padding: '24px',
        borderRadius: '20px',
        border: '4px solid #ef4444',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
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

  // Listen for background events to trigger alerts for admins
  useEffect(() => {
    if (!isAdmin || !user) return;

    console.log('Background admin monitoring active');
    const updateDocRef = async (col: string, id: string) => {
      try {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, col, id), { adminAlerted: true });
      } catch (err) {
        console.error(`Failed to update ${col} alert status:`, err);
      }
    };

    // Live Calls
    const unsubscribeCalls = onSnapshot(collection(db, 'live_calls'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          if (data.status === 'pending' && !data.adminAlerted) {
            console.log('New live call detected by background listener');
            playAlert();
            updateDocRef('live_calls', change.doc.id);
          }
        }
      });
    }, (err) => console.error('Call listener error:', err));

    // Orders
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          if (data.paymentStatus === 'pending_verification' && !data.adminAlerted) {
            console.log('New order verification detected by background listener');
            playAlert();
            updateDocRef('orders', change.doc.id);
          }
        }
      });
    }, (err) => console.error('Order listener error:', err));

    // Payments
    const unsubscribePayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          if (data.status === 'pending' && !data.adminAlerted) {
            console.log('New payment detected by background listener');
            playAlert();
            updateDocRef('payments', change.doc.id);
          }
        }
      });
    }, (err) => console.error('Payment listener error:', err));

    // Test Requests
    const unsubscribeTests = onSnapshot(collection(db, 'test_requests'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data.adminAlerted) {
            console.log('Test notification detected by background listener');
            playAlert();
            updateDocRef('test_requests', change.doc.id);
          }
        }
      });
    }, (err) => console.error('Test listener error:', err));

    // Foreground FCM messages
    const unsubscribeFCM = messaging ? onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      toast(payload.notification?.title || 'New Alert!', { icon: '🔔', duration: 6000 });
      playAlert();
    }) : () => {};

    return () => {
      unsubscribeCalls();
      unsubscribeOrders();
      unsubscribePayments();
      unsubscribeTests();
      unsubscribeFCM();
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
