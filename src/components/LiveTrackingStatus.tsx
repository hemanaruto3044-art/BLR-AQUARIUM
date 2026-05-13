import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Loader2 } from 'lucide-react';
import { fetchTrackingStatus, TrackingData } from '../lib/trackingService';
import { motion, AnimatePresence } from 'motion/react';

interface LiveTrackingStatusProps {
  trackingId: string;
}

export const LiveTrackingStatus: React.FC<LiveTrackingStatusProps> = ({ trackingId }) => {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStatus = async () => {
      try {
        const result = await fetchTrackingStatus(trackingId);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch live status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (trackingId) {
      getStatus();
    }
  }, [trackingId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/40 rounded-xl border border-sky-800/30">
        <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />
        <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Checking Live Status...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-2 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.05)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400 group-hover:animate-bounce" />
          <span className="text-[10px] font-black text-white uppercase tracking-tight italic">
            Auto-Fetch: <span className="text-cyan-400">{data.status}</span>
          </span>
        </div>
        <div className="px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
          <span className="text-[8px] font-black text-cyan-500 uppercase">Live</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
        <p className="text-[10px] font-bold text-sky-300 truncate">
          At: {data.location}
        </p>
      </div>

      <p className="text-[8px] font-black text-sky-600 uppercase tracking-tighter">
        Updated: {new Date(data.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </motion.div>
  );
};
