import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Video, Heart, ShieldCheck, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const navigate = useNavigate();

  if (!product) return null;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sky-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-sky-900 border border-sky-800 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh] md:max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Gallery Section */}
            <div className="w-full md:w-1/2 relative bg-sky-950/50 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] shrink-0">
              <div className="relative w-full aspect-square md:aspect-auto md:h-full p-6 md:p-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    src={product.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain rounded-2xl"
                  />
                </AnimatePresence>

                {product.images?.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 p-4 pt-0 overflow-x-auto max-w-full no-scrollbar">
                {product.images?.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                      activeImageIndex === i ? "border-cyan-500" : "border-transparent opacity-50"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-cyan-500/10 text-cyan-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full border border-cyan-500/20">
                    {product.category}
                  </span>
                  {product.isLiveEnabled && (
                    <div className="flex items-center gap-1 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      <Video className="w-3 h-3" /> Live
                    </div>
                  )}
                </div>
                <h2 className="text-xl md:text-4xl font-black text-white tracking-tighter mb-2 md:mb-4 leading-tight">
                  {product.name.toUpperCase()}
                </h2>
                <div className="text-xl md:text-2xl font-bold text-cyan-400">
                  ₹{product.price.toLocaleString()}
                </div>
              </div>

              <p className="text-sky-200/60 leading-relaxed mb-6 md:mb-8 text-xs md:text-sm">
                {product.description || "Explore this rare species from our exclusive collection. Each specimen is carefully selected for quality and health."}
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="p-2 md:p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 flex flex-col gap-1">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">Health Guarantee</span>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 flex flex-col gap-1">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">Fast Transit</span>
                </div>
              </div>

              <div className="mt-auto space-y-3 md:space-y-4">
                <div className="flex gap-3 md:gap-4">
                  <button
                    onClick={() => {
                      addToCart(product);
                      onClose();
                    }}
                    className={cn(
                      "flex-grow py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95",
                      product.stock <= 0
                        ? "bg-sky-800 text-sky-500 cursor-not-allowed"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-600/20"
                    )}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    {product.stock <= 0 ? 'Out of Stock' : 'Add to Collection'}
                  </button>
                  <button
                    onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id)}
                    className={cn(
                      "p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all flex items-center justify-center active:scale-90",
                      isWishlisted
                        ? "bg-red-500/20 border-red-500/50 text-red-500"
                        : "bg-sky-950 border-sky-800 text-sky-400 hover:border-cyan-500/50 hover:text-cyan-400"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 md:w-6 md:h-6", isWishlisted && "fill-current")} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    onClose();
                  }}
                  className="w-full py-3 md:py-4 text-sky-400 hover:text-cyan-400 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] transition-colors border border-sky-800/50 rounded-xl md:rounded-2xl hover:bg-sky-800/20"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
