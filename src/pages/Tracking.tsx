import React, { useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Truck, Search, Package, MapPin, Calendar, Globe, Zap } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { fetchTrackingStatus, TrackingData } from '../lib/trackingService';

const Tracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveData, setLiveData] = useState<TrackingData | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);
    setLiveData(null);

    const searchTerm = orderId.trim();

    try {
      // 1. Try search by Document ID (Order ID)
      let q = query(
        collection(db, 'orders'),
        where('__name__', '==', searchTerm),
        limit(1)
      );
      let snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // 2. Try search by trackingId field
        q = query(
          collection(db, 'orders'),
          where('trackingId', '==', searchTerm),
          limit(1)
        );
        snapshot = await getDocs(q);
      }
      
      if (snapshot.empty) {
        setError('No order found with this ID or Tracking ID.');
      } else {
        const orderData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
        setOrder(orderData);
        
        // Fetch live data if tracking ID exists
        if (orderData.trackingId) {
          const live = await fetchTrackingStatus(orderData.trackingId);
          setLiveData(live);
        }
      }
    } catch (e) {
      setError('Connection error. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'shipped': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
    }
  };

  const openSTCourier = (id: string) => {
    // ST Courier tracking portal URL structure
    window.open(`https://stcourier.com/`, '_blank');
    // Note: ST Courier usually requires manual entry on their site if no direct deep-link is available
    // but having the link handy helps.
  };

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-lg mx-auto">
        <header className="mb-10 text-center">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 mx-auto mb-6 shadow-2xl shadow-cyan-500/20">
            <Truck className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3 block text-center">TrackCourier.io Integrated</span>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Locate <span className="text-sky-800 stroke-cyan-500 stroke-1">Package</span></h1>
        </header>

        <form onSubmit={handleTrack} className="mb-12">
          <div className="relative">
            <input 
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID or Tracking Number..."
              className="w-full bg-sky-900/20 border border-sky-800 rounded-[2rem] px-8 py-5 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-xl backdrop-blur-sm"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[1.5rem] font-bold text-sm transition-all flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch
            </button>
          </div>
          <p className="mt-4 text-[10px] text-sky-500 font-bold uppercase tracking-widest text-center italic">
            Tip: Copy your Tracking ID from "My Orders" and paste it here
          </p>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] text-red-500 text-center"
            >
              <p className="font-black uppercase tracking-tighter text-xl mb-1 italic">Lookup Failed</p>
              <p className="text-xs font-bold text-red-400/60 uppercase">{error}</p>
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <div className="bg-sky-900/20 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none">Internal Status</p>
                    <span className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center",
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1 leading-none">Order Reference</p>
                    <p className="text-sm font-bold text-white font-mono uppercase">#{order.id.slice(0, 8)}</p>
                  </div>
                </div>

                {liveData ? (
                  <div className="mb-10 p-6 bg-cyan-950/40 border border-cyan-500/30 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <Globe className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Live Tracking Enabled</p>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Current: <span className="text-cyan-400">{liveData.status}</span></h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-sky-950 rounded-2xl border border-sky-800/50 mb-6">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-0.5">Known Location</p>
                        <p className="text-sm font-bold text-white tracking-widest uppercase">{liveData.location}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {liveData.history.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex gap-4 opacity-60">
                           <div className="w-1 h-full bg-cyan-500/20 rounded-full" />
                           <div>
                             <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{item.status}</p>
                             <p className="text-[11px] text-sky-200 font-medium">{item.location}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : order.trackingId && (
                  <div className="mb-10 p-6 bg-sky-950/50 rounded-3xl border border-dashed border-sky-700">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 italic">ST Courier Tracking ID</p>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-2xl font-black text-white tracking-[0.2em] font-mono italic">{order.trackingId}</p>
                      <button 
                        onClick={() => openSTCourier(order.trackingId)}
                        className="p-3 bg-sky-800 hover:bg-sky-700 text-white rounded-xl transition-all shadow-lg"
                        title="Open ST Courier Portal"
                      >
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-3 text-[9px] text-sky-500 font-bold uppercase tracking-tight">Active Shipment in Surface Transit</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="w-0.5 h-12 bg-cyan-600/30" />
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        ['shipped', 'delivered'].includes(order.status) ? "bg-cyan-600 text-white" : "bg-sky-800 text-sky-600"
                      )}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="w-0.5 h-12 bg-cyan-600/30" />
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        order.status === 'delivered' ? "bg-cyan-600 text-white" : "bg-sky-800 text-sky-600"
                      )}>
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-grow pt-1 space-y-9">
                      <div>
                        <h3 className="text-white font-bold tracking-tight">Order Confirmed</h3>
                        <p className="text-xs text-sky-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <h3 className={cn("font-bold tracking-tight", ['shipped', 'delivered'].includes(order.status) ? "text-white" : "text-sky-700")}>
                          Out for Delivery
                        </h3>
                        <p className="text-xs text-sky-500">Estimated delivery in 2-3 days</p>
                      </div>
                      <div>
                        <h3 className={cn("font-bold tracking-tight", order.status === 'delivered' ? "text-white" : "text-sky-700")}>
                          Delivered
                        </h3>
                        <p className="text-xs text-sky-500 text-center sm:text-left">Successfully delivered to destination</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-sky-900/10 border border-sky-800/50 rounded-[2rem] p-6">
                <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-4">Summary</h4>
                <div className="space-y-4">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-sm text-sky-200">
                        <span className="font-bold text-white">{item.quantity}x</span> {item.name}
                      </p>
                      <p className="text-sm font-bold text-white">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-sky-800 flex items-center justify-between">
                    <p className="font-black text-white italic uppercase">Total</p>
                    <p className="text-xl font-black text-cyan-400">₹{order.total}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tracking;
