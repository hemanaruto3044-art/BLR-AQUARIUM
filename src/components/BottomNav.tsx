import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Grid, User, Truck, ShoppingCart, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const BottomNav = () => {
  const { user } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistItems } = useWishlist();
  const location = useLocation();

  // Hide BottomNav on admin path
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/' },
    { 
      icon: (
        <div className="relative">
          <Heart className={cn("w-5 h-5", wishlistItems.length > 0 && "fill-red-500 text-red-500")} />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-sky-950">
              {wishlistItems.length}
            </span>
          )}
        </div>
      ), 
      label: 'Saved', 
      path: '/wishlist' 
    },
    { icon: <Grid className="w-5 h-5" />, label: 'Types', path: '/categories' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders', path: '/orders' },
    { 
      icon: (
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {itemsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-sky-950">
              {itemsCount}
            </span>
          )}
        </div>
      ), 
      label: 'Cart', 
      path: '/cart' 
    },
    { icon: <User className="w-5 h-5" />, label: 'Me', path: '/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-2 right-2 z-[100]">
      <div className="bg-sky-950/90 backdrop-blur-2xl border border-sky-800 rounded-[1.5rem] p-1 shadow-2xl flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 py-3 rounded-xl transition-all relative overflow-hidden group flex-1",
              isActive ? "text-cyan-400 bg-cyan-500/10" : "text-sky-300 active:scale-95 transition-transform"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 transform scale-x-0 group-active:scale-x-100 transition-transform" />
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
