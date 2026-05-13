import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const VAPID_KEY = 'BEOY-Sj-B1e_y6Wk7ZqP6S6Q6z7k7_7k7k7k7k7k7k7k'; // You would usually generate this in Firebase Console

export const requestNotificationPermission = async (userId: string, email: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        // Save token to Firestore
        await setDoc(doc(db, 'fcm_tokens', token), {
          token,
          userId,
          email,
          updatedAt: serverTimestamp(),
        });
        console.log('FCM Token registered:', token);
      }
    }
  } catch (error) {
    console.error('Notification permission error:', error);
  }
};

export const setupOnMessageListener = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Play audio alert
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.warn('Audio play blocked:', e));

    // Show toast
    toast.success(payload.notification?.title || 'New Notification', {
      duration: 6000,
      position: 'top-right',
    });
  });
};
