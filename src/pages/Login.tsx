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
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-sky-200/60 mb-8 max-w-[280px] mx-auto text-sm">
          Sign in to your account to explore rare species and manage your aquarium.
        </p>

        <div className="space-y-4">
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-white text-sky-950 py-4 px-6 rounded-2xl font-bold hover:bg-sky-100 transition-all shadow-xl shadow-white/5 active:scale-95 group"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5 group-hover:rotate-12 transition-transform" 
            />
            Sign in with Google
          </button>

          <div className="flex items-center gap-4 my-4">
            <div className="h-px flex-grow bg-white/10" />
            <span className="text-xs text-sky-400/50 uppercase tracking-widest font-bold">OR</span>
            <div className="h-px flex-grow bg-white/10" />
          </div>

          <button
            onClick={loginAnonymous}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white border-2 border-white/10 hover:bg-white/5 transition-all active:scale-95"
          >
            Continue as Guest
          </button>
        </div>

        <p className="mt-8 text-[10px] text-sky-400/50 uppercase tracking-widest leading-relaxed">
          Quick & Secure Sign Up<br />
          Experience aquarium life instantly
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
