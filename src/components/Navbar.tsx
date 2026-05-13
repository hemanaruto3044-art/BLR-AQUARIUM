import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fish, User, LayoutDashboard, ShoppingBag, Gift, Tag, LogOut, LogIn, ShoppingCart, Heart, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { cn } from '../lib/utils';

const Navbar = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [logoTaps, setLogoTaps] = React.useState(0);

  React.useEffect(() => {
    if (logoTaps === 3) {
      navigate('/admin');
      setLogoTaps(0);
      return;
    }
    if (logoTaps > 0) {
      const timer = setTimeout(() => setLogoTaps(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [logoTaps, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sky-950/80 backdrop-blur-md border-b border-sky-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
          setLogoTaps(prev => prev + 1);
        }}>
          <div className="w-10 h-10 bg-white p-0.5 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-white/10 overflow-hidden flex items-center justify-center">
            <img src="https://i.ibb.co/6RCCdcFt/IMG-20260511-WA0010.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white underline-offset-4 decoration-cyan-400 group-hover:underline">
            BLR AQUARIUM
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-sky-200 hover:text-white transition-colors">Shop</Link>
          <Link to="/offers" className="text-sm font-medium text-sky-200 hover:text-white transition-colors flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            Offers
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/wishlist" 
            className="p-2 text-sky-200 hover:text-red-400 hover:bg-sky-900 rounded-lg transition-all relative"
            title="Wishlist"
          >
            <Heart className={cn("w-5 h-5", wishlistItems.length > 0 && "fill-red-500 text-red-500")} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sky-950 animate-in zoom-in duration-300">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <Link 
            to="/cart" 
            className="p-2 text-sky-200 hover:text-white hover:bg-sky-900 rounded-lg transition-all relative"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sky-950 animate-in zoom-in duration-300">
                {itemsCount}
              </span>
            )}
          </Link>
          {!loading && user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="p-2 text-sky-200 hover:text-white hover:bg-sky-900 rounded-lg transition-all"
                  title="Admin Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              )}
              <Link 
                to="/payments" 
                className="p-2 text-sky-200 hover:text-white hover:bg-sky-900 rounded-lg transition-all"
                title="My Payments"
              >
                <CreditCard className="w-5 h-5" />
              </Link>
              <Link 
                to="/orders" 
                className="p-2 text-sky-200 hover:text-white hover:bg-sky-900 rounded-lg transition-all"
                title="My Orders"
              >
                <ShoppingBag className="w-5 h-5" />
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 pl-2 border-l border-sky-800"
              >
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-sky-700"
                />
              </Link>
              <button 
                onClick={() => logout().then(() => navigate('/'))}
                className="p-2 text-sky-200 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-sm font-medium transition-all shadow-lg shadow-cyan-600/20"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
