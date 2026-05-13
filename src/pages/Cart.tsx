import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, itemsCount, totalAmount, deliveryTotal, itemsTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-4xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sky-400 font-bold hover:text-cyan-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Back to Shop
          </Link>
          <div className="text-right">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1 block">Your Selection</span>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4 justify-end">
              Shopping <span className="text-sky-800 stroke-cyan-500 stroke-1">Cart</span>
              <span className="px-3 py-1 bg-cyan-500/10 rounded-full text-sm font-black text-cyan-400 border border-cyan-500/20">{itemsCount}</span>
            </h1>
          </div>
        </header>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sky-900/10 border border-sky-800 rounded-[3rem] p-16 text-center backdrop-blur-md"
          >
            <div className="w-24 h-24 bg-sky-950 rounded-[2.5rem] flex items-center justify-center text-sky-700 mx-auto mb-8 shadow-2xl">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase italic">Your cart is empty</h2>
            <p className="text-sky-400/60 mb-10 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Explore our premium collection of aquatic treasures.</p>
            <Link to="/" className="inline-flex items-center gap-3 px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-cyan-500/20 active:scale-95 uppercase tracking-tighter">
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    className="group relative flex flex-wrap sm:flex-nowrap items-center gap-6 p-6 bg-sky-900/10 border border-sky-800 rounded-[2.5rem] hover:bg-sky-900/20 transition-all backdrop-blur-sm"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden shrink-0 border border-sky-800/50 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      {item.isFreeDelivery && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg">
                          Free Ship
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow pt-2">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-tight uppercase mb-1">{item.name}</h3>
                          <p className="text-xs text-sky-500 font-black tracking-widest uppercase italic">Aquatic Collection</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-3 text-sky-700 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 bg-sky-950 p-1.5 rounded-2xl border border-sky-800">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-sky-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-black text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-sky-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Subtotal</p>
                          <p className="text-xl font-black text-white italic">₹{(item.price * item.quantity).toLocaleString()}</p>
                          {!item.isFreeDelivery && item.deliveryCharge > 0 && (
                            <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">+ ₹{item.deliveryCharge} Shipping</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <motion.div 
              layout
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-sky-900/20 border border-sky-800 rounded-[3rem] p-8 backdrop-blur-md sticky top-24">
                <h2 className="text-xl font-black text-white mb-8 tracking-tighter italic uppercase flex items-center gap-3">
                  <span className="w-2 h-8 bg-cyan-500 rounded-full" />
                  Order Summary
                </h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center text-sky-300">
                    <span className="font-bold text-sm uppercase tracking-wider">Subtotal</span>
                    <span className="font-black text-white italic">₹{itemsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sky-300">
                    <span className="font-bold text-sm uppercase tracking-wider">Shipping</span>
                    <span className={cn("font-black italic uppercase italic", deliveryTotal === 0 ? "text-green-500" : "text-amber-500")}>
                      {deliveryTotal === 0 ? 'FREE' : `₹${deliveryTotal.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="pt-6 border-t border-sky-800 flex justify-between items-end">
                    <span className="font-black text-lg text-white uppercase italic tracking-tighter">Total Due</span>
                    <span className="text-3xl font-black text-cyan-400 tracking-tighter italic leading-none">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-tighter"
                >
                  Checkout
                  <ArrowRight className="w-6 h-6" />
                </button>

                <p className="mt-8 text-center text-[10px] text-sky-500 font-bold uppercase tracking-[0.2em] px-4">
                  Secure encrypted checkout via Razorpay & Stripe
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
