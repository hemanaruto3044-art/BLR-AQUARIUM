import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { toast } from 'react-hot-toast';
import ThreeBackground from '../components/ThreeBackground';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { QrCode, Timer, ShieldCheck, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';

const Payment = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('AUTO_RECOGNITION');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [verificationTime, setVerificationTime] = useState(300); // 5 minutes verification timer
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Derive state from Firestore
        if (data.paymentStatus === 'paid') {
          setHasPaid(true);
          setIsVerifying(false);
        } else if (data.paymentStatus === 'pending_verification') {
          setIsVerifying(true);
        } else if (data.paymentStatus === 'unpaid') {
          setIsVerifying(false);
        }
        
        setOrder({ id: snapshot.id, ...data });
        setLoading(false);
      } else {
        toast.error('Order not found');
        navigate('/orders');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    // 10 minute payment window timer
    if (timeLeft <= 0 || isVerifying || hasPaid) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isVerifying, hasPaid]);

  useEffect(() => {
    // 5 minute admin verification timer (started after user clicks "Paid")
    if (!isVerifying || verificationTime <= 0 || hasPaid) return;
    const timer = setInterval(() => {
      setVerificationTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVerifying, verificationTime, hasPaid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualConfirm = async () => {
    if (timeLeft <= 0) {
      toast.error('Session expired. Please refresh to try again.');
      return;
    }
    setSubmitting(true);
    try {
      const paymentData = {
        orderId,
        userId: user?.uid,
        userEmail: user?.email,
        transactionId: `REC-${Date.now().toString().slice(-6)}`,
        amount: order.total,
        status: 'pending',
        qrCodeUrl: 'https://i.ibb.co/sG26mMh/IMG-20260512-WA0015.jpg',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'payments'), paymentData);
      await updateDoc(doc(db, 'orders', orderId!), {
        paymentStatus: 'pending_verification'
      });

      setIsVerifying(true);
      toast.success('System initiated recognition. Stay on this screen.', { icon: '🚀' });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'payments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-950">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (hasPaid) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-sky-950 overflow-hidden">
        <ThreeBackground />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center p-12 bg-sky-900/20 backdrop-blur-xl border border-sky-800 rounded-[4rem] max-w-lg mx-4 shadow-[0_0_100px_rgba(8,47,73,1)]"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] border-8 border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Order Placed Successfully!</h2>
          <p className="text-sky-400 font-bold uppercase tracking-widest text-xs mb-8 bg-sky-950/50 py-3 rounded-2xl border border-sky-800">
            Order ID: <span className="text-cyan-400 font-mono">#{orderId?.slice(-6).toUpperCase()}</span>
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate(`/tracking?id=${orderId}`)}
              className="w-full px-12 py-5 bg-white text-sky-950 rounded-[2rem] font-black text-xl uppercase italic transform transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Track My Order
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full px-12 py-4 bg-sky-900/40 text-sky-400 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:text-white transition-all border border-sky-800"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-sky-950 overflow-hidden">
      <ThreeBackground />
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <button 
            onClick={() => navigate(`/tracking?id=${orderId}`)} 
            className="inline-flex items-center gap-2 text-sky-400 font-bold hover:text-cyan-400 transition-colors mb-6 mx-auto"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Order
          </button>
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-2 block animate-pulse">
            {isVerifying ? 'Recognition in Progress' : 'Gateway Initialized'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
            {isVerifying ? 'Wait For' : 'Complete'} <span className="text-sky-800 stroke-cyan-500 stroke-1">Verification</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* QR Code Section */}
          <motion.div 
            animate={isVerifying ? { scale: 0.9, opacity: 0.3 } : { scale: 1, opacity: 1 }}
            className="bg-sky-900/10 border border-sky-800 rounded-[3rem] p-8 backdrop-blur-md text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <QrCode className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Scan QR Code</h3>
            </div>
            
            <div className="relative group" onClick={() => window.open('https://i.ibb.co/sG26mMh/IMG-20260512-WA0015.jpg', '_blank')}>
              <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl overflow-hidden aspect-square flex items-center justify-center cursor-zoom-in">
                <img 
                  src="https://i.ibb.co/sG26mMh/IMG-20260512-WA0015.jpg" 
                  alt="Payment QR Code" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-sky-950/50 rounded-2xl border border-sky-800 flex items-center justify-center gap-3 text-white">
               <Timer className="w-5 h-5 text-cyan-400" />
               <span className="font-mono text-xl">{formatTime(timeLeft)}</span>
            </div>
          </motion.div>

          {/* Verification Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isVerifying ? (
                <motion.div 
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="bg-sky-900/20 border border-cyan-500/30 rounded-[2.5rem] p-8 backdrop-blur-md text-center py-16"
                >
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <motion.div 
                      className="absolute inset-0 border-4 border-t-cyan-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-cyan-400 font-mono text-xs font-black">{Math.floor((300 - verificationTime) / 3)}%</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Verification Sent to Admin</h3>
                  <p className="text-sky-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-6">
                    Our team is manually checking your transaction. This process typically takes <span className="text-cyan-400">5 minutes</span>. 
                    Please keep this window open for automatic update.
                  </p>
                  
                  <div className="py-3 px-6 bg-sky-950 rounded-2xl border border-sky-800 inline-block">
                    <p className="text-cyan-400 font-black italic text-xl">Verification Timer: {formatTime(verificationTime)}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-sky-900/20 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Manual Confirmation</h3>
                  </div>

                  <div className="space-y-6 mb-12">
                    <div className="p-6 bg-sky-950/50 rounded-2xl border border-sky-800">
                       <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 italic">Total Price To Pay</p>
                       <p className="text-4xl font-black text-cyan-400 italic">₹{order.total?.toLocaleString()}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-cyan-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                        </div>
                        <p className="text-xs text-sky-300">Scan QR and complete payment on your UPI app.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-cyan-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                        </div>
                        <p className="text-xs text-sky-300">Click the button below once you've finished.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleManualConfirm}
                    disabled={submitting || timeLeft <= 0}
                    className="w-full py-5 bg-white text-sky-950 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-tighter group"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-4 border-sky-950/30 border-t-sky-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        Done Scanned & Paid
                        <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-amber-500 font-black text-xs uppercase tracking-tight mb-1">Attention Required</h4>
                <p className="text-[10px] text-amber-200/40 leading-relaxed uppercase">
                  Sending fake verification requests without actually paying will result in permanent removal from our platform. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
