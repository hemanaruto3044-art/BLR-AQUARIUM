import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import ProductCard from '../components/ProductCard';
import ThreeBackground from '../components/ThreeBackground';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, Shield, Truck, Zap, Video, Filter, SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

const Home = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting State
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery) {
      setSelectedCategory(categoryQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catsRef = collection(db, 'categories');
        const catsSnapshot = await getDocs(query(catsRef, orderBy('name', 'asc')));
        const catsData = catsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(catsData);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const path = 'products';
    const q = query(
      collection(db, path), 
      orderBy('createdAt', 'desc'), 
      limit(24)
    );
    
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.isActive !== false);
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedProducts = products
    .filter(p => {
      const categoryMatch = selectedCategory === 'All' || p.category === selectedCategory;
      const priceMatch = p.price >= priceRange.min && p.price <= priceRange.max;
      const stockMatch = !inStockOnly || (p.stock > 0);
      return categoryMatch && priceMatch && stockMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const displayedProducts = filteredAndSortedProducts.slice(0, 12);

  return (
    <div className="relative">
      <ThreeBackground />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8"
          >
            <Sparkles className="w-3 h-3" />
            Curating rare aquatic life for premium collectors
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tighter mb-8 max-w-4xl"
          >
            YOUR PERSONAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">OCEAN</span> AWAITS.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-sky-200/60 max-w-2xl mb-10 leading-relaxed"
          >
            Explore the world's most exotic freshwater and marine species. Experience live video viewings before you buy with our state-of-the-art streaming system.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link 
              to="/categories"
              className="px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-lg flex items-center gap-3 group transition-all shadow-2xl shadow-cyan-600/30 active:scale-95 uppercase tracking-wider"
            >
              Go to Categories
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-12 border-y border-sky-900/50 bg-sky-900/10 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">Live Guarantee</h4>
              <p className="text-xs text-sky-400/70">Safe arrival or replacement</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              <Truck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">Express Shipping</h4>
              <p className="text-xs text-sky-400/70">Next day flight delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">Rare Finds</h4>
              <p className="text-xs text-sky-400/70">Limited exotic species only</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              <Video className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">Live Request</h4>
              <p className="text-xs text-sky-400/70">See them swim in real time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="categories" className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-8">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4 block">Store Collections</span>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">EXPLORE <span className="text-sky-800 stroke-cyan-500 stroke-1 italic">CATALOGUE</span></h2>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                    showFilters 
                      ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20" 
                      : "bg-sky-900/20 border-sky-800/50 text-sky-400 hover:bg-sky-900/40"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <div className="relative group">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-sky-900/20 border border-sky-800/50 text-sky-400 px-6 py-3 px-10 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                  <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Drawer */}
            <motion.div 
              initial={false}
              animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-sky-950/20 rounded-3xl border border-sky-800/30 backdrop-blur-md">
                {/* Category Selection */}
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
                    <Tag className="w-3 h-3" /> Species Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest border",
                        selectedCategory === 'All' 
                          ? "bg-cyan-600 border-cyan-500 text-white" 
                          : "bg-sky-900/40 border-sky-800/50 text-sky-500 hover:bg-sky-900/60"
                      )}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest border",
                          selectedCategory === cat.name 
                            ? "bg-cyan-600 border-cyan-500 text-white" 
                            : "bg-sky-900/40 border-sky-800/50 text-sky-500 hover:bg-sky-900/60"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
                    <SlidersHorizontal className="w-3 h-3" /> Price Range (₹)
                  </h4>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-sky-900/40 border border-sky-800/50 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/30 font-bold"
                    />
                    <span className="text-sky-800">—</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={priceRange.max > 100000 ? '' : priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 1000000 }))}
                      className="w-full bg-sky-900/40 border border-sky-800/50 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/30 font-bold"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="flex flex-col justify-center">
                  <button 
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className="flex items-center justify-between p-4 bg-sky-900/40 border border-sky-800/50 rounded-2xl hover:bg-sky-900/60 transition-all group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Available Stock Only</span>
                    <div className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      inStockOnly ? "bg-cyan-500" : "bg-sky-900"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        inStockOnly ? "left-6" : "left-1"
                      )} />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-sky-900/20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-sky-900/20 rounded-3xl border border-sky-800/50">
              <Sparkles className="w-12 h-12 text-sky-800 mx-auto mb-4" />
              <p className="text-sky-200/40 font-bold uppercase tracking-widest text-sm">Our divers are exploring. New arrivals soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
