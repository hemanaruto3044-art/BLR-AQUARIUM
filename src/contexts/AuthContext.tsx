import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          // Check admin status first using email (always available from auth)
          const isUserAdmin = firebaseUser.email ? ADMIN_EMAILS.includes(firebaseUser.email) : false;
          setIsAdmin(isUserAdmin);

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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-blocked') {
        toast.error('Login popup blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-by-user') {
        // Ignore user cancel
      } else {
        toast.error('Failed to log in with Google. Please try again.');
      }
      throw error;
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

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, loginAnonymous, logout }}>
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
