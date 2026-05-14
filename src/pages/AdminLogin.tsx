import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyAdminPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await verifyAdminPassword(password);
      if (success) {
        toast.success('Admin access granted');
        navigate('/admin');
      } else {
        toast.error('Incorrect admin password or session error');
        setPassword('');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sky-950 relative overflow-hidden">
      {/* Brutalist Background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500 to-transparent" />
        <div className="absolute h-full w-px bg-white/20 left-1/4" />
        <div className="absolute h-full w-px bg-white/20 left-2/4" />
        <div className="absolute h-full w-px bg-white/20 left-3/4" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sky-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Return to Shop</span>
        </button>

        <div className="bg-black border-2 border-white/10 p-8 md:p-12 shadow-[20px_20px_0px_rgba(0,255,255,0.1)] relative">
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-cyan-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">
            ADMIN <span className="text-cyan-500">PORTAL</span>
          </h1>
          <p className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-8">
            Secure clearance required
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white uppercase tracking-[0.3em] block ml-1">
                Security Key
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-sky-900/20 border-2 border-sky-800/50 p-4 pl-12 text-white placeholder:text-sky-800 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black py-4 px-6 font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Access
                  <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between opacity-30">
            <span className="text-[8px] font-black uppercase tracking-widest text-sky-500">System V.4.0</span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
