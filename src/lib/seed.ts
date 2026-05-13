import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth, ADMIN_EMAILS } from './firebase';
import { handleFirestoreError, OperationType } from './errorHandlers';

const PRODUCTS: any[] = [];

export const seedDatabase = async () => {
  const path = 'products';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      // Only attempt to seed if we have a user and they are admin
      if (!auth.currentUser || !auth.currentUser.email || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
        console.log('Skipping seed: Not an admin');
        return;
      }

      console.log('Seeding products...');
      for (const product of PRODUCTS) {
        await addDoc(collection(db, path), {
          ...product,
          createdAt: serverTimestamp()
        });
      }
      console.log('Seeding complete.');
    }
  } catch (error) {
    // If it's a permission error, it might be expected if not logged in
    if (error instanceof Error && error.message.includes('permission')) {
      console.log('Seed skipped: Missing permissions (expected if not logged in as admin)');
      return;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
};
