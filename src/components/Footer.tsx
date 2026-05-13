import React from 'react';
import { Fish, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-sky-950 border-t border-sky-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-sky-800 bg-white p-0.5">
              <img src="https://i.ibb.co/6RCCdcFt/IMG-20260511-WA0010.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl text-white">BLR AQUARIUM</span>
          </div>
          <p className="text-sky-300/70 text-sm leading-relaxed">
            Bringing the ocean's beauty to your living room. We specialize in rare species, custom aquascape designs, and premium equipment.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 bg-sky-900/50 rounded-full text-sky-300 hover:text-cyan-400 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-sky-900/50 rounded-full text-sky-300 hover:text-cyan-400 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-sky-900/50 rounded-full text-sky-300 hover:text-cyan-400 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-6 uppercase text-xs tracking-widest">Connect</h4>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-sky-300/70 hover:text-sky-200 transition-colors cursor-pointer">
              <Mail className="w-4 h-4 text-cyan-500" />
              Lakshmiganthan850@gmail.com
            </li>
            <li className="flex items-center gap-3 text-sm text-sky-300/70 hover:text-sky-200 transition-colors cursor-pointer">
              <Phone className="w-4 h-4 text-cyan-500" />
              +91 7397675243
            </li>
            <li className="flex flex-col gap-2 text-sm text-sky-300/70">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/ryMHprR3MFVYjsL16?g_st=aw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest text-[10px]"
                >
                  View on Google Maps
                </a>
              </div>
              <div className="ml-7 space-y-1">
                <p className="font-bold text-white text-xs">BLR AQUARIUM</p>
                <p className="text-[11px] leading-relaxed opacity-80">
                  2/448, Pookuvarathu Nagar,<br />
                  Alamarathupatti PO, Kalikampatti,<br />
                  Dindigul, Tamil Nadu 624303
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-6 uppercase text-xs tracking-widest">Categories</h4>
          <ul className="space-y-4 text-sm text-sky-300/70">
            <li className="hover:text-cyan-400 transition-colors cursor-pointer">Freshwater Fish</li>
            <li className="hover:text-cyan-400 transition-colors cursor-pointer">Saltwater Corals</li>
            <li className="hover:text-cyan-400 transition-colors cursor-pointer">Aquascape Hardscape</li>
            <li className="hover:text-cyan-400 transition-colors cursor-pointer">Maintenance Kits</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-6 uppercase text-xs tracking-widest">Newsletter</h4>
          <p className="text-sm text-sky-300/70 mb-4">Get the latest on rare arrivals and exclusive offers.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address"
              className="bg-sky-900/50 border border-sky-800 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-sky-900/50 text-center">
        <p className="text-sky-500 text-xs tracking-widest uppercase">
          &copy; {new Date().getFullYear()} BLR AQUARIUM. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
