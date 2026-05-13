import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: any;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      setWishlistItems(items);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wishlist');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (isInWishlist(productId)) {
      return;
    }

    try {
      await addDoc(collection(db, 'wishlist'), {
        userId: user.uid,
        productId,
        createdAt: serverTimestamp()
      });
      toast.success('Added to wishlist');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'wishlist'),
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(document => 
        deleteDoc(doc(db, 'wishlist', document.id))
      );
      
      await Promise.all(deletePromises);
      toast.success('Removed from wishlist');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wishlist/${productId}`);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      isLoading
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
