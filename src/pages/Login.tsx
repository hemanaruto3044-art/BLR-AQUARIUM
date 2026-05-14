import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Fish } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user, login, loginAnonymous, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-sky-900/30 backdrop-blur-xl border border-sky-800 p-8 rounded-3xl text-center shadow-2xl relative z-10"
      >
        <div className="inline-flex p-1 bg-white rounded-2xl mb-6 overflow-hidden w-20 h-20 items-center justify-center shadow-2xl shadow-cyan-500/20">
          <img src="https://i.ibb.co/6RCCdcFt/IMG-20260511-WA0010.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome</h1>
        <p className="text-sky-200/60 mb-10 max-w-[280px] mx-auto text-sm">
          Explore rare species and manage your aquarium.
        </p>

        <div className="space-y-6">
          <button
            onClick={loginAnonymous}
            className="w-full bg-cyan-600 text-white py-4 px-6 rounded-2xl font-bold hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-600/20 active:scale-95 group flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Continue as Guest
          </button>
        </div>

        <p className="mt-12 text-[10px] text-sky-400/50 uppercase tracking-widest leading-relaxed">
          Quick & Secure Access<br />
          Experience aquarium life instantly
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
