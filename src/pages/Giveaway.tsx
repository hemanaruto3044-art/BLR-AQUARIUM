import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Users, Award, Ticket, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Giveaway = () => {
  const { user } = useAuth();
  const [isEntered, setIsEntered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to enter the giveaway!');
      return;
    }
    
    setLoading(true);
    // Simulate entry (actual logic would involve Firestore)
    setTimeout(() => {
      setIsEntered(true);
      setLoading(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#0284c7', '#ffffff']
      });
      toast.success('Successfully entered! Good luck!', { icon: '🍀' });
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-10"
          >
            <Gift className="w-3 h-3" /> Community Prize Draw #042
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]"
          >
            WIN A <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 underline decoration-cyan-500 underline-offset-8">PREMIUM</span> RED DRAGON AROWANA
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-sky-200/60 leading-relaxed mb-12"
          >
            Our monthly giveaway is live. We're giving away a high-grade 12-inch Red Dragon Arowana to one lucky member of the BLR AQUARIUM community.
          </motion.p>

          <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-white">₹2,00,000</span>
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Est. Prize Value</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-white">4,281</span>
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Global Entries</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-white">12:04:12</span>
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Time Remaining</span>
            </div>
          </div>
        </div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="relative"
        >
          <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] translate-y-12 scale-90" />
          <div className="bg-sky-900/40 backdrop-blur-2xl border border-sky-800 rounded-[3rem] p-12 shadow-2xl relative">
            <AnimatePresence mode="wait">
              {!isEntered ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-cyan-500 rounded-2xl">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Enter to Win</h2>
                      <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">Verification Required</p>
                    </div>
                  </div>

                  <form onSubmit={handleEntry} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 ml-1">Your Registered Name</label>
                      <input 
                        required
                        type="text" 
                        defaultValue={user?.displayName || ''}
                        className="w-full bg-sky-950 border border-sky-800 rounded-2xl px-6 py-4 text-white placeholder:text-sky-700/50 focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 ml-1">Confirm Identity</label>
                      <div className="bg-sky-950 border border-sky-800 rounded-2xl px-6 py-4 text-sky-400 text-sm italic">
                        {user?.email || 'Login to verify account'}
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-cyan-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                          SUBMIT ENTRY
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-sky-500 font-bold uppercase tracking-widest leading-relaxed">
                      By entering, you agree to our contest terms. <br /> Winner will be announced via registered email.
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-green-500/10">
                    <Award className="w-12 h-12 text-green-500" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tight">Entry Confirmed!</h2>
                  <p className="text-sky-300/70 mb-10 leading-relaxed">
                    You've successfully secured your spot in this month's draw. Tune in to our live stream on Friday for the winner reveal.
                  </p>
                  <button 
                    onClick={() => setIsEntered(false)}
                    className="text-cyan-400 font-bold uppercase text-xs tracking-widest hover:underline"
                  >
                    Return to Giveaway Details
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Giveaway;
