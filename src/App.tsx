import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FishBackground from './components/FishBackground';
import { seedDatabase } from './lib/seed';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Home from './pages/Home';
import Wishlist from './pages/Wishlist';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Offers from './pages/Offers';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Payments from './pages/Payments';
import Tracking from './pages/Tracking';
import Giveaway from './pages/Giveaway';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Search from './pages/Search';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-950 text-white">Loading...</div>;
  
  if (adminOnly) {
    return isAdmin ? <>{children}</> : <Navigate to="/admin/login" />;
  }
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

function AppContent() {
  const { user, isAdmin } = useAuth();
  const { requestPermission } = useNotifications();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      seedDatabase();
      requestPermission();
    }
  }, [isAdmin, requestPermission]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white selection:bg-cyan-500 selection:text-white relative">
      <ScrollToTop />
      <FishBackground />
      <Navbar />
      <main className={cn(
        "flex-grow pt-16 relative z-10 overflow-x-hidden",
        !isAdminPage && "pb-24 lg:pb-0"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/search" element={<Search />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/giveaway" element={<Giveaway />} />
              
              {/* User Protected Routes */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/payment/:orderId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              
              {/* Admin Protected Routes */}
              <Route path="/admin/*" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <Footer />
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#0c4a6e',
          color: '#fff',
          border: '1px solid #0ea5e9',
        },
      }} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <AppContent />
            </Router>
          </CartProvider>
        </WishlistProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
