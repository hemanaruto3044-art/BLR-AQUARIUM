import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, Copy, ShieldAlert } from 'lucide-react';
import { formatDate, formatDateTime, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { LiveTrackingStatus } from '../components/LiveTrackingStatus';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Tracking ID Copied!', {
      style: {
        background: '#0c4a6e',
        color: '#fff',
        borderRadius: '1rem',
        fontSize: '10px',
        fontWeight: '900',
        textTransform: 'uppercase'
      }
    });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-4 bg-cyan-600 rounded-3xl shadow-xl shadow-cyan-600/20">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Order History</h1>
          <p className="text-sky-400 font-medium text-sm">Track your aquatic companions and equipment</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-sky-900/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map(order => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id}
              className="bg-sky-900/30 border border-sky-800 rounded-3xl p-6 hover:border-sky-700 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-950 flex items-center justify-center rounded-2xl text-cyan-500">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="text-xs text-sky-400 font-black uppercase tracking-[0.15em]">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1">Items</span>
                    <div className="flex gap-1">
                      {order.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="w-6 h-6 bg-sky-950 rounded-lg flex items-center justify-center border border-sky-800 text-[10px] font-black text-cyan-400">
                          {item.quantity}
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-6 h-6 bg-sky-900 rounded-lg flex items-center justify-center text-[8px] font-bold text-sky-400">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1">Total</span>
                    <span className="text-xl font-black text-white">₹{order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                      order.status === 'delivered' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      order.status === 'shipped' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                      "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    )}>
                      {order.status === 'delivered' ? <CheckCircle className="w-4 h-4" /> :
                       order.status === 'shipped' ? <Truck className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                      {order.status}
                    </div>
                    {order.paymentStatus && (
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                        order.paymentStatus === 'paid' ? "bg-emerald-500/20 text-emerald-400" :
                        order.paymentStatus === 'pending_verification' ? "bg-amber-500/20 text-amber-500" :
                        "bg-red-500/20 text-red-500"
                      )}>
                        {order.paymentStatus.replace('_', ' ')}
                      </span>
                    )}
                    {order.paymentStatus === 'unpaid' && order.paymentMethod === 'qr' && order.status !== 'cancelled' && (
                      <button 
                        onClick={() => window.location.href = `/payment/${order.id}`}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20"
                      >
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {order.trackingId && (
                <div className="mt-6 mb-6">
                  <LiveTrackingStatus trackingId={order.trackingId} />
                </div>
              )}
              
              {order.trackingId && (
                <div className="mt-4 pt-4 border-t border-sky-800/50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none mb-2 italic">Official Tracking Info</p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-white tracking-widest font-mono italic">
                        {order.trackingId}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(order.trackingId)}
                        className="p-1.5 bg-sky-800/50 hover:bg-sky-700 text-sky-400 rounded-lg transition-all"
                        title="Copy ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.location.href = `/tracking?id=${order.id}`}
                      className="px-4 py-2 bg-sky-800/40 hover:bg-sky-800 text-sky-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-sky-800/30"
                    >
                      Locate
                    </button>
                    <button 
                      onClick={() => window.open('https://stcourier.com/', '_blank')}
                      className="px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-cyan-500/20"
                    >
                      ST Courier Portal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-sky-900/10 rounded-3xl border border-dashed border-sky-800">
          <ShoppingBag className="w-16 h-16 text-sky-800 mx-auto mb-6 opacity-20" />
          <p className="text-sky-300 font-bold uppercase tracking-[0.2em] text-sm">You haven't made any purchases yet.</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
