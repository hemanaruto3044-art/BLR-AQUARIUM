import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, ADMIN_EMAILS } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          const isManual = localStorage.getItem('isManualAdmin') === 'true';
          const isEmailAdmin = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email);
          const isUserAdmin = isEmailAdmin || isManual;
          
          if (isManual) {
            // Force document sync for the current session's UID
            const adminDocRef = doc(db, 'admins', firebaseUser.uid);
            await setDoc(adminDocRef, {
              email: firebaseUser.email || 'guest-admin',
              syncedAt: serverTimestamp(),
              isManual: true
            }, { merge: true });

            // Also redundant role sync
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, { 
              role: 'admin',
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          
          setIsAdmin(!!isUserAdmin);

          // Sync user to Firestore - handle offline gracefully
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || null,
              displayName: firebaseUser.displayName || 'Guest',
              photoURL: firebaseUser.photoURL || null,
              role: isUserAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('offline')) {
            console.warn("Firestore is offline, user profile sync delayed:", error.message);
          } else {
            handleFirestoreError(error, OperationType.WRITE, path);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error Details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
      });
      
      if (error.code === 'auth/popup-blocked') {
        toast.error('Login popup blocked! Please allow popups for this site in your browser settings.');
      } else if (error.code === 'auth/cancelled-by-user') {
        toast.error('Login cancelled.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(`Domain "${window.location.hostname}" is not authorized. Add it to Firebase Console > Auth > Settings.`);
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silently handle if another request took over
      } else {
        toast.error(`Login failed: ${error.message || 'Unknown error'}`);
      }
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginAnonymous = async () => {
    try {
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Anonymous login error:", error);
      toast.error('Failed to sign in as guest.');
      throw error;
    }
  };

  const verifyAdminPassword = async (password: string) => {
    if (password === 'blrkumar' && user) {
      try {
        // 1. Add user to admins collection
        const adminDocRef = doc(db, 'admins', user.uid);
        await setDoc(adminDocRef, {
          email: user.email || 'guest-admin',
          addedAt: serverTimestamp(),
          isManual: true
        });

        // 2. Also update role in users collection for redundant rule checks
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { 
          role: 'admin',
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        setIsAdmin(true);
        localStorage.setItem('isManualAdmin', 'true');
        return true;
      } catch (error) {
        console.error("Error granting admin access:", error);
        return false;
      }
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('isManualAdmin');
    setIsAdmin(false);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, loginAnonymous, logout, verifyAdminPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
