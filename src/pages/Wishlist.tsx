import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useWishlist } from '../contexts/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
}

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, isLoading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const productPromises = wishlistItems.map(async (item) => {
          const docRef = doc(db, 'products', item.productId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Product;
          }
          return null;
        });

        const results = await Promise.all(productPromises);
        setProducts(results.filter((p): p is Product => p !== null));
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
        toast.error('Failed to load wishlist products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [wishlistItems]);

  if (wishlistLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-sky-300 animate-pulse">Diving into your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
          <Heart className="w-8 h-8 text-cyan-400 fill-cyan-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">My Wishlist</h1>
          <p className="text-sky-400/70 font-medium">Your curated aquatic treasures ({products.length} items)</p>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -50 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group bg-sky-900/40 border border-sky-800 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={product.images?.[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-4 right-4 p-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-100 hover:bg-red-500 hover:text-white transition-all duration-300"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase mb-2 block">
                    {product.category}
                  </span>
                  <Link to={`/product/${product.id}`} className="group-hover:text-cyan-400 transition-colors">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-2xl font-black text-white mb-6">₹{product.price.toLocaleString()}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-grow flex items-center justify-center gap-2 py-3 bg-cyan-700/30 hover:bg-cyan-600 rounded-2xl text-white font-bold transition-all duration-300 border border-cyan-500/30"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <Link
                      to={`/product/${product.id}`}
                      className="p-3 bg-sky-950/50 hover:bg-sky-900 rounded-2xl text-sky-400 transition-all duration-300 border border-sky-800"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-sky-900/30 rounded-full flex items-center justify-center mb-6 border border-sky-800 animate-bounce">
              <Heart className="w-12 h-12 text-sky-600" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Your Wishlist is Shallow</h2>
            <p className="text-sky-400/70 mb-10 max-w-md mx-auto font-medium">
              You haven't saved any aquatic wonders yet. Dive into our catalog and find something special!
            </p>
            <Link
              to="/"
              className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-black text-lg shadow-xl shadow-cyan-900/20 transition-all active:scale-95"
            >
              EXPLORE AQUARIUM
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
