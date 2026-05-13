import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { CreditCard, Clock, CheckCircle2, XCircle, ExternalLink, QrCode } from 'lucide-react';
import { formatDate, formatDateTime, cn } from '../lib/utils';
import ThreeBackground from '../components/ThreeBackground';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'payments'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-600/20">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Payment Requests</h1>
            <p className="text-sky-400 font-medium text-sm text-emerald-400/80">Verification history for your QR payments</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-sky-900/20 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {payments.map((payment, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={payment.id}
                className="bg-sky-900/30 border border-sky-800 rounded-[2rem] p-6 backdrop-blur-md hover:border-sky-700 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner",
                      payment.status === 'approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      payment.status === 'rejected' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                      {payment.status === 'approved' ? <CheckCircle2 className="w-7 h-7" /> :
                       payment.status === 'rejected' ? <XCircle className="w-7 h-7" /> :
                       <Clock className="w-7 h-7 animate-pulse" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Transaction ID</span>
                        <span className="text-xs font-mono text-white font-bold">{payment.transactionId}</span>
                      </div>
                      <h3 className="font-black text-xl text-white italic tracking-tighter uppercase mr-4">₹{payment.amount?.toLocaleString()}</h3>
                      <p className="text-[10px] text-sky-400 font-black uppercase tracking-[0.2em]">{formatDateTime(payment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right hidden md:block mr-4">
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none mb-1">Order Link</p>
                      <p className="text-xs font-bold text-sky-300">#{payment.orderId?.slice(-8).toUpperCase()}</p>
                    </div>
                    
                    <div className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                      payment.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      payment.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {payment.status === 'approved' ? 'Verified' :
                       payment.status === 'rejected' ? 'Rejected' :
                       'Verifying...'}
                    </div>
                    
                    <button 
                      onClick={() => window.open(payment.qrCodeUrl, '_blank')}
                      className="p-2.5 bg-sky-950 rounded-xl border border-sky-800 text-sky-400 hover:text-white hover:border-sky-600 transition-all"
                      title="View QR Used"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    
                    <button 
                      onClick={() => window.location.href = `/tracking?id=${payment.orderId}`}
                      className="p-2.5 bg-sky-950 rounded-xl border border-sky-800 text-sky-400 hover:text-white hover:border-sky-600 transition-all"
                      title="Go to Order"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {payment.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                    <p className="text-[10px] font-bold text-red-400 italic">Rejection Reason: {payment.rejectionReason}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-sky-900/10 rounded-[3rem] border border-dashed border-sky-800">
            <CreditCard className="w-16 h-16 text-sky-800 mx-auto mb-6 opacity-20" />
            <p className="text-sky-300 font-bold uppercase tracking-[0.2em] text-sm mb-2">No payment history found.</p>
            <p className="text-sky-500 text-xs font-bold uppercase tracking-widest">Your QR payment verification requests will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
