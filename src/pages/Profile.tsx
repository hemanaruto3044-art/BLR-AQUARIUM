import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Calendar, 
  ShoppingBag, 
  Settings, 
  Heart, 
  Grid, 
  LogOut,
  ChevronRight,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';

const Profile = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showAccountModal, setShowAccountModal] = React.useState(false);

  if (!user) return null;

  const menuItems = [
    { 
      id: 'orders',
      icon: <ShoppingBag className="w-5 h-5 text-amber-500" />, 
      label: 'My Orders', 
      desc: 'Track your active and past orders',
      path: '/orders'
    },
    { 
      id: 'wishlist',
      icon: <Heart className="w-5 h-5 text-red-500" />, 
      label: 'Saved Items', 
      desc: 'Your favorites and wishlist',
      path: '/wishlist'
    },
    { 
      id: 'payments',
      icon: <CreditCard className="w-5 h-5 text-emerald-500" />, 
      label: 'My Payments', 
      desc: 'View your verification history',
      path: '/payments'
    },
    { 
      id: 'categories',
      icon: <Grid className="w-5 h-5 text-cyan-400" />, 
      label: 'Explore Types', 
      desc: 'Browse items by category',
      path: '/categories'
    },
    { 
      id: 'account',
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />, 
      label: 'Account Details', 
      desc: 'Email, Verification & Security',
      path: 'modal'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 pb-32">
      <div className="bg-sky-900/30 border border-sky-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
        {/* Header Section */}
        <div className="h-40 md:h-48 bg-gradient-to-r from-sky-900 to-cyan-900 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -bottom-12 md:-bottom-16 left-8 md:left-12">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt={user.displayName || 'User'} 
              className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-sky-950 shadow-2xl"
            />
          </div>
        </div>

        <div className="pt-16 md:pt-20 pb-8 px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight italic uppercase">{user.displayName}</h1>
                {isAdmin && (
                  <span className="px-3 py-1 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg shadow-cyan-500/20">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-sky-400 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-tight">
                <Mail className="w-4 h-4 text-sky-500" />
                {user.email}
              </p>
            </div>
            
            <button 
              onClick={() => logout()}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center gap-2 shadow-lg hover:shadow-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="grid grid-cols-1 gap-4">
            {menuItems.map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (item.id === 'account') {
                    setShowAccountModal(true);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="w-full text-left p-5 rounded-3xl bg-sky-950/40 border border-sky-800/50 hover:bg-sky-900/40 hover:border-sky-700 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-950 rounded-2xl flex items-center justify-center border border-sky-800 shadow-inner group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight text-sm italic">{item.label}</h3>
                    <p className="text-sky-500 font-bold text-[10px] uppercase tracking-widest">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>

          {/* Joined Date */}
          <div className="mt-8 pt-8 border-t border-sky-800/50 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-sky-950/50 rounded-full border border-sky-800/30">
              <Calendar className="w-3 h-3 text-sky-500" />
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
                Member Since: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccountModal(false)}
              className="absolute inset-0 bg-sky-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-sky-900/40 border border-sky-800 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/20 shadow-2xl">
                  <UserCheck className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Account <span className="text-sky-800 stroke-cyan-500 stroke-1">Details</span></h2>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-sky-950/50 border border-sky-800/50">
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">User Identifier (UID)</p>
                  <p className="text-xs font-mono text-sky-200 break-all">{user.uid}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-sky-950/50 border border-sky-800/50">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Email Verified</p>
                    <p className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      user.emailVerified ? "text-emerald-400" : "text-amber-500"
                    )}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-sky-950/50 border border-sky-800/50">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Platform</p>
                    <p className="text-xs font-black text-white uppercase tracking-widest">
                      {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Password'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-sky-950/50 border border-sky-800/50">
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Last Login</p>
                  <p className="text-xs text-white font-bold">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowAccountModal(false)}
                className="mt-10 w-full py-4 bg-white text-sky-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sky-50 transition-all shadow-xl active:scale-95"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
