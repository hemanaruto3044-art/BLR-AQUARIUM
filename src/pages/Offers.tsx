import React from 'react';
import { motion } from 'motion/react';
import { Tag, Sparkles, Zap, Timer, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Offers = () => {
  const specials = [
    {
      title: "Neon Horizon Sale",
      description: "Get 20% off all saltwater species this week. Use code 'NEON20' at checkout.",
      color: "bg-cyan-600",
      icon: <Sparkles className="w-8 h-8" />,
      expires: "2 days left"
    },
    {
      title: "Rare Arrival: Blue Phantom Pleco",
      description: "Extremely limited stock. First come, first serve for these high-grade specimens.",
      color: "bg-purple-600",
      icon: <Flame className="w-8 h-8" />,
      expires: "While stocks last"
    },
    {
      title: "Aquascape Starter Kit",
      description: "Free CO2 canister with any hardscape order over ₹40,000.",
      color: "bg-emerald-600",
      icon: <Zap className="w-8 h-8" />,
      expires: "Ends in 5 days"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6"
        >
          <Tag className="w-3 h-3" /> Exclusive Rewards & Discounts
        </motion.div>
        <motion.h1 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6"
        >
          ACTIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">OFFERS</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {specials.map((offer, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-sky-900/30 border border-sky-800 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col"
          >
            <div className={`h-40 ${offer.color} flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="relative bg-white/20 p-6 rounded-3xl backdrop-blur-md shadow-2xl scale-125">
                {offer.icon}
              </div>
            </div>
            <div className="p-8 flex-grow flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-4">
                <Timer className="w-3 h-3" />
                {offer.expires}
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tight leading-tight">
                {offer.title}
              </h3>
              <p className="text-sky-200/60 text-sm leading-relaxed mb-8">
                {offer.description}
              </p>
              <Link 
                to="/"
                className="mt-auto flex items-center justify-center gap-2 py-4 bg-sky-800 hover:bg-sky-700 text-white rounded-2xl font-bold text-sm transition-all group/btn"
              >
                Claim Offer
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic discount code banner */}
      <div className="mt-20 p-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-[2.5rem]">
        <div className="bg-sky-950 rounded-[2.25rem] p-12 text-center">
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">New Member Bonus</h2>
          <p className="text-sky-300/70 mb-8 max-w-xl mx-auto">Join the BLR AQUARIUM community today and get a ₹4,000 credit on your first rare species purchase.</p>
          <button className="px-10 py-5 bg-white text-sky-950 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl shadow-cyan-500/20 active:scale-95">
            REDEEM50
          </button>
        </div>
      </div>
    </div>
  );
};

export default Offers;
