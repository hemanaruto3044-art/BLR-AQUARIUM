import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, ShoppingCart, Video, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    isLiveEnabled?: boolean;
    stock: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-sky-900/30 border border-sky-800/50 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-cyan-500/50 transition-all flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-sky-900/50">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10",
            isWishlisted 
              ? "bg-red-500 text-white border-red-400" 
              : "bg-black/20 text-white/70 border-white/10 hover:bg-black/40 hover:text-white"
          )}
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
        </button>
        {product.isLiveEnabled && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse ring-4 ring-red-500/20">
            <Video className="w-3 h-3" />
            Live Ready
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <Link
            to={`/product/${product.id}`}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/20"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => product.stock > 0 && addToCart(product)}
            disabled={product.stock <= 0}
            className={cn(
              "p-3 rounded-full text-white transition-colors shadow-lg",
              product.stock > 0 
                ? "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20" 
                : "bg-sky-800 cursor-not-allowed opacity-50"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            {product.category}
          </span>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors leading-tight">
            {product.name}
          </h3>
        </div>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-sky-400 uppercase tracking-tighter">Starting from</span>
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
          {product.stock === 0 && (
            <span className="text-[10px] font-bold text-red-400 uppercase border border-red-400/30 px-2 py-1 rounded">Out of Stock</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
