import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Grid, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThreeBackground from '../components/ThreeBackground';
import { motion } from 'motion/react';

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-lg mx-auto">
        <header className="mb-10 text-center">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3 block">Explorer</span>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Shop by <span className="text-sky-800 stroke-cyan-500 stroke-1">Category</span></h1>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-sky-900/20 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/?category=${encodeURIComponent(cat.name)}`)}
                className="group relative flex items-center justify-between p-6 bg-sky-900/10 border border-sky-800 rounded-[2rem] hover:bg-sky-900/30 transition-all overflow-hidden"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-sky-950 rounded-2xl flex items-center justify-center text-cyan-400 shadow-xl group-hover:rotate-6 transition-transform overflow-hidden">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Grid className="w-7 h-7" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white tracking-tight">{cat.name}</h3>
                    <p className="text-xs text-sky-500 font-medium">Browse collection</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-sky-700 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
                
                {/* Decorative glow */}
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
